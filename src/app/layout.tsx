import type { Metadata, Viewport } from "next";
import { config } from "@fortawesome/fontawesome-svg-core";
import SiteShell from "@/components/SiteShell";
import { AUTHOR, SITE_TITLE } from "@/utils/constants";
import { BASE_PATH } from "@/utils/basePath";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";

// Font Awesome normally injects this stylesheet after hydration. Loading it here
// keeps server-rendered icons at their intended size on the very first paint.
config.autoAddCss = false;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://blog.lengineerc.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SITE_TITLE, template: `%s | ${SITE_TITLE}` },
  description: `${AUTHOR} 的个人博客`,
  authors: [{ name: AUTHOR }],
  creator: AUTHOR,
  manifest: `${BASE_PATH}/manifest.json`,
  icons: { icon: `${BASE_PATH}/favicon.png`, apple: `${BASE_PATH}/favicon.png` },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#67abff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fontUrl = `${BASE_PATH}/generated/font-subset.woff2`;

  return (
    <html lang="zh-CN">
      <head>
        <link rel="preload" href={fontUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        <style>{`@font-face{font-family:'CustomFont1';src:url('${fontUrl}') format('woff2');font-display:swap;font-style:normal;font-weight:400}`}</style>
      </head>
      <body>
        <style id="bodyStyle" />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
