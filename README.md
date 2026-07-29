# Sia Plog — Personal Archive

> 基于 Vite + React 的个人博客，杂志编辑风格（Magazine Editorial）。
> 摄影画廊 · 影评 · 书评 · 本地音乐播放器，带 SQLite 后端管理后台。

---

## 功能

- **首页** — 打字机标题 + 杂志封面排版 + 社交 beacon 组件 + 本地音乐播放器
- **摄影画廊** — 杂志跨页布局（封面大图 / 跨页对开 / 网格画廊）+ 筛选栏 + 胶片条灯箱
- **影评** — 编辑风卡片列表 + 星级评分 + Markdown 长文（下拉大写、引用块）
- **书评** — 同上，含作者 / 出版社 / 类型元数据
- **本地音乐** — 自动扫描 `public/audio/` 目录，播放列表 + 进度条 + 切歌
- **管理后台** — JWT 登录、照片上传（自动 Sharp 压缩 + 缩略图）、影评/书评 CRUD
- **AI 抠图底图** — 首页固定角角色剪影，rembg 去背景 + WebP 压缩
- **交互动画** — framer-motion 页面过渡 + IntersectionObserver 滚动揭示
- **响应式** — 全平台适配（375px / 640px / 768px / 1024px / 1440px）
- **图片优化** — Sharp 上传即转 WebP（2000px）+ 400px 缩略图，Nginx 缓存头

---

## 本地开发

### 环境要求

- Node.js 18+（推荐 20 LTS）
- npm 9+

### 启动

```bash
# 安装依赖
npm install

# 同时启动前端 (port 3000) + 后端 (port 3001)
npm run dev

# 单独启动前端
npm run dev:front

# 单独启动后端（热重载）
npm run dev:server
```

Vite 自动将 `/api`、`/uploads`、`/audio` 代理到后端 `localhost:3001`。

### 生产构建

```bash
npm run build    # 构建前端静态文件到 dist/
npm start        # 启动生产服务器（Express 托管 dist/ + API）
```

---

## 设计系统 — Magazine Editorial

杂志编辑风格基于 CSS 自定义属性（`src/styles/variables.css`），采用 Swiss Modernism 2.0 网格体系。

### 配色

| 角色 | 色值 | 用途 |
|------|------|------|
| Background | `#08080A` | 近黑纸底色 |
| Surface | `#0F0F11` | 卡片 / 区块 |
| Primary | `#EC4899` | 杂志粉 — 链接 / 按钮 / 强调 |
| Accent | `#F472B6` | 浅粉 — 星级 / 高亮 |
| Text | `#F4F4F5` | 暖灰白正文 |
| Text Dim | `#A1A1AA` | 暖灰次要文字 |

### 字体

| 角色 | 字体 |
|------|------|
| 展示标题 | Libre Bodoni (serif) |
| 正文 | Public Sans (sans-serif) |
| 等宽 / 元数据 | JetBrains Mono |

### 字号梯度

| Token | 值 | 用途 |
|-------|-----|------|
| `--text-4xl` | `5rem` | 封面标题 |
| `--text-3xl` | `3.5rem` | 页面主标题 |
| `--text-2xl` | `2.5rem` | 板块标题 |
| `--text-xl` | `1.75rem` | 子标题 |
| `--text-base` | `1.0625rem` | 正文 (17px) |
| `--text-sm` | `0.875rem` | 元数据 |

---

## 本地音乐播放器

将音乐文件放入 `public/audio/` 目录即可在首页播放。支持的格式：

| 格式 | 扩展名 |
|------|--------|
| MP3 | `.mp3` |
| FLAC | `.flac` |
| WAV | `.wav` |
| OGG | `.ogg` |
| AAC | `.aac` |
| M4A | `.m4a` |

### 操作方式

- **播放列表**：自动扫描并列出所有音频文件，点击曲目播放
- **播放控制**：播放 / 暂停、上一首 / 下一首
- **进度条**：点击跳转到指定位置
- **键盘快捷键**：空格键 播放 / 暂停
- **自动切换**：当前曲目结束后自动播放列表下一首（循环）

---

## 图片处理

### 上传即优化

后台通过 Sharp 在上传时自动处理每一张照片：

| 输出 | 规格 | 用途 |
|------|------|------|
| 主图 WebP | 2000px 宽, quality 80 | 画廊 + 灯箱 |
| 缩略图 WebP | 400px 宽, quality 70 | 管理后台网格 |

原图在上传处理完成后自动删除，不占用磁盘。前端摄影画廊自动使用缩略图加载网格预览，点击进入灯箱时切换为主图。

### 历史图片批量转换

```bash
# 将 server/uploads/ 中的旧 JPG/PNG 转为 WebP 并生成缩略图
node -e "
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
// ... 遍历、转换、更新 DB
"
```

---

## 管理员设置

