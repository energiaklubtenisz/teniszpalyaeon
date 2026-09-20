import type { MetadataRoute } from "next";

import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/prices",
          "/gallery",
          "/booking",
          "/contact",
          "/adatvedelem",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/profil",
          "/profil/",
          "/foglalasaim",
          "/foglalasaim/",
          "/login",
          "/register",
          "/register/",
          "/api/",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
