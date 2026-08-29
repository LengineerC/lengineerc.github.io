import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/utils/basePath";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://blog.lengineerc.com").replace(/\/$/, "");
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}${BASE_PATH}/sitemap.xml` };
}
