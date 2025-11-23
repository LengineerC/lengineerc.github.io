import type { NextConfig } from "next";

const isGithubPages = process.env.DEPLOY_ON_GITHUB_PAGES === "true";

const repoName = "lengineerc.github.io";
const useCustomDomain = true;
const basePath = (isGithubPages && !useCustomDomain) ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: "out",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
