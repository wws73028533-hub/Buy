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

默认内容如下：

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/buy
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
SESSION_SECRET=change-this-in-production
PORT=3001
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

### 最小可用方案

1. 准备一台公网 Linux 服务器
2. 安装：Node.js 20+、Docker、Docker Compose
3. 启动 PostgreSQL：

```bash
docker compose up -d postgres
```

4. 配置 `.env`
   - 必须修改：`ADMIN_EMAIL`、`ADMIN_PASSWORD`、`SESSION_SECRET`
   - 如需外网直连 Node 服务，可设置 `HOST=0.0.0.0`
   - 如通过 Nginx / SLB / 反向代理转发，请设置 `TRUST_PROXY=1`
   - 如需把上传目录放到独立磁盘，可设置 `UPLOADS_DIR=/your/path/uploads`
5. 构建前端和后端：

```bash
npm ci
npm run build
```

6. 启动生产服务：

```bash
npm start
```

> `npm start` 会强制以生产模式启动后端，并读取 `server-dist/index.js`。

默认监听：

- `0.0.0.0:3001`（生产环境）

建议再配 Nginx，把域名反代到 `3001`，并开启 HTTPS。

## 文件与数据位置

- PostgreSQL 数据：Docker volume `buy_postgres_data`
- 上传文件目录：项目根目录下的 `uploads/`（可通过 `UPLOADS_DIR` 改为 Linux 绝对路径）

> 正式部署时请注意备份数据库和 `uploads/` 目录。

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
npm run lint       # 代码检查
npm run db:up      # 启动 PostgreSQL 容器
npm run db:down    # 停止 PostgreSQL 容器
npm run db:logs    # 查看 PostgreSQL 日志
```
