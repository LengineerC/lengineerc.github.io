import type { Metadata } from "next";
import AppWrapper from "../components/AppWrapper";
import Script from "next/script";
import "../App.scss";
import "../index.scss";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const getAssetPath = (path: string) => {
  const cleanBasePath = basePath.replace(/\/$/, "");
  return `${cleanBasePath}${path.startsWith("/") ? path : `/${path}`}`;
};

export const metadata: Metadata = {
  title: "LengineerC's blog",
  description: "LengineerC's blog",
  icons: {
    icon: getAssetPath("/favicon.png"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" href={getAssetPath("/favicon.png")} />
        <link rel="icon" href={getAssetPath("/favicon.png")} />

        <style id="bodyStyle" dangerouslySetInnerHTML={{ __html: '' }} />
        <link rel="stylesheet" href={getAssetPath("/libs/APlayer.min.css")} />
      </head>
      <body>
        <AppWrapper>
          {children}
        </AppWrapper>

        <Script 
          src={getAssetPath("/libs/APlayer.min.js")} 
          strategy="lazyOnload"
        />
        <Script 
          src={getAssetPath("/libs/Meting.min.js")} 
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
