import type { Metadata, Viewport } from "next";
import { Anybody, Instrument_Serif, Red_Hat_Text } from "next/font/google";
import { cookies } from "next/headers";
import { Encabezado } from "@/components/encabezado";
import { Pie } from "@/components/pie";
import "katex/dist/katex.min.css";
import "./globals.css";

const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-anybody", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const redhat = Red_Hat_Text({ subsets: ["latin"], variable: "--font-redhat", display: "swap" });

const url = process.env.BETTER_AUTH_URL ?? "https://estudiaresclave.mx";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: "Estudiar es Clave · Simulador EXANI-II para la BUAP", template: "%s · Estudiar es Clave" },
  description:
    "Diagnóstico por temas, dosis diaria de preguntas con la explicación de cada opción y tus 3 prioridades según lo que más pesa en el EXANI-II. Empieza gratis.",
  applicationName: "Estudiar es Clave",
  manifest: "/manifest.webmanifest",
  openGraph: { type: "website", locale: "es_MX", siteName: "Estudiar es Clave" },
};

export const viewport: Viewport = { themeColor: "#17121C", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const tema = (await cookies()).get("eec_tema")?.value;
  return (
    <html lang="es-MX" data-tema={tema === "claro" || tema === "oscuro" ? tema : "sistema"} className={`${anybody.variable} ${redhat.variable} ${instrument.variable}`}>
      <body>
        <a href="#contenido" className="sr-only">
          Saltar al contenido
        </a>
        <Encabezado />
        <main id="contenido">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
