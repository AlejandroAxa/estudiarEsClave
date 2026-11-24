import type { MetadataRoute } from "next";

const base = process.env.BETTER_AUTH_URL ?? "https://estudiaresclave.mx";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/a/", "/pagar/", "/examen/", "/cuenta", "/inicio"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
