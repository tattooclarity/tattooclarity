import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.tattooclarity.com"; // ✅建議用最終 canonical（通常係 www）
  const lastModified = new Date();

  // ✅ 只放「真係存在」嘅 page
  const routes = [
    "/",
    "/customize",
    // 有就再加，例如：
    // "/pricing",
    // "/faq",
    // "/privacy",
    // "/terms",
    // "/refund",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/customize" ? "weekly" : "yearly",
    priority: path === "/" ? 1 : path === "/customize" ? 0.9 : 0.3,
  }));
}