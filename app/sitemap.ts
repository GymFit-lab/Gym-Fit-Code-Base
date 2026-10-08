import type { MetadataRoute } from "next";

import { placeholderPages } from "@/content/pages";
import { siteConfig } from "@/lib/site-config";

/** Home plus any placeholder page that has been marked indexable. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = Object.values(placeholderPages)
    .filter((page) => page.indexable)
    .map((page) => ({
      url: `${siteConfig.url}/${page.slug}`,
      changeFrequency: "monthly" as const,
    }));

  return [{ url: siteConfig.url, changeFrequency: "weekly", priority: 1 }, ...pages];
}
