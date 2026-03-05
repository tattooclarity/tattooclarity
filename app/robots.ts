import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/download", "/success", "/cancel"],
    },
    sitemap: "https://www.tattooclarity.com/sitemap.xml",
  };
}