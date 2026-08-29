import type { Metadata } from "next";
import TagDetail from "@/views/TagDetail";
import { tags } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { decodeRouteParam } from "@/utils/routeParams";

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(tags).map((tag) => ({ tag })); }
type Props = { params: Promise<{ tag: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: routeTag } = await params;
  const tag = decodeRouteParam(routeTag);
  return pageMetadata(`标签：${tag}`, `/tags/${encodeURIComponent(tag)}`, `${tag} 标签下的博客文章`);
}
export default async function Page({ params }: Props) {
  const { tag: routeTag } = await params;
  const tag = decodeRouteParam(routeTag);
  return <TagDetail tag={tag} />;
}
