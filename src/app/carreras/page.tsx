import type { Metadata } from "next";
import Link from "next/link";
import { AREAS_GENERALES, totalCarreras } from "@/lib/areas-generales";
import { IconoArea, TrazoArea } from "@/components/area-exani";
import { DibujoMotivo } from "@/components/motivo-area";

export const metadata: Metadata = {
  title: "Áreas generales de la BUAP: carreras y diagnóstico por área",
  description:
    "Ciencias Económico Administrativas, Ciencias Sociales y Humanidades, Ciencias Naturales y de Salud, e Ingenierías y Ciencias Exactas: sus carreras en la BUAP y un diagnóstico del EXANI-II para cada una.",
};

export default function AreasGenerales() {
  return (
    <>
      <section className="noche band" style={{ position: "relative", overflow: "hidden" }}>
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <span className="pastilla oscura">BUAP 2027 · 4 áreas de conocimiento</span>
          <h1 style={{ marginTop: 20, fontSize: "clamp(34px,5.5vw,64px)" }}>Áreas generales</h1>
          <p className="lead" style={{ maxWidth: "60ch" }}>
            En la BUAP tu carrera pertenece a una de cuatro áreas, y el área decide qué módulos presentas en el EXANI-II. Busca tu carrera, entra a su
            área y haz un diagnóstico con preguntas de esa área.
          </p>
        </div>
        <TrazoArea slug="biologia" />
      </section>

      <section className="band">
        <div className="wrap pila">
          <div className="rejilla ag-indice">
            {AREAS_GENERALES.map((a) => (
              <Link
                key={a.slug}
                href={`/carreras/${a.slug}`}
                className={`hoja tarjeta-area ag-tarjeta ag-${a.tema}`}
                style={{ "--acento": a.acento } as React.CSSProperties}
              >
                <span className="tarjeta-mini ag-tarjeta-mini">
                  <DibujoMotivo tema={a.tema} acento={a.acento} className="ilustracion mini" />
                </span>
                <span className="fila entre">
                  <IconoArea nombre={a.icono} />
                  <span className="xs">{totalCarreras(a)} licenciaturas</span>
                </span>
                <h2 className="ag-tarjeta-titulo">{a.nombre}</h2>
                <p className="small">{a.lema}</p>
                <p className="xs" style={{ marginBottom: 0 }}>
                  {a.grupos
                    .flatMap((g) => g.carreras)
                    .slice(0, 4)
                    .join(" · ")}
                  …
                </p>
              </Link>
            ))}
          </div>
          <aside className="hoja guia-oficial">
            <h3>¿Vas por Medicina?</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Medicina es del área de Naturales y de Salud, pero tiene su propia evaluación en dos etapas (Premedicina y Razonamiento clínico avanzado
              primero, áreas comunes después). <Link href="/carreras/medicina">Mira la ruta de Medicina</Link>.
            </p>
          </aside>
          <p className="small">
            ¿Quieres el temario de cada módulo? Está en <Link href="/areas">Áreas del examen</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
