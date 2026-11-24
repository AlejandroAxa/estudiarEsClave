import type { Metadata } from "next";
import Link from "next/link";
import { AREAS, TIPOS, type TipoArea } from "@/lib/areas-exani";
import { IconoArea, TrazoArea } from "@/components/area-exani";

export const metadata: Metadata = {
  title: "Áreas y módulos del EXANI-II: temarios y bibliografía",
  description:
    "Las 4 áreas que presentan todos y los 18 módulos disciplinares del EXANI-II, con temario por subárea, bibliografía oficial de apoyo y una pregunta resuelta de cada uno.",
};

const GRUPOS: { tipo: TipoArea[]; titulo: string; texto: string }[] = [
  {
    tipo: ["transversal", "diagnostica"],
    titulo: "Lo que presentan todos",
    texto: "Tres áreas de habilidades que cuentan para tu puntaje (30 reactivos cada una) e Inglés, que es diagnóstico.",
  },
  {
    tipo: ["especifico"],
    titulo: "Módulos específicos",
    texto: "Tu universidad elige dos según la carrera, de 24 reactivos cada uno. Premedicina vale por los dos: tiene 48.",
  },
  {
    tipo: ["general"],
    titulo: "Módulos generales",
    texto: "Para universidades donde eliges varias carreras en orden de preferencia. Solo se combinan entre sí.",
  },
];

export default function Areas() {
  return (
    <>
      <section className="noche band" style={{ position: "relative", overflow: "hidden" }}>
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <span className="pastilla oscura">168 reactivos · 4 horas y media</span>
          <h1 style={{ marginTop: 20, fontSize: "clamp(34px,5.5vw,64px)" }}>Áreas del EXANI-II</h1>
          <p className="lead" style={{ maxWidth: "58ch" }}>
            Tu examen junta cinco áreas que suman al puntaje global (138 reactivos) y Inglés, que solo es diagnóstico (30). Aquí está cada una con su
            temario, su bibliografía y una pregunta resuelta.
          </p>
        </div>
        <TrazoArea slug="biologia" />
      </section>

      <section className="band">
        <div className="wrap">
          {GRUPOS.map((g, k) => (
            <div key={g.titulo} style={{ marginTop: k ? 56 : 0 }}>
              <h2>{g.titulo}</h2>
              <p className="lead">{g.texto}</p>
              <div className="rejilla" style={{ marginTop: 20 }}>
                {AREAS.filter((a) => g.tipo.includes(a.tipo)).map((a) => (
                  <Link key={a.slug} href={`/areas/${a.slug}`} className="hoja tarjeta-area">
                    <span className="fila entre">
                      <IconoArea nombre={a.icono} />
                      <span className="xs">
                        {a.reactivos} reactivos{a.tipo === "diagnostica" ? " · no cuenta" : ""}
                      </span>
                    </span>
                    <h3 style={{ marginTop: 12 }}>{a.nombre}</h3>
                    <p className="small" style={{ marginBottom: 0 }}>
                      {a.lema}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <p className="small" style={{ marginTop: 40 }}>
            Datos de la <i>Guía para el sustentante EXANI-II</i> del CENEVAL (junio de 2025). {TIPOS.especifico.nota} ¿Vas por Medicina?{" "}
            <Link href="/carreras/medicina">Mira la ruta de Medicina</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
