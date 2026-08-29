import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig = (phase: string): NextConfig => ({
  // Next 16.3.3 compares encoded request paths with unencoded static params in
  // development, which rejects otherwise valid non-ASCII routes. Static export
  // is a build output concern, so keep it enabled for builds and disabled in dev.
  output: phase === PHASE_DEVELOPMENT_SERVER ? undefined : "export",
  trailingSlash: true,
  // basePath,
  // env: {
  //   NEXT_PUBLIC_BASE_PATH: basePath,
  // },
  images: {
    unoptimized: true,
  },
  sassOptions: {
    silenceDeprecations: ["color-functions", "global-builtin", "function-units", "slash-div"],
  },
  turbopack: {
    root: process.cwd(),
  },
  // The migrated UI intentionally keeps its existing hook and animation behavior.
  reactCompiler: false,
  allowedDevOrigins: ['192.168.14.105'],
});

export default nextConfig;
