# ❄️ Siablog

> 基于 Vite + React 的个人博客，冷调像素主题（Frost Monitor）。
> 摄影画廊 · 影评 · 书评 · 本地音乐播放器，带 SQLite 后端管理后台。

---

## ✨ 功能

- 🏠 **首页** — 打字机标题 + 粒子背景 + 社交链接组件 + 本地音乐播放器
- 📷 **摄影画廊** — CSS Column 瀑布流 + 灯箱预览 + 键盘左右切换
- 🎬 **影评** — 卡片网格 + 星级评分 + Markdown 长文详情
- 📚 **书评** — 卡片网格 + 星级评分 + Markdown 长文详情
- 🎵 **本地音乐** — 自动扫描 `public/audio/` 目录，播放列表 + 进度条 + 切歌
- 🔐 **管理后台** — JWT 登录、照片上传、影评/书评 CRUD 编辑
- 📱 **响应式** — 移动端汉堡菜单 + 自适应瀑布流
- 🖼️ **图片优化** — Sharp 批量转 WebP + 响应式懒加载（blur-up 占位）

---

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 同时启动前端(3000) + 后端(3001)
npm run dev

# 单独启动前端
npm run dev:front

# 单独启动后端（热重载）
npm run dev:server
```

Vite 自动将 `/api` 和 `/uploads` 代理到后端 `localhost:3001`。

---

## 📦 生产构建

```bash
# 构建前端静态文件到 dist/
npm run build

# 启动生产服务器（Express 托管 dist/ + API）
npm start
```

---

## 🎵 本地音乐播放器

将音乐文件放入 `public/audio/` 目录即可在首页播放。支持的格式：

| 格式 | 扩展名 |
|------|--------|
| MP3 | `.mp3` |
| FLAC | `.flac` |
| WAV | `.wav` |
| OGG | `.ogg` |
| AAC | `.aac` |
| M4A | `.m4a` |
| WMA | `.wma` |

### 功能特性
- **播放列表**：自动列出所有音频文件，点击曲目播放
- **播放控制**：播放/暂停、上一首/下一首
- **进度条**：点击或拖拽跳转到指定位置
- **键盘快捷键**：空格键 播放/暂停
- **自动切换**：当前曲目结束后自动播放列表下一首（循环）

---

## 🔐 管理员设置

```bash
# 创建管理员账户
npm run setup <用户名> <密码>

# 修改密码（重复执行即可覆盖）
npm run setup <用户名> <新密码>
```

启动服务器后访问 `/admin`，输入用户名密码登录。

管理后台功能：
- **Dashboard** — 各模块数据概览
- **Photos** — 上传/编辑/删除照片，支持相机型号、地点、拍摄日期、备注
- **Movies** — 新建/编辑/删除影评，上传海报，Markdown 正文
- **Books** — 新建/编辑/删除书评，上传封面，Markdown 正文

---

## 🌐 服务器部署

### 环境要求

- Ubuntu 20.04+ / Debian 11+
- Node.js 18+（推荐 20 LTS）
- Nginx（可选，用于 80/443 端口反代）

### 首次部署

```bash
# 1. 克隆项目
git clone git@github.com:monaksia/sia-plog.git
cd sia-plog

# 2. 安装依赖
npm install

# 3. 构建前端静态文件
npm run build

# 4. 创建管理员账户
npm run setup admin 你的密码

# 5. 启动服务（直接运行，测试用）
npm start
# 访问 http://你的IP:3001 即可看到博客
```

### PM2 守护进程（推荐）

PM2 可以在服务崩溃后自动重启，并支持开机自启。

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start server/index.js --name sia-plog

# 查看状态
pm2 status

# 查看日志
pm2 logs sia-plog

# 设置开机自启
pm2 save
pm2 startup          # 按照输出的提示执行对应命令
```

### Nginx 反向代理

将 Node 服务代理到 80（HTTP）/ 443（HTTPS）端口。

```bash
# 创建站点配置
sudo nano /etc/nginx/sites-available/sia-plog
```

