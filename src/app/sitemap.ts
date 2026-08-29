import type { MetadataRoute } from "next";
import { categories, posts, tags } from "@/lib/content";
import { BASE_PATH } from "@/utils/basePath";

export const dynamic = "force-static";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://blog.lengineerc.com").replace(/\/$/, "");
const staticRoutes = ["", "/posts", "/archives", "/tags", "/categories", "/toolbox", "/toolbox/menu", "/toolbox/unicode", "/toolbox/ipa-input", "/media", "/friends", "/about"];
const toUrl = (route: string) => `${siteUrl}${BASE_PATH}${route}/`;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((route) => ({ url: toUrl(route), changeFrequency: "weekly" as const })),
    ...posts.map((post) => ({ url: toUrl(`/post/detail/${post.id.split("/").map(encodeURIComponent).join("/")}`), lastModified: new Date(`${post.time.replace(" ", "T")}+08:00`), changeFrequency: "monthly" as const })),
    ...Object.keys(tags).map((tag) => ({ url: toUrl(`/tags/${encodeURIComponent(tag)}`), changeFrequency: "weekly" as const })),
    ...Object.keys(categories).map((category) => ({ url: toUrl(`/categories/${encodeURIComponent(category)}`), changeFrequency: "weekly" as const })),
  ];
}
