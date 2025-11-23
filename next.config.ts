import type { NextConfig } from "next";

const isGithubPages = process.env.DEPLOY_ON_GITHUB_PAGES === "true";

const repoName = "lengineerc.github.io";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: "out",
};

export default nextConfig;
