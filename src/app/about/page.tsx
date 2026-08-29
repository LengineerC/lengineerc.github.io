import type { Metadata } from "next";
import About from "@/views/About";
import { getAboutContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("关于", "/about", "关于 LengineerC");
export default function Page() { return <About initialContent={getAboutContent()} />; }