```bash
# 创建管理员账户
npm run setup <用户名> <密码>

# 修改密码（重复执行即可覆盖）
npm run setup <用户名> <新密码>
```

访问 `/admin`，输入用户名密码登录。

管理后台功能：

| 模块 | 功能 |
|------|------|
| Dashboard | 各模块数据概览 |
| Photos | 上传 / 编辑 / 删除照片，设置相机型号、地点、拍摄日期、备注 |
| Movies | 新建 / 编辑 / 删除影评，上传海报，Markdown 正文 |
| Books | 新建 / 编辑 / 删除书评，上传封面，Markdown 正文 |

---

## 服务器部署

### 环境要求

- Ubuntu 20.04+ / Debian 11+
- Node.js 18+（推荐 20 LTS）
- Nginx（可选，用于 80/443 端口反代）
- Git

### 首次部署

```bash
# 1. 克隆项目
git clone git@github.com:monaksia/sia-plog.git
cd sia-plog

# 2. 安装依赖
npm install

# 3. 构建前端
npm run build

# 4. 创建管理员账户
npm run setup admin 你的密码

# 5. 启动服务
npm start
# 访问 http://你的IP:3001
```

### PM2 守护进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start server/index.js --name sia-plog

# 常用命令
pm2 status              # 查看状态
pm2 logs sia-plog       # 查看日志
pm2 restart sia-plog    # 重启

# 开机自启
pm2 save
pm2 startup             # 按输出提示执行对应命令
```

### Nginx 反向代理

参考项目中的 `nginx.conf.example`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 上传文件大小限制
    client_max_body_size 20m;

    # 上传图片（含缩略图）+ 浏览器缓存
    location /uploads/ {
        alias /home/your-user/sia-plog/server/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 本地音乐文件
    location /audio/ {
        alias /home/your-user/sia-plog/public/audio/;
    }

    # API 转发
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
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
sudo nginx -t && sudo systemctl reload nginx

# HTTPS（可选，Let's Encrypt 免费证书）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 后续更新

```bash
cd /var/www/sia-plog
git pull
npm install              # 依赖无变化可跳过
npm run build
pm2 restart sia-plog
```

### 常见问题

**端口被占用**
```bash
lsof -i :3001            # 查看占用进程
kill -9 <PID>            # 结束进程
```

**PM2 启动失败**
```bash
pm2 logs sia-plog --lines 50
```

**上传图片 404**
- 检查 `server/uploads/` 目录是否存在且有写入权限
- Nginx 确保 `alias` 路径使用**绝对路径**且以 `/` 开头
- 确认 `client_max_body_size` 不小于 20m

**音乐文件不播放 (production)**
- 确认 Nginx 配置中有 `/audio/` 的 `alias` 块
- 音乐文件必须放在 `public/audio/`（不是 `dist/audio/`）

**页面空白 / 样式异常**
- 确认执行了 `npm run build` 重新构建前端
- 清除浏览器缓存（Ctrl+Shift+R）

---

## 项目结构

```
sia-plog/
├── index.html                    # Vite 入口 HTML（含 SEO meta）
├── vite.config.js                # Vite 配置（API 代理）
├── package.json                  # 依赖 + 脚本
├── nginx.conf.example            # Nginx 配置模板（含缓存 + 音频）
│
├── public/                       # 静态资源
│   ├── audio/                    # 本地音乐文件
│   ├── img/                      # 图片 + WebP + 抠图角色
│   └── covers/                   # 影评/书评占位封面
│
├── server/                       # 后端
│   ├── index.js                  # Express 入口（静态文件 + SPA fallback）
│   ├── db.js                     # SQLite 初始化 + Migration
│   ├── auth.js                   # JWT 签发 + 认证中间件
│   ├── setup.js                  # 管理员创建脚本
│   ├── routes/
│   │   ├── auth.js               # 登录 API
│   │   ├── photos.js             # 照片 CRUD + Sharp 压缩上传
│   │   ├── movies.js             # 影评 CRUD + 海报上传
│   │   ├── books.js              # 书评 CRUD + 封面上传
│   │   └── music.js              # 本地音乐文件扫描
│   └── uploads/                  # 上传图片（gitignored）
│       └── thumbs/               # 缩略图（400px WebP）
│
├── src/                          # 前端
│   ├── main.jsx                  # React 入口 + 全局 Reveal Observer
│   ├── App.jsx                   # 路由配置
│   ├── api.js                    # API 客户端（fetch + JWT）
│   ├── components/
│   │   ├── Navbar.jsx/css        # 导航栏（滚动进度条 + 全屏移动菜单）
│   │   ├── Layout.jsx            # 页面布局（含 PageTransition）
│   │   ├── PageTransition.jsx    # framer-motion 路由过渡动画
│   │   ├── StarRating.jsx        # 星级评分
│   │   ├── LazyImage.jsx         # 响应式懒加载（blur-up）
│   │   ├── Typewriter.jsx        # 打字机特效
│   │   ├── AudioPlayer.jsx       # 本地音乐播放器
│   │   ├── SocialLinks.jsx       # 社交链接 beacon（雷达脉冲动画）
│   │   ├── ParticleBackground.jsx # 粒子背景（已停用）
│   │   └── AdminGuard.jsx        # 后台路由守卫
│   ├── hooks/
│   │   └── useScrollReveal.js    # IntersectionObserver 滚动揭示 Hook
│   ├── pages/
│   │   ├── Home.jsx              # 首页（杂志封面布局）
│   │   ├── Photography.jsx/css   # 摄影画廊（跨页布局 + 筛选 + 胶片灯箱）
│   │   ├── MovieReviews.jsx      # 影评列表
│   │   ├── BookReviews.jsx       # 书评列表
│   │   ├── ReviewDetail.jsx      # 详情页（下拉大写 + 编辑署名）
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
│   ├── data/                     # 静态示例数据（API 离线回退）
│   │   ├── photos.js
│   │   ├── movies.js
│   │   └── books.js
│   └── styles/
│       ├── reset.css
│       ├── variables.css         # CSS 变量（Magazine Editorial 设计令牌）
│       └── main.css              # 全局样式（编辑排版 + 网格 + 动画）
│
└── scripts/
    └── optimize-images.mjs       # Sharp 批量图片转 WebP 脚本
