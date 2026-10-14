> 当前生产运维、备份和部署配置以 [OPERATIONS.md](OPERATIONS.md) 为准。

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

- Node.js 24.x（当前验证版本 24.18.0，参见 `.nvmrc`）
- npm 9+

### 启动

```bash
# 安装依赖
npm ci

# 配置开发用的强随机 JWT_SECRET（必需）；生产使用 /etc/siaplog/app.env
export JWT_SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64url'))")"

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

开发时将音乐文件放入 `public/audio/`，生产使用 `/var/lib/siaplog/audio`（可用 `SIA_AUDIO_DIR` 覆盖）。音频不随前端构建或 Git 发布。支持的格式：

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
| 中图 WebP | 1000px 宽, quality 78 | 响应式画廊 |
| 缩略图 WebP | 400px 宽, quality 70 | 管理后台及小屏预览 |

原图在上传处理完成后自动删除，不占用磁盘。前端摄影画廊自动使用缩略图加载网格预览，点击进入灯箱时切换为主图。

### 现有照片补齐变体

脚本保留既有主图 URL，为照片补齐缩略图和中图。运行前先备份；生产执行时指定持久化数据目录：

```bash
SIA_DATA_DIR=/var/lib/siaplog /var/www/sia-plog/.runtime/node scripts/upgrade-images.mjs
```

---

## 管理员设置

```bash
# 创建管理员账户
npm run setup <用户名> <密码>

# 修改密码（重复执行即可覆盖）
npm run setup <用户名> <新密码>
```

密码至少 12 字符；生产执行设置脚本时需指定 `SIA_DATA_DIR=/var/lib/siaplog`。修改密码会撤销该账户全部会话。访问 `/admin` 登录，会话有效期 8 小时，登出会撤销当前会话。

管理后台功能：

| 模块 | 功能 |
|------|------|
| Dashboard | 各模块数据概览 |
| Photos | 上传 / 编辑 / 删除照片，设置相机型号、地点、拍摄日期、备注 |
| Movies | 新建 / 编辑 / 删除影评，上传海报，Markdown 正文 |
| Books | 新建 / 编辑 / 删除书评，上传封面，Markdown 正文 |

---

## 服务器部署

生产部署及备份恢复说明见 [OPERATIONS.md](OPERATIONS.md)。环境使用 Node.js 24.x，当前验证版本为 `.nvmrc` 中的 24.18.0。

- 代码位于 `/var/www/sia-plog`，API 由 `siaplog.service` 管理，使用 systemd 动态低权限用户，只监听 `127.0.0.1:3001`。
- 数据库、上传和音频位于 `/var/lib/siaplog`；运行时与密钥不进入 Git。
- `/etc/siaplog/app.env` 仅 root 可读，必须配置强随机 `JWT_SECRET`。参考 [.env.example](.env.example)，轮换密钥会使原登录失效。
- [deploy/siaplog.service](deploy/siaplog.service) 指定项目内独立 Node 二进制 `.runtime/node`，避免依赖 root 主目录。
- Nginx 配置见 [deploy/nginx.conf](deploy/nginx.conf)，转发 API、图片及音频，构建资源长期缓存，HTML 每次验证更新。
- 博客保留 HTTP，Suwayomi 保留既有 HTTPS 与证书续期路径。
- [deploy/siaplog-backup.timer](deploy/siaplog-backup.timer) 每天北京时间 03:00 开始，随机延后最多 5 分钟。本机备份保留 30 次，包含数据库、图片、音频和恢复检查，没有配置异地备份。

发布前在独立目录按锁定文件安装依赖并检查：

```bash
npm ci
npm run check
npm test
npm run build
```

更新前先完成一致备份，再发布经过验证的代码及构建，保留持久化目录、密钥及 Node 运行时；应用启动会执行版本化数据库迁移。不要在运行中的项目内直接覆盖依赖或复制单个数据库文件。

```bash
systemctl status siaplog --no-pager
journalctl -u siaplog -n 100 --no-pager
systemctl restart siaplog
curl -f http://127.0.0.1:3001/api/health
nginx -t && systemctl reload nginx
systemctl list-timers siaplog-backup.timer
```

PM2 仅作为 `deploy/ecosystem.config.cjs` 中的可选替代方案，需自行配置服务权限和环境变量，不应与 systemd 同时运行 API。

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
│   ├── data/                     # 未用于 API 失败回退的示例数据
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
| 样式 | CSS Custom Properties（Magazine Editorial） | — |
| 后端 | Express | ^5.2 |
| 数据库 | SQLite (better-sqlite3) | ^13.0 |
| 认证 | JWT (jsonwebtoken + bcryptjs) | — |
| 图片处理 | Sharp | ^0.35 |
| AI 抠图 | rembg (Python) | — |
| 文件上传 | Multer | ^2.2 |

---

## 数据存储

- **开发数据**：`server/data.db` 与 `server/uploads/`，可用 `SIA_DATA_DIR` 覆盖。
- **生产数据**：`/var/lib/siaplog/data.db`、`uploads/`、`audio/`，独立于代码和构建。
- **接口失败**：前台显示错误和重试入口，不自动展示示例内容。

主要内容表及会话、迁移记录：

| 表 | 字段 |
|----|------|
| `users` | username, password_hash, active, token_version, created_at |
| `photos` | src, alt, camera, location, date_taken, notes, thumb, medium |
| `movies` | slug, title, title_en, poster, year, director, cast, genre, rating, tags, excerpt, review |
| `books` | slug, title, title_en, author, cover, year, publisher, genre, rating, tags, excerpt, review |
| `sessions` | jti, user_id, expires_at |
| `schema_migrations` | version, applied_at |

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
| 2026-10 | JWT 强随机密钥与可撤销会话、图片验证及响应式变体、前端分包、低权限 systemd、本机校验备份与 CI |
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
