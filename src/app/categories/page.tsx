import type { Metadata } from "next";
import CategoriesPage from "@/views/CategoriesPage";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("分类", "/categories");
export default function Page() { return <CategoriesPage />; }
