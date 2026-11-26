import type { MetadataRoute } from "next";
import { AREAS } from "@/lib/areas-exani";
import { AREAS_GENERALES } from "@/lib/areas-generales";
import { todasLasCarreras } from "@/lib/carreras";

import { urlSitio } from "@/lib/sitio";

// Se arma en cada petición para usar el dominio real del servidor.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlSitio();
  return ["", "/guia", "/carreras", ...AREAS_GENERALES.map((a) => `/carreras/${a.slug}`), ...todasLasCarreras().map((c) => `/carreras/${c.area.slug}/${c.slug}`), "/carreras/medicina", "/areas", ...AREAS.map((a) => `/areas/${a.slug}`), "/planes", "/mini", "/preguntas-frecuentes", "/prepa", "/privacidad", "/terminos"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
