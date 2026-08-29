# LengineerC's Blog

从原 React CSR 博客迁移而来的 Next.js App Router 静态博客。文章、标签、分类和 Markdown 正文均在构建期生成 HTML，最终输出到 `out/`，可以部署到 GitHub Pages 或任意静态文件托管服务。

## 本地开发

```bash
yarn install
yarn dev
```

首次生成字体子集前需安装 FontTools 与 Brotli：

```bash
python -m pip install fonttools brotli
```

生成文章数据并构建静态站点：

```bash
yarn build
npx serve out
```

`npx serve out` 会在本地预览根路径版的 `out/` 静态导出目录，也可以使用等价的 `yarn start`。本地预览前不要设置 `NEXT_PUBLIC_BASE_PATH`；该变量只用于 GitHub Pages 这类子路径部署。

新建文章：

```bash
yarn create-post category/post-name
```

文章放在 `public/posts/`，图片放在对应的 `public/post-images/<文章 id>/`。构建前的 `generate` 脚本会更新文章索引、分类、标签、Markdown HTML 和字体子集。

## GitHub Pages

### GitHub Actions（调整中，暂时不可使用）

仓库包含 `.github/workflows/deploy.yml`。在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**，推送到 `main` 即可部署。

工作流会自动为普通项目站点设置 `/<仓库名>` base path；`owner.github.io` 仓库则使用根路径。若使用自定义域名，请设置 Repository variable：

- `NEXT_PUBLIC_BASE_PATH=/`：自定义域名部署在根路径时使用。
- `NEXT_PUBLIC_SITE_URL=https://你的域名`：用于 canonical、robots 和 sitemap。

也可以在本地构建项目子路径版本：

```bash
NEXT_PUBLIC_BASE_PATH=/next-blog yarn build
```

### gh-pages

```bash
yarn deploy
```