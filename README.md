# 甄选好物馆（React + Express + PostgreSQL）

这是一个适合**部署到公网服务器**的消费者导向商品展示网站，包含：

- 首页商品图片 + 标题展示
- 商品详情页（富文本内容可自由编辑）
- 首页售后联系方式（支持文字、链接、二维码）
- 首页教程文档（支持外部链接和站内文件）
- 后台管理员登录与内容管理
- PostgreSQL 云端/服务器数据库持久化
- 服务器本地文件上传（商品图、教程文件、二维码）

## 技术结构

- 前端：React + Vite + TypeScript + Tailwind CSS
- 后端：Express + TypeScript
- 数据库：PostgreSQL
- 上传文件：服务器本地 `uploads/` 目录

## 本地开发启动

### 1）配置环境变量

复制配置文件：

```bash
cp .env.example .env
```

关键内容如下：

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/buy
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
SESSION_SECRET=change-this-in-production
PORT=3001
POSTGRES_DB=buy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=55432
APP_PORT=3001
APP_BIND_IP=127.0.0.1
```

可选生产环境变量：

```bash
# HOST=0.0.0.0
# TRUST_PROXY=1
# UPLOADS_DIR=/var/www/buy/uploads
```

### 2）启动前后端开发环境

```bash
npm install
npm run dev
```

> `npm run dev` 会自动拉起本地 PostgreSQL Docker 容器（端口 `55432`），然后同时启动后端和前端。

启动后：

- 前台：`http://127.0.0.1:5173/`
- 后台：`http://127.0.0.1:5173/admin`
- API：`http://127.0.0.1:3001/api/health`

## 默认管理员账号

开发环境默认使用：

- 邮箱：`admin@example.com`
- 密码：`change-me`

> **重要：正式上线前必须修改** `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`。

## 数据库初始化

服务端启动时会自动执行：

- `postgres/init.sql`

也就是：

- 自动建表
- 自动创建更新时间触发器
- 空库时自动写入 1 组消费者导向演示数据（商品、使用指南、咨询售后入口）

无需再手动执行 SQL。

## 生产部署建议

### 推荐方案：Docker Compose + Nginx

项目已补齐以下生产部署文件：

- `/Users/saksk/Desktop/project/Buy/Dockerfile`
- `/Users/saksk/Desktop/project/Buy/docker-compose.yml`
- `/Users/saksk/Desktop/project/Buy/deploy/nginx/buy.conf.example`
- `/Users/saksk/Desktop/project/Buy/docs/deploy-ubuntu-24.04.md`

最小部署步骤：

```bash
cp .env.example .env
# 修改 ADMIN_EMAIL / ADMIN_PASSWORD / SESSION_SECRET / POSTGRES_PASSWORD
docker compose up -d --build
```

默认规则：

- 应用容器内部监听：`3001`
- 宿主机默认映射：`127.0.0.1:3001`
- PostgreSQL 默认映射：`127.0.0.1:55432`
- 上传文件保存在 Docker volume：`buy_uploads_data`
- PostgreSQL 数据保存在 Docker volume：`buy_postgres_data`

推荐再通过 Nginx 反向代理域名到 `127.0.0.1:3001`，并配置 HTTPS。

完整 Ubuntu 24.04 部署指南见：

- `/Users/saksk/Desktop/project/Buy/docs/deploy-ubuntu-24.04.md`

### 备用方案：直接在宿主机运行 Node

如果你不想用 Docker，也可以继续沿用宿主机 Node 方式：

1. 安装 Node.js 20+
2. 启动 PostgreSQL
3. 配置 `.env`
4. 执行：

```bash
npm ci
npm run build
npm start
```

此模式下：

- 如需外网直连 Node 服务，可设置 `HOST=0.0.0.0`
- 如通过 Nginx / SLB / 反向代理转发，请设置 `TRUST_PROXY=1`
- 如需把上传目录放到独立磁盘，可设置 `UPLOADS_DIR=/your/path/uploads`

## 文件与数据位置

- Docker Compose 模式：
  - PostgreSQL 数据：Docker volume `buy_postgres_data`
  - 上传文件目录：Docker volume `buy_uploads_data`
- 宿主机 Node 模式：
  - 上传文件目录：项目根目录下的 `uploads/`（可通过 `UPLOADS_DIR` 改为 Linux 绝对路径）

> 正式部署时请注意备份数据库和上传文件。

## 页面说明

- `/`：前台首页
- `/products/:slug`：商品详情页
- `/admin/login`：后台登录
- `/admin`：后台管理

## 常用命令

```bash
npm run dev        # 前后端开发模式
npm run build      # 构建前端 + 后端
npm start          # 强制以生产模式启动服务
npm run compose:build # 构建 Docker 镜像
npm run compose:up    # 构建并启动 Docker Compose
npm run compose:down  # 停止 Docker Compose
npm run compose:logs  # 查看应用容器日志
npm run lint       # 代码检查
npm run db:up      # 启动 PostgreSQL 容器
npm run db:down    # 停止 PostgreSQL 容器
npm run db:logs    # 查看 PostgreSQL 日志
```