参考以下配置（或直接复制项目中的 `nginx.conf.example`）：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # API 转发给 Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传的图片
    location /uploads/ {
        alias /home/your-user/sia-plog/server/uploads/;
    }

    # 静态文件 + SPA 回退
    location / {
        root /home/your-user/sia-plog/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/sia-plog /etc/nginx/sites-enabled/
sudo nginx -t           # 检查配置语法
sudo systemctl reload nginx

# HTTPS（可选，使用 Let's Encrypt 免费证书）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 后续更新

本地 push 代码后，在服务器上执行：

```bash
cd sia-plog
git pull                 # 拉取最新代码
npm install              # 依赖没变化可跳过
npm run build            # 重新构建前端
pm2 restart sia-plog     # 重启服务
```

### 常见问题

**端口被占用**
```bash
lsof -i :3001            # 查看占用进程
kill -9 <PID>            # 结束进程
```

**PM2 启动失败**
```bash
pm2 logs sia-plog --lines 50   # 查看最近 50 行日志排查
```

**上传图片 404**
检查 `server/uploads/` 目录是否存在且有写入权限。Nginx 用户确保 `uploads` 路径指向正确。

---

## 📁 项目结构

```
sia-plog/
├── index.html                    # Vite 入口 HTML
├── vite.config.js                # Vite 配置（含 API 代理）
├── package.json                  # 依赖 + 脚本
├── nginx.conf.example            # Nginx 配置模板
│
├── public/                       # 静态资源
│   ├── audio/                    # 本地音乐文件（mp3/flac/wav/ogg 等）
│   ├── img/                      # 图片 + 优化后的 WebP
│   ├── covers/                   # 影评/书评封面占位图
│   └── photos/                   # 摄影作品（手动放入）
│
├── server/                       # 后端
│   ├── index.js                  # Express 入口
│   ├── db.js                     # SQLite 数据库初始化 + Migration
│   ├── auth.js                   # JWT 签发 + 认证中间件
│   ├── setup.js                  # 管理员创建脚本
│   ├── routes/
│   │   ├── auth.js               # 登录 API
│   │   ├── photos.js             # 照片 CRUD + 上传
│   │   ├── movies.js             # 影评 CRUD + 海报上传
│   │   ├── books.js              # 书评 CRUD + 封面上传
│   │   └── music.js              # 本地音乐文件列表
│   └── uploads/                  # 后台上传的图片（gitignored）
│
├── src/                          # 前端
│   ├── main.jsx                  # React 入口
│   ├── App.jsx                   # 路由配置
│   ├── api.js                    # API 客户端（统一请求 + JWT Token 管理）
│   ├── components/
│   │   ├── Navbar.jsx/css        # 导航栏（毛玻璃 + 移动端汉堡菜单）
│   │   ├── Layout.jsx            # 页面布局壳
│   │   ├── StarRating.jsx        # 星级评分
│   │   ├── LazyImage.jsx         # 响应式懒加载（blur-up 占位）
│   │   ├── Typewriter.jsx        # 打字机特效
│   │   ├── AudioPlayer.jsx       # 本地音乐播放器
│   │   ├── SocialLinks.jsx       # 社交链接 beacon 组件
│   │   ├── ParticleBackground.jsx # 浮动粒子背景
│   │   └── AdminGuard.jsx        # 后台路由守卫
│   ├── pages/
│   │   ├── Home.jsx              # 首页
│   │   ├── Photography.jsx/css   # 摄影画廊（瀑布流 + 灯箱）
│   │   ├── MovieReviews.jsx      # 影评列表页
│   │   ├── BookReviews.jsx       # 书评列表页
│   │   ├── ReviewDetail.jsx      # 评论详情页（影评/书评复用）
│   │   ├── Reviews.css           # 评论页样式
│   │   └── Admin/                # 管理后台
│   │       ├── Admin.css
│   │       ├── AdminLogin.jsx
│   │       ├── AdminLayout.jsx
│   │       ├── Dashboard.jsx
│   │       ├── PhotosManager.jsx
│   │       ├── MoviesManager.jsx
│   │       ├── BooksManager.jsx
│   │       ├── ReviewEditor.jsx
│   │       └── ReviewEditPage.jsx
│   ├── data/                     # 静态示例数据（API 离线时回退）
│   │   ├── photos.js
│   │   ├── movies.js
│   │   └── books.js
│   └── styles/
│       ├── reset.css
│       ├── variables.css         # CSS 变量（Frost Monitor 冷调主题）
│       └── main.css
│
└── scripts/
    └── optimize-images.mjs       # Sharp 批量图片转 WebP
```

---

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 |
| 构建工具 | Vite 8 |
| 路由 | React Router v7 |
| 样式 | CSS Custom Properties（Frost Monitor 冷调像素主题） |
| Markdown | react-markdown |
| 后端 | Express 5 |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 图片处理 | Sharp（批量转 WebP）|
| 文件上传 | Multer |

---

## 📝 数据存储

- **数据库**：`server/data.db`（自动创建，已 gitignore）
- **上传图片**：`server/uploads/`（已 gitignore）
- **示例数据**：`src/data/` 目录中的 JS 文件作为 API 离线时的回退

数据库包含四张表：

| 表 | 用途 |
|----|------|
| `users` | 管理员账户 |
| `photos` | 摄影作品（src、alt、camera、location、date_taken、notes） |
| `movies` | 影评（标题、导演、演员、类型、评分、Markdown 正文等） |
| `books` | 书评（标题、作者、出版社、类型、评分、Markdown 正文等） |

---

## 🎨 主题 — Frost Monitor

冷调像素主题基于 CSS 自定义属性（`src/styles/variables.css`），灵感来自 CRT 监视器 + 极简代码编辑器。

| 角色 | 色值 | 用途 |
|------|------|------|
| Background | `#0b1018` | 深蓝黑底色 |
| Surface | `#141b25` | 卡片/区块 |
| Primary | `#5b9bd5` | 冷蓝 — 链接/按钮 |
| Accent | `#a78bfa` | 淡紫 — 评分/高亮 |
| Text | `#e2e8f0` | 冷调白正文 |
| Text Dim | `#7389a5` | 钢蓝灰次要文字 |

**字体**：VT323（展示） + Inter（正文） + JetBrains Mono（等宽/元数据）

**纹理**：细密点阵背景 + CRT 扫描线叠加（桌面端）

---

## 🖼️ 图片优化

```bash
# 将源图放入 public/img/ 后运行
npm run optimize-images
```

脚本会生成 WebP 格式并输出多尺寸变体（400w / 800w / 1200w），前端 `<LazyImage>` 组件自动选择合适尺寸并实现模糊占位懒加载。

---

## 📄 License

MIT

---

## 🗓️ 开发日志

| 日期 | 事项 |
|------|------|
| 2026-07 | 社交链接 beacon 组件（GitHub / 微博 / Bilibili），悬停雷达脉冲动画 |
| 2026-07 | 冷调像素主题重构（Frost Monitor），CRT 扫描线 + 粒子背景 |
| 2026-07 | 本地音乐播放器取代网易云 API，支持播放列表/进度条/切歌 |
| 2026-07 | 照片管理后台优化：新增拍摄地点、日期、备注字段 |
| 2026-07 | 瀑布流画廊 + Magnum 风格灯箱（键盘导航） |
| 2026-07 | 全栈博客 MVP：摄影/影评/书评 + SQLite + JWT 后台 |
| 2026-06 | 项目初始化，Vite + React 迁移 |
