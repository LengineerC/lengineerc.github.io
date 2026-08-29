import type { Metadata } from "next";
import CategoriesDetail from "@/views/CategoriesDetail";
import { categories } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { decodeRouteParam } from "@/utils/routeParams";

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(categories).map((category) => ({ category })); }
type Props = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: routeCategory } = await params;
  const category = decodeRouteParam(routeCategory);
  return pageMetadata(`分类：${category}`, `/categories/${encodeURIComponent(category)}`, `${category} 分类下的博客文章`);
}
export default async function Page({ params }: Props) {
  const { category: routeCategory } = await params;
  const category = decodeRouteParam(routeCategory);
  return <CategoriesDetail category={category} />;
}
