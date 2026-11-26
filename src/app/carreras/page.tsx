import type { Metadata } from "next";
import Link from "next/link";
import { AREAS_GENERALES, totalCarreras } from "@/lib/areas-generales";
import { IconoArea } from "@/components/area-exani";
import {
  Encabezado,
  HeroEditorial,
  Marquesina,
} from "@/components/estilos/editorial";
import { DibujoMotivo } from "@/components/motivo-area";
import { BuscadorCarreras } from "@/components/buscador-carreras";
import { hrefCarrera } from "@/lib/carreras";

export const metadata: Metadata = {
  title: "Áreas generales de la BUAP: carreras y diagnóstico por área",
  description:
    "Ciencias Económico Administrativas, Ciencias Sociales y Humanidades, Ciencias Naturales y de Salud, e Ingenierías y Ciencias Exactas: sus carreras en la BUAP y un diagnóstico del EXANI-II para cada una.",
};

export default function AreasGenerales() {
  const carreras = AREAS_GENERALES.flatMap((a) =>
    a.grupos.flatMap((g) => g.carreras),
  );
  const indice = AREAS_GENERALES.flatMap((a) =>
    a.grupos.flatMap((g) => g.carreras.map((c) => ({ nombre: c, href: hrefCarrera(a.slug, c), area: a.corto }))),
  ).sort((x, y) => x.nombre.localeCompare(y.nombre, "es"));
  return (
    <div className="editorial">
      <HeroEditorial
        ceja="BUAP 2027 · Áreas de conocimiento"
        titulo={
          <>
            Áreas
            <br /> generales
          </>
        }
        sub={
          <>
            Tu carrera <u>decide tu examen</u>
          </>
        }
        cifras={[
          ["4", "Áreas de conocimiento"],
          [String(carreras.length), "Licenciaturas"],
          ["190", "Reactivos por área"],
          ["1", "Diagnóstico por área"],
        ]}
      />

      <Marquesina
        etiqueta="Algunas licenciaturas de la BUAP"
        items={carreras.slice(0, 24)}
      />

      <section className="ed-papel">
        <div className="wrap">
          <Encabezado
            ceja="Elige la tuya"
            titulo={
              <>
                Busca tu carrera,{" "}
                <span className="ed-acento">entra a su área.</span>
              </>
            }
          >
            <p className="ed-intro">
              En la BUAP tu carrera pertenece a una de cuatro áreas, y el área
              decide qué módulos presentas en el EXANI-II. Dentro de cada una
              haces un diagnóstico con preguntas de esa área.
            </p>
          </Encabezado>
          <ol className="ed-tarjetas ed-areas">
            {AREAS_GENERALES.map((a, i) => (
              <li
                key={a.slug}
                style={{ "--acento": a.acento } as React.CSSProperties}
              >
                <Link href={`/carreras/${a.slug}`} className="ed-area">
                  <span className="fila entre">
                    <span className="ed-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <IconoArea nombre={a.icono} color="var(--acento)" />
                  </span>
                  <span className="ed-area-dibujo">
                    <DibujoMotivo
                      tema={a.tema}
                      acento={a.acento}
                      className="ilustracion mini"
                    />
                  </span>
                  <h3>{a.nombre}</h3>
                  <p>«{a.lema}»</p>
                  <span className="ed-area-dato">
                    {totalCarreras(a)} licenciaturas
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <aside className="ed-nota">
            <span className="ed-ojo">¿Vas por Medicina?</span>
            <p>
              Medicina es del área de Naturales y de Salud, pero tiene su propia
              evaluación en dos etapas (Premedicina y Razonamiento clínico
              avanzado primero, áreas comunes después).{" "}
              <Link href="/carreras/medicina">Mira la ruta de Medicina</Link>.
            </p>
          </aside>
          <section id="todas" className="ed-indice" aria-labelledby="todas-t">
            <Encabezado ceja="Índice A–Z" titulo={<span id="todas-t">Todas las carreras, una página cada una.</span>}>
              <p className="ed-intro">
                Cada licenciatura tiene su página con lo que viene en su examen, qué conviene reforzar y preguntas resueltas.
              </p>
            </Encabezado>
            <BuscadorCarreras carreras={indice} />
          </section>
          <p className="ed-letra-chica">
            ¿Quieres el temario de cada módulo? Está en{" "}
            <Link href="/areas">Áreas del examen</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
