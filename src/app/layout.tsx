import type { Metadata } from "next";
import ReduxProvider from "../redux/Provider";
import AppWrapper from "../components/AppWrapper";
import Script from "next/script";
import "../App.scss";
import "../index.scss";

export const metadata: Metadata = {
  title: "LengineerC's blog",
  description: "LengineerC's blog",
  icons: {
    icon: "/favicon.png",
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
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="icon" href="/favicon.png" />

        <style id="bodyStyle" dangerouslySetInnerHTML={{ __html: '' }} />
        <link rel="stylesheet" href="/libs/APlayer.min.css" />
      </head>
      <body>
        <ReduxProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </ReduxProvider>

        <Script src="/libs/APlayer.min.js" />
        <Script src="/libs/Meting.min.js" />
      </body>
    </html>
  );
}
