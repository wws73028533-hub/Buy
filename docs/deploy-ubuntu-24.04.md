# Ubuntu 24.04 Docker Compose 部署指南

本文档适用于在 **Ubuntu 24.04 LTS** 服务器上，以 **Docker Compose + Nginx** 方式部署本项目。

## 1. 安装基础软件

更新系统并安装常用工具：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
```

## 2. 安装 Docker Engine 与 Compose 插件

按 Docker 官方 APT 仓库方式安装：

```bash
sudo apt remove -y docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc || true

sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

验证安装：

```bash
docker --version
docker compose version
sudo docker run hello-world
```

如需免 sudo 使用 Docker：

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 3. 拉取项目并准备配置

```bash
git clone https://github.com/wws73028533-hub/Buy.git
cd Buy
cp .env.example .env
```

编辑 `.env`，至少修改以下字段：

```bash
ADMIN_EMAIL=你的后台邮箱
ADMIN_PASSWORD=你的后台强密码
SESSION_SECRET=请替换为长度足够的随机字符串

POSTGRES_DB=buy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=请替换为数据库强密码

APP_PORT=3001
APP_BIND_IP=127.0.0.1
TRUST_PROXY=1
```

说明：

- `APP_BIND_IP=127.0.0.1` 表示仅监听服务器本机，推荐交给 Nginx 暴露到公网。
- `APP_PORT=3001` 是宿主机映射端口。
- `POSTGRES_PORT=55432` 默认也仅绑定到宿主机 `127.0.0.1`，不会直接暴露公网。

## 4. 使用 Docker Compose 启动

首次部署：

```bash
docker compose up -d --build
```

查看状态：

```bash
docker compose ps
docker compose logs -f app
```

健康检查：

```bash
curl http://127.0.0.1:3001/api/health
```

正常应返回：

```json
{"ok":true}
```

## 5. 配置 Nginx 反向代理

项目已提供示例配置：

- `deploy/nginx/buy.conf.example`

服务器上可以这样安装：

```bash
sudo cp deploy/nginx/buy.conf.example /etc/nginx/sites-available/buy.conf
sudo sed -i 's/example.com/你的域名/g' /etc/nginx/sites-available/buy.conf
sudo ln -sf /etc/nginx/sites-available/buy.conf /etc/nginx/sites-enabled/buy.conf
sudo nginx -t
sudo systemctl reload nginx
```

如果默认站点冲突，可移除：

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 6. 更新发布

```bash
git pull
docker compose up -d --build
```

## 7. 常用运维命令

查看日志：

```bash
docker compose logs -f app
docker compose logs -f postgres
```

重启服务：

```bash
docker compose restart app
docker compose restart postgres
```

停止服务：

```bash
docker compose down
```

仅停止应用但保留数据库卷：

```bash
docker compose stop app
```

## 8. 数据位置与备份建议

- PostgreSQL 数据卷：`buy_postgres_data`
- 上传文件卷：`buy_uploads_data`

备份数据库：

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > buy.sql
```

备份上传文件：

```bash
docker compose exec -T app tar czf - -C /app/uploads . > buy-uploads.tar.gz
```

## 9. 部署注意事项

- 请务必修改默认管理员账号、管理员密码、数据库密码和 `SESSION_SECRET`。
- 若你计划直接暴露应用端口到公网，可把 `APP_BIND_IP` 改成 `0.0.0.0`，但仍建议优先走 Nginx + HTTPS。
- 若 `POSTGRES_PASSWORD` 含 `@`、`:`、`/` 等特殊字符，请改成 URL 安全字符，避免数据库连接串解析歧义。
- Docker 发布到公网时，端口映射与主机防火墙规则可能产生叠加影响，因此本项目默认将应用与数据库端口都绑定到 `127.0.0.1`。
