import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estudiar es Clave",
    short_name: "Clave",
    description: "Simulador del EXANI-II para la BUAP: diagnóstico por área y subárea y práctica diaria.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#0b1d2e",
    theme_color: "#003b5c",
    lang: "es-MX",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