```

---

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | React | ^19.2 |
| 构建工具 | Vite | ^8.1 |
| 路由 | React Router | ^7.18 |
| 动效 | framer-motion | ^12.4 |
| Markdown | react-markdown | ^10.1 |
| 照片布局 | react-photo-album | ^3.6 |
| 样式 | CSS Custom Properties（Magazine Editorial） | — |
| 后端 | Express | ^5.2 |
| 数据库 | SQLite (better-sqlite3) | ^13.0 |
| 认证 | JWT (jsonwebtoken + bcryptjs) | — |
| 图片处理 | Sharp | ^0.35 |
| AI 抠图 | rembg (Python) | — |
| 文件上传 | Multer | ^2.2 |

---

## 数据存储

- **数据库**：`server/data.db`（自动创建，已 gitignore）
- **上传图片**：`server/uploads/`（已 gitignore）
- **回退数据**：`src/data/` — API 离线时自动使用

数据库包含四张表：

| 表 | 字段 |
|----|------|
| `users` | username, password_hash, created_at |
| `photos` | src, alt, camera, location, date_taken, notes, thumb |
| `movies` | slug, title, title_en, poster, year, director, cast, genre, rating, tags, excerpt, review |
| `books` | slug, title, title_en, author, cover, year, publisher, genre, rating, tags, excerpt, review |

---

## 贡献指南

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交变更：`git commit -m 'feat: add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### Commit 规范

| 前缀 | 用途 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | 修复 bug |
| `perf:` | 性能优化 |
| `docs:` | 文档更新 |
| `style:` | 样式 / 主题变更 |

---

## 许可

MIT License

---

## 联系方式

- **GitHub**：[github.com/monaksia](https://github.com/monaksia)
- **微博**：[weibo.com/siaaaa](https://weibo.com/siaaaa)
- **Bilibili**：[space.bilibili.com/329907805](https://space.bilibili.com/329907805)

---

## 开发日志

| 日期 | 事项 |
|------|------|
| 2026-07 | 杂志编辑风格全面改版：Swiss Modernism 2.0 + Libre Bodoni / Public Sans，近黑 + 粉配色 |
| 2026-07 | framer-motion 页面过渡 + IntersectionObserver 全局滚动揭示 |
| 2026-07 | 摄影页重构：杂志跨页布局（hero / spread / grid）、筛选栏、胶片条灯箱 |
| 2026-07 | 首页底图 AI 抠图角色：rembg 去背景 + WebP 压缩至 25KB |
| 2026-07 | 社交链接 beacon 组件：GitHub / 微博 / Bilibili，悬停雷达脉冲动画 |
| 2026-07 | 冷调像素主题重构 (Frost Monitor)，CRT 扫描线 + 粒子背景 |
| 2026-07 | 照片上传 Sharp 自动压缩 WebP + 400px 缩略图 + Nginx 缓存头 |
| 2026-07 | 本地音乐播放器：自动扫描 + 播放列表 + 进度条 + 切歌 |
| 2026-07 | 照片管理后台优化：新增拍摄地点、日期、备注字段 |
| 2026-07 | 瀑布流画廊 + Magnum 风格灯箱（键盘导航） |
| 2026-07 | 全栈博客 MVP：摄影 / 影评 / 书评 + SQLite + JWT 后台 |
| 2026-06 | 项目初始化，Vite + React 迁移 |
