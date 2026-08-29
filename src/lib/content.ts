import "server-only";

import fs from "node:fs";
import path from "node:path";
import postsJson from "../../public/json/posts.json";
import tagsJson from "../../public/json/tags.json";
import categoriesJson from "../../public/json/categories.json";
import type { Categories, PostConfig, PostContent, Tags } from "@/utils/types";

export const posts = postsJson as PostConfig[];
export const tags = tagsJson as Tags;
export const categories = categoriesJson as Categories;

function readPublicJson<T>(publicPath: string): T {
  const normalizedPath = decodeURIComponent(publicPath).replace(/^\/+/, "");
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", normalizedPath), "utf8")) as T;
}

export function getPost(id: string) {
  return posts.find((post) => post.id === id);
}

export function getPostByRouteId(id: string) {
  const exactMatch = getPost(id);
  if (exactMatch || id.includes("/")) return exactMatch;

  const legacyMatches = posts.filter((post) => post.id.split("/").at(-1) === id);
  return legacyMatches.length === 1 ? legacyMatches[0] : undefined;
}

export function getPostContent(post: PostConfig) {
  return readPublicJson<PostContent>(post.contentPath);
}

export function getAboutContent() {
  return readPublicJson<PostContent>("generated/about.json");
}
