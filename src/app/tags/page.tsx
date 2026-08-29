import type { Metadata } from "next";
import TagsPage from "@/views/TagsPage";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("标签", "/tags");
export default function Page() { return <TagsPage />; }
