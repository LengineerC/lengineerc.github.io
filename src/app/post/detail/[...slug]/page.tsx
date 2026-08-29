import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Post from "@/views/Post";
import { getPostByRouteId, getPostContent, posts } from "@/lib/content";
import { BASE_PATH } from "@/utils/basePath";
import { decodeRouteSegments } from "@/utils/routeParams";

export function generateStaticParams() {
  const baseNameCounts = new Map<string, number>();
  for (const post of posts) {
    const baseName = post.id.split("/").at(-1)!;
    baseNameCounts.set(baseName, (baseNameCounts.get(baseName) ?? 0) + 1);
  }
  const legacyAliases = posts
    .filter((post) => post.id.includes("/") && baseNameCounts.get(post.id.split("/").at(-1)!) === 1)
    .map((post) => ({ slug: [post.id.split("/").at(-1)!] }));
  return [...posts.map((post) => ({ slug: post.id.split("/") })), ...legacyAliases];
}
type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostByRouteId(decodeRouteSegments(slug));
  if (!post) return {};
  const canonicalPath = `/post/detail/${post.id.split("/").map(encodeURIComponent).join("/")}/`;
  return {
    title: post.title,
    description: post.abstract,
    authors: post.author ? [{ name: post.author }] : undefined,
    keywords: post.tags,
    alternates: { canonical: `${BASE_PATH}${canonicalPath}` },
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const id = decodeRouteSegments(slug);
  const post = getPostByRouteId(id);
  if (!post) notFound();
  return <Post id={id} initialContent={post.lock ? undefined : getPostContent(post)} />;
}
