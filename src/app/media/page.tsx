import type { Metadata } from "next";
import Media from "@/views/Media";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("媒体", "/media");
export default function Page() { return <Media />; }
