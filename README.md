# Field Manuals

一个零构建、无外部运行时依赖的中文游戏攻略静态站点。

## 目录

```text
.
├── index.html
├── 404.html
├── _headers
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
└── games/
    ├── fire-emblem-three-houses/
    └── mass-effect-3/
```

攻略页面使用英文 URL，中文标题和内容保留在页面内。ME3 页面继续使用原存档键 `ME3_GUIDE_SAVE_V1`，同一域名下更新后不会丢失浏览器本地进度。

## 本地预览

直接打开 `index.html` 即可。为完整模拟线上路径，也可以在仓库根目录运行任意静态文件服务器。

## Cloudflare Pages + GitHub

1. 将仓库默认分支设为 `main`。
2. 在 Cloudflare 控制台打开 **Workers & Pages**，选择 **Create application** → **Pages** → **Connect to Git**。
3. 授权并选择 GitHub 仓库 `voidczx/GamePageProject`。
4. Production branch 填 `main`。
5. Framework preset 选择 `None`。
6. Build command 填 `exit 0`。
7. Build output directory 填 `.`，Root directory 保持为空。
8. 点击 **Save and Deploy**。之后每次推送到 `main` 都会自动发布，其他分支会生成预览部署。

如需自定义域名，在 Pages 项目的 **Custom domains** 中添加域名，并按 Cloudflare 提示确认 DNS 记录。

## 内容维护

- 修改主页：`index.html`、`assets/css/site.css`、`assets/js/site.js`
- 修改 ME3 攻略：`games/mass-effect-3/index.html`
- 修改风花雪月攻略：`games/fire-emblem-three-houses/index.html`、`data.js`、`app.js`、`style.css`
- 替换封面时保持 `1200 × 800` 或相同比例，并优先使用 WebP
