import type { NextConfig } from "next";

const DEPLOY_ON_GITHUB_PAGES = process.env.DEPLOY_ON_GITHUB_PAGES === 'true';
const basePath = DEPLOY_ON_GITHUB_PAGES ? '/blog-next' : '';
const assetPrefix = DEPLOY_ON_GITHUB_PAGES ? '/blog-next' : '';

const nextConfig: NextConfig = {
  output: DEPLOY_ON_GITHUB_PAGES ? 'export' : 'standalone',
  basePath: basePath,
  assetPrefix: assetPrefix,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
