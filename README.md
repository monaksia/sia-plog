# 🎮 Siablog

> 基于 Vite + React 的个人博客，Minecraft 像素主题风格。
> 支持摄影画廊、影评、书评，带 SQLite 后端管理后台。

---

## ✨ 功能

- 🏠 **首页** — 打字机标题 + 像素粒子背景 + 音频播放器
- 📷 **摄影画廊** — 瀑布流布局 + 灯箱预览 + 键盘导航
- 🎬 **影评** — 卡片网格 + 星级评分 + Markdown 长文详情
- 📚 **书评** — 竖版封面 + 阅读状态 + Markdown 长文详情
- 🔐 **管理后台** — JWT 登录、照片上传、影评/书评 CRUD 编辑
- 📱 **响应式** — 移动端汉堡菜单 + 自适应布局
- 🖼️ **图片优化** — WebP 多尺寸 + 模糊占位懒加载

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
- **Photos** — 上传/编辑/删除照片
- **Movies** — 新建/编辑/删除影评，上传海报
- **Books** — 新建/编辑/删除书评，上传封面

影评和书评正文支持 **Markdown** 格式。

---

## 🌐 服务器部署

```bash
# 1. 克隆项目
git clone https://github.com/monaksia/sia-plog.git
cd sia-plog

# 2. 安装依赖 + 构建
npm install
npm run build

# 3. 创建管理员
npm run setup admin 你的密码

# 4. 使用 PM2 守护进程
npm install -g pm2
pm2 start server/index.js --name sia-plog
pm2 save && pm2 startup

# 5. 配置 Nginx（参考 nginx.conf.example）
```

### Nginx 配置要点

```nginx
# API 转发
location /api/ { proxy_pass http://127.0.0.1:3001; }

# 上传图片
location /uploads/ { alias /path/to/sia-plog/server/uploads/; }

# 静态文件 + SPA 路由回退
location / { root /path/to/sia-plog/dist; try_files $uri /index.html; }
```

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
│   ├── audio/                    # 音乐文件
│   ├── img/                      # 图片 + 优化后的 WebP
│   ├── covers/                   # 影评/书评封面占位图
│   └── photos/                   # 摄影作品（手动放入）
│
├── server/                       # 后端
│   ├── index.js                  # Express 入口
│   ├── db.js                     # SQLite 数据库初始化
│   ├── auth.js                   # JWT 认证
│   ├── setup.js                  # 管理员创建脚本
│   ├── routes/
│   │   ├── auth.js               # 登录 API
│   │   ├── photos.js             # 照片 CRUD + 上传
│   │   ├── movies.js             # 影评 CRUD + 海报上传
│   │   └── books.js              # 书评 CRUD + 封面上传
│   └── uploads/                  # 后台上传的图片（gitignored）
│
├── src/                          # 前端
│   ├── main.jsx                  # React 入口
│   ├── App.jsx                   # 路由配置
│   ├── api.js                    # API 客户端（自动回退静态数据）
│   ├── components/
│   │   ├── Navbar.jsx/css        # 像素风格导航栏
│   │   ├── Layout.jsx            # 页面布局壳
│   │   ├── StarRating.jsx        # 像素星星评分
│   │   ├── LazyImage.jsx         # 响应式懒加载图片
│   │   ├── Typewriter.jsx        # 打字机效果
│   │   ├── AudioPlayer.jsx       # 自定义音频播放器
│   │   ├── ParticleBackground.jsx # 粒子背景
│   │   └── AdminGuard.jsx        # 后台路由守卫
│   ├── pages/
│   │   ├── Home.jsx              # 首页
│   │   ├── Photography.jsx/css   # 摄影画廊页
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
│       ├── variables.css         # CSS 变量（MC 像素主题）
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
| 样式 | CSS Custom Properties（像素主题） |
| 画廊 | react-photo-album |
| Markdown | react-markdown |
| 后端 | Express 5 |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 图片处理 | Sharp（批量转 WebP） |
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
| `photos` | 摄影作品 |
| `movies` | 影评（标题、导演、评分、Markdown 正文等） |
| `books` | 书评（标题、作者、评分、Markdown 正文等） |

---

## 🎨 主题

像素风格主题基于 CSS 自定义属性（`src/styles/variables.css`）：

- 暗色背景 `#1a1a1e` + 草绿色 `#5b8731` + 金色高亮 `#ffaa00`
- 像素字体 `Press Start 2P` + `VT323`
- 像素阴影 `2px 2px 0` + 双层边框

预留了 `[data-theme="light"]` 亮色主题变量，切换即可启用。

---

## 📄 License

MIT
