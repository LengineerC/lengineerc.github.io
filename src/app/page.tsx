import type { Metadata } from "next";
import Home from "@/views/Home";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("首页", "/", "LengineerC 的个人博客，记录前端开发、编程与生活。");

export default function Page() {
  return <Home />;
}
