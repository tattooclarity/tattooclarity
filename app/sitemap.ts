import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.tattooclarity.com"; // ✅用你最終會去到嘅版本（建議 www）
  const lastModified = new Date();

  // ✅只放「真係存在」嘅頁面，唔好放 /download /success /cancel
  const routes = [
    "/",
    "/customize",
    "/privacy",
    "/terms",
    "/refund",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/customize" ? "weekly" : "yearly",
    priority: path === "/" ? 1 : path === "/customize" ? 0.9 : 0.3,
  }));
}