import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AREAS_GENERALES, FUENTE_CARRERAS, areaGeneralPorSlug, totalCarreras } from "@/lib/areas-generales";
import { COMUNES_BUAP, areaPorSlug } from "@/lib/areas-exani";
import { deResumen, muestrasPublicas, resumenPlantillas } from "@/lib/consultas";
import { IconoArea } from "@/components/area-exani";
import { DibujoMotivo } from "@/components/motivo-area";
import { hrefCarrera } from "@/lib/carreras";
import { Enunciado, Explicacion, Formula } from "@/components/formula";

export const dynamicParams = false;

export function generateStaticParams() {
  return AREAS_GENERALES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = areaGeneralPorSlug((await params).slug);
  if (!a) return {};
  return {
    title: `${a.nombre} BUAP: carreras, examen y diagnóstico`,
    description: `Las ${totalCarreras(a)} licenciaturas de ${a.nombre} en la BUAP, qué presentas en el EXANI-II y un diagnóstico gratis con preguntas de tu área.`,
  };
}

export default async function PaginaAreaGeneral({ params }: { params: Promise<{ slug: string }> }) {
  const a = areaGeneralPorSlug((await params).slug);
  if (!a) notFound();
  const [resumen, muestras] = await Promise.all([resumenPlantillas([a.rutaId]).catch(() => []), muestrasPublicas(a.rutaId, 3).catch(() => [])]);
  const mini = deResumen(resumen, a.rutaId, "mini");
  const diag = deResumen(resumen, a.rutaId, "diagnostico");
  const general = areaPorSlug(a.general);
  const modulo = areaPorSlug(a.modulo);
  const n = totalCarreras(a);
  const otras = AREAS_GENERALES.filter((x) => x.slug !== a.slug);
  const diagnosticoHref = `/diagnostico?area=${a.slug}`;
  // Folio corrido de cada carrera a lo largo de los grupos.
  const inicios = a.grupos.map((_, i) => a.grupos.slice(0, i).reduce((n, g) => n + g.carreras.length, 0));

  return (
    <div className={`ag ag-${a.tema}`} style={{ "--acento": a.acento } as React.CSSProperties}>
      <section className="noche band area-hero ag-hero">
        <div className="wrap area-hero-rejilla" style={{ position: "relative", zIndex: 1 }}>
          <div>
            <nav className="migas" aria-label="Ruta">
              <Link href="/carreras">Áreas generales</Link> <span aria-hidden>/</span> <span>{a.nombre}</span>
            </nav>
            <div className="fila" style={{ marginTop: 18 }}>
              <span className="pastilla oscura">Área de conocimiento · BUAP</span>
              <span className="pastilla oscura">{n} licenciaturas</span>
            </div>
            <div className="area-titulo">
              <span className="area-icono">
                <IconoArea nombre={a.icono} size={40} color="var(--acento)" />
              </span>
              <h1>{a.nombre}</h1>
            </div>
            <p className="disp area-lema">{a.lema}</p>
            <p className="lead" style={{ maxWidth: "60ch" }}>
              {a.texto}
            </p>
            <div className="fila" style={{ marginTop: 20 }}>
              <Link className="btn" href={`/mini?area=${a.slug}`}>
                Mini diagnóstico de esta área
              </Link>
              <a className="btn sec" href="#carreras">
                Ver las {n} carreras
              </a>
            </div>
          </div>
          <DibujoMotivo tema={a.tema} acento={a.acento} />
        </div>
      </section>

      <section className="band" id="carreras">
        <div className="wrap pila">
          <h2>Carreras del área</h2>
          <p className="lead">
            {n} licenciaturas de la BUAP presentan este mismo examen. Da igual cuál elijas dentro del área: las preguntas y el diagnóstico son los mismos.
          </p>
          <div className="hoja sin-pad ag-reporte">
            <div className="membrete">
              <b>
                <IconoArea nombre={a.icono} size={20} color="var(--lc)" /> {a.reporte} · {a.corto}
              </b>
              <span>{a.grupos.length} grupos</span>
            </div>
            <div className="ag-grupos">
              {a.grupos.map((g, gi) => (
                <section key={g.nombre} className="ag-grupo">
                  <h3>{g.nombre}</h3>
                  <ul className="ag-carreras">
                    {g.carreras.map((c, ci) => {
                      const folio = inicios[gi] + ci + 1;
                      return (
                        <li key={c}>
                          <span className="ag-folio" aria-hidden>
                            {String(folio).padStart(2, "0")}
                          </span>
                          <Link href={hrefCarrera(a.slug, c)}>{c}</Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
          {a.nota && <p className="small">{a.nota}</p>}
          <p className="xs">
            Fuente:{" "}
            <a href={FUENTE_CARRERAS} target="_blank" rel="noopener noreferrer">
              oferta educativa de la BUAP
            </a>{" "}
            (consultada en noviembre de 2026). Algunas carreras solo se ofrecen en sedes regionales o en línea. La convocatoria de tu año es la que manda.
          </p>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap rejilla-2" style={{ alignItems: "start" }}>
          <div className="pila">
            <h2 className="h2-corto">Qué presentas</h2>
            <p>Las cinco áreas comunes que presentan todos, más dos módulos de 24 reactivos de tu área. En total son 190 reactivos.</p>
            <div className="hoja">
              <ul className="estructura-lista" style={{ marginTop: 0 }}>
                {COMUNES_BUAP.map(([slug, nombre, r]) => (
                  <li key={slug}>
                    <Link href={`/areas/${slug}`}>{nombre}</Link>
                    <span>{r}</span>
                  </li>
                ))}
                {general && (
                  <li className="estructura-modulo">
                    <Link href={`/areas/${general.slug}`}>{general.nombre} (módulo general)</Link>
                    <span>24</span>
                  </li>
                )}
                {modulo && (
                  <li className="estructura-modulo">
                    <Link href={`/areas/${modulo.slug}`}>{modulo.nombre} (módulo de área)</Link>
                    <span>24</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="pila">
            <h2 className="h2-corto">Tu diagnóstico de esta área</h2>
            <p>Las preguntas salen del banco de {a.corto}: las áreas comunes más los dos módulos de tu área, no las de Medicina.</p>
            <div className="hoja pila ag-diag">
              <span className="xs">Sin cuenta · gratis</span>
              <h3>Mini diagnóstico</h3>
              <p className="small" style={{ margin: 0 }}>
                {mini ? `${mini.preguntas} preguntas, 3 de cada área, en ${mini.minutos} minutos.` : "3 preguntas de cada área en 20 minutos."} Ves cómo vas en cada una.
              </p>
              <Link className="btn chico" href={`/mini?area=${a.slug}`}>
                Hacer el mini diagnóstico
              </Link>
            </div>
            <div className="hoja pila ag-diag">
              <span className="xs">Con cuenta</span>
              <h3>Diagnóstico completo</h3>
              <p className="small" style={{ margin: 0 }}>
                {diag ? `${diag.preguntas} preguntas por secciones, unos ${diag.minutos} minutos.` : "Por secciones, una por área."} Te da tus 3 prioridades por subárea.
              </p>
              <Link className="btn sec chico" href={diagnosticoHref}>
                Hacer el diagnóstico completo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="angosto pila">
          <h2 className="h2-corto">Preguntas resueltas del área</h2>
          {muestras.length === 0 && <p className="small">Las preguntas de muestra aparecen en cuanto se publique el banco.</p>}
          {muestras.map((m, i) => (
            <article key={m.id} className="hoja pila">
              <span className="membrete">
                Pregunta {i + 1} · {m.area}
              </span>
              <Enunciado texto={m.enunciado} />
              <ol className="opciones" type="A">
                {m.opciones.map((o) => (
                  <li key={o.opcionId} className={`opcion${o.correcta ? " correcta" : ""}`}>
                    <Formula texto={o.texto} />
                    {o.correcta && <span className="sem ok"> Correcta</span>}
                    {!o.correcta && o.argumentacion && (
                      <span className="small">
                        {" "}
                        · <Formula texto={o.argumentacion} />
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              {m.explicacion && (
                <div className="porque">
                  <b>Por qué:</b> <Explicacion texto={m.explicacion} />
                </div>
              )}
            </article>
          ))}

          <nav aria-label="Otras áreas generales" style={{ marginTop: 24 }}>
            <p className="small" style={{ marginBottom: 8 }}>
              Otras áreas generales:
            </p>
            <div className="fila">
              {otras.map((o) => (
                <Link key={o.slug} href={`/carreras/${o.slug}`} className="pastilla enlace">
                  <IconoArea nombre={o.icono} size={16} /> {o.nombre}
                </Link>
              ))}
              <Link href="/carreras/medicina" className="pastilla enlace">
                <IconoArea nombre="Stethoscope" size={16} /> Medicina
              </Link>
            </div>
          </nav>
          <p className="xs">Estudiar es Clave no tiene relación con el CENEVAL ni con la BUAP. Las preguntas de esta página son originales.</p>
        </div>
      </section>
    </div>
  );
}
