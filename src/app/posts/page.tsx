import type { Metadata } from "next";
import PostsPage from "@/views/PostsPage";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("文章", "/posts");
export default function Page() { return <PostsPage />; }
