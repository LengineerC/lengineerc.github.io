import type { Metadata } from "next";
import { BASE_PATH } from "@/utils/basePath";

export function pageMetadata(title: string, route: string, description?: string): Metadata {
  const pathname = route === "/" ? "/" : `${route.replace(/\/$/, "")}/`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_PATH}${pathname}` },
  };
}
