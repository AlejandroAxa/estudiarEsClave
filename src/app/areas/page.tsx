import type { Metadata } from "next";
import Link from "next/link";
import { AREAS, COMUNES_BUAP, ESTRUCTURAS_BUAP, FUENTE_BUAP, TIPOS, areaPorSlug, type TipoArea } from "@/lib/areas-exani";
import { IconoArea, TrazoArea } from "@/components/area-exani";
import { IlustracionArea } from "@/components/ilustracion-area";

export const metadata: Metadata = {
  title: "Áreas y módulos del EXANI-II: estructura BUAP, temarios y bibliografía",
  description:
    "Las 4 áreas de conocimiento del EXANI-II de la BUAP con sus módulos, las áreas que presentan todos, la EIPM de Medicina y los 18 módulos de la guía del CENEVAL, con temario, bibliografía y una pregunta resuelta de cada uno.",
};

const GRUPOS: { tipo: TipoArea[]; titulo: string; texto: string }[] = [
  {
    tipo: ["transversal", "transversal-buap", "diagnostica"],
    titulo: "Lo que presentan todos",
    texto:
      "Comprensión lectora, Redacción indirecta y Pensamiento matemático (30 reactivos cada una), Habilidades blandas y toma de decisiones (22, solo en la BUAP) e Inglés, que es diagnóstico (30).",
  },
  {
    tipo: ["area-buap"],
    titulo: "Módulos de área de conocimiento · BUAP",
    texto: "Uno por cada área de la BUAP, de 24 reactivos. Se presenta junto con un módulo general.",
  },
  {
    tipo: ["general"],
    titulo: "Módulos generales",
    texto: "Ciencias sociales o Ciencias experimentales, de 24 reactivos. En la BUAP acompañan al módulo de tu área.",
  },
  {
    tipo: ["especifico", "eipm"],
    titulo: "Módulos específicos y Medicina",
    texto:
      "Otras universidades eligen dos módulos específicos de 24 reactivos según la carrera. Premedicina vale por los dos (48) y, en la BUAP, va con Razonamiento clínico avanzado (20).",
  },
];

const nombre = (slug: string) => areaPorSlug(slug)?.nombre ?? slug;

export default function Areas() {
  return (
    <>
      <section className="noche band" style={{ position: "relative", overflow: "hidden" }}>
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <span className="pastilla oscura">BUAP 2026 · 190 reactivos · hasta 5 horas</span>
          <h1 style={{ marginTop: 20, fontSize: "clamp(34px,5.5vw,64px)" }}>Áreas del EXANI-II</h1>
          <p className="lead" style={{ maxWidth: "60ch" }}>
            En la BUAP eliges una de cuatro áreas de conocimiento. Todas presentan las mismas cinco áreas comunes (142 reactivos) y dos módulos de 24
            según tu área. Medicina va aparte, con su propia evaluación en dos etapas. Aquí está cada una con su temario, su bibliografía y una
            pregunta resuelta.
          </p>
        </div>
        <TrazoArea slug="biologia" />
      </section>

      <section className="band">
        <div className="wrap pila">
          <h2>Estructura del examen en la BUAP</h2>
          <p className="lead">Cada área de conocimiento suma 190 reactivos: las cinco comunes más sus dos módulos.</p>
          <div className="rejilla">
            {ESTRUCTURAS_BUAP.map((e) => (
              <article key={e.area} className="hoja tarjeta-buap">
                <span className="fila entre">
                  <IconoArea nombre={e.icono} />
                  <span className="xs">190 reactivos</span>
                </span>
                <h3 style={{ marginTop: 12 }}>{e.area}</h3>
                <ul className="estructura-lista">
                  {COMUNES_BUAP.map(([slug, n, r]) => (
                    <li key={slug}>
                      <Link href={`/areas/${slug}`}>{n}</Link>
                      <span>{r}</span>
                    </li>
                  ))}
                  <li className="estructura-modulo">
                    <Link href={`/areas/${e.general}`}>{nombre(e.general)}</Link>
                    <span>24</span>
                  </li>
                  <li className="estructura-modulo">
                    <Link href={`/areas/${e.modulo}`}>{nombre(e.modulo)}</Link>
                    <span>24</span>
                  </li>
                </ul>
              </article>
            ))}
            <article className="hoja tarjeta-buap">
              <span className="fila entre">
                <IconoArea nombre="Stethoscope" />
                <span className="xs">210 reactivos</span>
              </span>
              <h3 style={{ marginTop: 12 }}>Medicina (EIPM)</h3>
              <p className="xs" style={{ margin: "10px 0 0" }}>
                Primera etapa · marzo
              </p>
              <ul className="estructura-lista">
                <li className="estructura-modulo">
                  <Link href="/areas/premedicina">Premedicina</Link>
                  <span>48</span>
                </li>
                <li className="estructura-modulo">
                  <Link href="/areas/razonamiento-clinico-avanzado">Razonamiento clínico avanzado</Link>
                  <span>20</span>
                </li>
              </ul>
              <p className="xs" style={{ margin: "10px 0 0" }}>
                Segunda etapa · junio
              </p>
              <ul className="estructura-lista">
                {COMUNES_BUAP.map(([slug, n, r]) => (
                  <li key={slug}>
                    <Link href={`/areas/${slug}`}>{n}</Link>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <p className="small">
            Fuente:{" "}
            <a href={FUENTE_BUAP} target="_blank" rel="noopener noreferrer">
              página del CENEVAL para la BUAP
            </a>{" "}
            (actualizada el 30 de marzo de 2026) y los temarios oficiales de cada módulo. Revisa siempre la convocatoria de tu año.
          </p>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {GRUPOS.map((g, k) => (
            <div key={g.titulo} style={{ marginTop: k ? 56 : 0 }}>
              <h2>{g.titulo}</h2>
              <p className="lead">{g.texto}</p>
              <div className="rejilla" style={{ marginTop: 20 }}>
                {AREAS.filter((a) => g.tipo.includes(a.tipo)).map((a) => (
                  <Link key={a.slug} href={`/areas/${a.slug}`} className="hoja tarjeta-area">
                    <span className="tarjeta-mini">
                      <IlustracionArea slug={a.slug} className="ilustracion mini" />
                    </span>
                    <span className="fila entre">
                      <IconoArea nombre={a.icono} />
                      <span className="xs">
                        {a.reactivos} reactivos{a.tipo === "diagnostica" ? " · no cuenta" : ""}
                        {a.tipo === "transversal-buap" || a.tipo === "area-buap" || a.tipo === "eipm" ? " · BUAP" : ""}
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
            Áreas comunes, módulos generales y específicos: <i>Guía para el sustentante EXANI-II</i> del CENEVAL (junio de 2025). Módulos de área,
            Habilidades blandas y Razonamiento clínico: CENEVAL para la BUAP (2026). {TIPOS.especifico.nota} ¿Vas por Medicina?{" "}
            <Link href="/carreras/medicina">Mira la ruta de Medicina</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
