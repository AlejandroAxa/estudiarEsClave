import type { MetadataRoute } from "next";
import { AREAS } from "@/lib/areas-exani";
import { AREAS_GENERALES } from "@/lib/areas-generales";
import { todasLasCarreras } from "@/lib/carreras";

const base = process.env.BETTER_AUTH_URL ?? "https://estudiaresclave.mx";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/guia", "/carreras", ...AREAS_GENERALES.map((a) => `/carreras/${a.slug}`), ...todasLasCarreras().map((c) => `/carreras/${c.area.slug}/${c.slug}`), "/carreras/medicina", "/areas", ...AREAS.map((a) => `/areas/${a.slug}`), "/planes", "/mini", "/preguntas-frecuentes", "/prepa", "/privacidad", "/terminos"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
