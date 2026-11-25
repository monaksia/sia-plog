# Sia Plog 运维

运行环境：Node.js 24.18.0。代码在 `/var/www/sia-plog`，独立 API 服务为 `siaplog.service`。服务使用 systemd 动态低权限用户，数据位于 `/var/lib/siaplog`（systemd 管理的持久化目录），配置为 `/etc/siaplog/app.env`，该文件仅 root 可读。后端只监听 `127.0.0.1:3001`。

博客继续使用现有 HTTP 地址；Suwayomi 的 HTTPS 服务和证书续期路径保留。HTTP 登录仍不能获得传输加密，后续配置博客域名后可独立启用 TLS。

## 验证与部署

```bash
nvm use
npm ci
npm run check
npm test
npm run build
```

构建配置使用 Vite runner，避免为配置加载创建额外 bundle 缓存。音频独立保存在 `/var/lib/siaplog/audio`；开发时仍从 `public/audio` 读取，不打入生产前端构建。

密钥必须是至少 43 字符的强随机值，没有默认值。轮换密钥会让现有登录失效。后台会话有效期 8 小时；登出撤销当前会话，修改管理员密码会撤销其所有会话。`POST /api/auth/logout-all` 可撤销该账户所有会话。

以下命令需在具有主机管理权限的终端执行：

```bash
systemctl status siaplog --no-pager
journalctl -u siaplog -n 100 --no-pager
systemctl restart siaplog
curl -f http://127.0.0.1:3001/api/health
nginx -t && systemctl reload nginx
```

服务配置来自 `deploy/siaplog.service`，Nginx 配置来自 `deploy/nginx.conf`。API、图片、音频由 Nginx 转发；构建资源长期缓存，HTML 每次验证更新。上传使用独立临时文件、真实图片解码、像素限制、WebP 转码及失败清理，照片同时生成 400px 和 1000px 变体。已有照片可执行 `scripts/upgrade-images.mjs` 补齐变体，该脚本不修改已有主图 URL。

## 本机备份与恢复检查

每天北京时间 03:00 开始，最多随机延后 5 分钟，保留最近 30 次成功备份。没有配置异地存储。

备份使用 SQLite Online Backup API，包含数据库、上传图片、音频以及记录数量和 SHA-256 清单。只有完整性、外键、文件引用、哈希和临时目录恢复检查通过后，备份才发布为完整目录。失败作业以非零状态退出，详情记入 journal。

```bash
systemctl list-timers siaplog-backup.timer
systemctl start siaplog-backup.service
journalctl -u siaplog-backup.service -n 30 --no-pager
/var/www/sia-plog/.runtime/node /var/www/sia-plog/scripts/verify-backup.mjs /var/backups/siaplog/backup-日期-标识
```

检查恢复脚本仅在临时目录执行恢复测试，不覆盖线上数据。真实恢复需先停止 API，备份当前状态，将已验证备份的数据库、uploads、audio 恢复到服务持久化目录，再启动 API 并检查健康及内容。请勿只复制运行中的 `data.db`，也不要删除线上 WAL 来清理数据库。

首次部署的原始代码、静态构建、配置、数据库和图片保存在部署前备份目录，可用于回滚。回滚代码时还应恢复与其兼容的部署配置；避免用旧数据库覆盖部署后新增内容。

## 数据和版本管理

数据库、WAL/SHM、上传文件、临时文件、密钥和 Node 运行二进制不应入 Git。历史已跟踪运行文件仅退出索引，保留磁盘文件，不改写 Git 历史。上传目录的既有未引用文件保留，后续核对再清理。

列表接口只返回摘要和元数据，正文通过详情接口读取。分页在内容增长后再添加。前台 API 失败显示错误和重试入口，不展示示例内容。编辑已发布文章时 slug 保持稳定，封面上传不会重置未保存的正文。

影评和书评草稿通过带登录校验的后台接口读取。前台列表、详情和首页更新只读取已发布文章。第 3 版数据库迁移将已有文章标记为已发布，沿用原网址和创建时间。

CI 执行 Node 语法检查、关键回归测试及前端构建。测试使用临时数据库及文件，不修改生产数据。
