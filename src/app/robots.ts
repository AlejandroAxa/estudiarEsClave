import type { MetadataRoute } from "next";

import { urlSitio } from "@/lib/sitio";

// Se arma en cada petición para usar el dominio real del servidor.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = urlSitio();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/a/", "/pagar/", "/examen/", "/cuenta", "/inicio"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
