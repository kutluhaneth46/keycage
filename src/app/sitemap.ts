import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://keycage.kutluhaneth.com",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://keycage.kutluhaneth.com/panel",
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
