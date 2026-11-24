import type { MetadataRoute } from "next";

const base = process.env.BETTER_AUTH_URL ?? "https://estudiaresclave.mx";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/guia", "/carreras/medicina", "/planes", "/mini", "/preguntas-frecuentes", "/prepa", "/privacidad", "/terminos"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
