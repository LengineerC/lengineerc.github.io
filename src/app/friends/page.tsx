import type { Metadata } from "next";
import Friends from "@/views/Friends";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("友链", "/friends");
export default function Page() { return <Friends />; }
