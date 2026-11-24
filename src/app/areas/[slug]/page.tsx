import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AREAS, TIPOS, areaPorSlug } from "@/lib/areas-exani";
import { BIBLIOGRAFIA } from "@/lib/bibliografia-exani";
import { IconoArea, TrazoArea } from "@/components/area-exani";
import { IlustracionArea, acentoDe } from "@/components/ilustracion-area";

export const dynamicParams = false;

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = areaPorSlug((await params).slug);
  if (!a) return {};
  return {
    title: `${a.nombre} en el EXANI-II: temario, bibliografía y pregunta resuelta`,
    description: `${a.reactivos} reactivos. ${a.lema} Temario por subárea, bibliografía oficial de apoyo y una pregunta original resuelta.`,
  };
}

export default async function PaginaArea({ params }: { params: Promise<{ slug: string }> }) {
  const a = areaPorSlug((await params).slug);
  if (!a) notFound();
  const tipo = TIPOS[a.tipo];
  const bib = BIBLIOGRAFIA[a.slug] ?? [];
  const max = Math.max(...a.subareas.map((s) => s.reactivos));
  const relacionadas = a.relacionadas.map(areaPorSlug).filter((x) => x !== undefined);
  const letras = ["A", "B", "C"];

  return (
    <div style={{ "--acento": acentoDe(a.slug) } as React.CSSProperties}>
      <section className="noche band area-hero">
        <div className="wrap area-hero-rejilla" style={{ position: "relative", zIndex: 1 }}>
          <div>
          <nav className="migas" aria-label="Ruta">
            <Link href="/areas">Áreas del EXANI-II</Link> <span aria-hidden>/</span> <span>{a.nombre}</span>
          </nav>
          <div className="fila" style={{ marginTop: 18 }}>
            <span className="pastilla oscura">{tipo.nombre}</span>
            <span className="pastilla oscura">{a.reactivos} reactivos</span>
          </div>
          <div className="area-titulo">
            <span className="area-icono">
              <IconoArea nombre={a.icono} size={40} color="var(--acento)" />
            </span>
            <h1>{a.nombre}</h1>
          </div>
          <p className="disp area-lema">{a.lema}</p>
          <p className="lead" style={{ maxWidth: "60ch" }}>
            {a.definicion}
          </p>
          <dl className="area-cifras">
            <div>
              <dt>Reactivos</dt>
              <dd>{a.reactivos}</dd>
            </div>
            <div>
              <dt>Subáreas</dt>
              <dd>{a.subareas.length}</dd>
            </div>
            <div>
              <dt>Puntaje global</dt>
              <dd>{a.tipo === "diagnostica" ? "No cuenta" : "Sí cuenta"}</dd>
            </div>
          </dl>
          <p className="small" style={{ marginTop: 12 }}>
            {tipo.nota}
          </p>
          </div>
          <IlustracionArea slug={a.slug} />
        </div>
        <TrazoArea slug={a.slug} />
      </section>

      <section className="band">
        <div className="wrap pila">
          <h2>Cómo se reparte</h2>
          <div className="hoja sin-pad">
            <div className="membrete">
              <b>
                <IconoArea nombre={a.icono} size={20} color="var(--lc)" /> Expediente · {a.nombre}
              </b>
              <span>Fuente: Guía para el sustentante, CENEVAL 2025</span>
            </div>
            <div className="desplazable">
              <table className="lab">
                <thead>
                  <tr>
                    <th scope="col">Subárea</th>
                    <th scope="col" className="solo-ancho">Temas</th>
                    <th scope="col">Reactivos</th>
                  </tr>
                </thead>
                <tbody>
                  {a.subareas.map((s) => (
                    <tr key={s.nombre}>
                      <td style={{ fontWeight: 700 }}>{s.nombre}</td>
                      <td className="small solo-ancho">{s.temas.join(" · ")}</td>
                      <td className="num">
                        <span className="peso">
                          <span className="peso-barra" style={{ width: `${(s.reactivos / max) * 100}%` }} />
                        </span>
                        {s.reactivos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h2 style={{ marginTop: 48 }}>Temario</h2>
          <div className="rejilla-2">
            {a.subareas.map((s, i) => (
              <article key={s.nombre} className="hoja temario">
                <span className="xs">Subárea {i + 1}</span>
                <h3>{s.nombre}</h3>
                <ul>
                  {s.temario.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="angosto pila">
          <h2 className="h2-corto">Una pregunta para que veas el estilo</h2>
          <article className="hoja pila">
            <span className="membrete">Pregunta original · {a.nombre}</span>
            {a.muestra.contexto && <blockquote className="contexto">{a.muestra.contexto}</blockquote>}
            <p className="pregunta">{a.muestra.enunciado}</p>
            <ol className="opciones">
              {a.muestra.opciones.map((o, i) => (
                <li key={o.texto} className={`opcion${o.correcta ? " correcta" : ""}`}>
                  <span className="burbuja" aria-hidden>
                    {letras[i]}
                  </span>
                  <span>
                    {o.texto}
                    {o.correcta && <span className="sem ok" style={{ marginLeft: 8 }}>Correcta</span>}
                    <span className="porque" style={{ display: "block" }}>{o.porque}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="porque">
              <b>Por qué:</b> {a.muestra.explicacion}
            </div>
          </article>

          <aside className="hoja guia-oficial">
            <h3>En la guía oficial</h3>
            <p className="small">
              El ejemplo del CENEVAL para esta área está en las páginas {a.ejemploGuia.paginas} de la <i>Guía para el sustentante EXANI-II</i> (junio
              de 2025): {a.ejemploGuia.resumen}
            </p>
            <p className="xs" style={{ marginBottom: 0 }}>
              No reproducimos las preguntas de la guía. Consúltala gratis en el sitio del CENEVAL.
            </p>
          </aside>

          <h2 className="h2-corto" style={{ marginTop: 40 }}>Cómo estudiarla</h2>
          <ul className="consejos">
            {a.consejo.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {a.carreras && (
            <p className="small">
              <b>Suele pedirse en:</b> {a.carreras} Tu universidad decide los módulos: revísalo en su convocatoria.
            </p>
          )}

          <h2 className="h2-corto" style={{ marginTop: 40 }}>Bibliografía de apoyo</h2>
          {bib.length > 0 ? (
            <details className="hoja bibliografia">
              <summary>
                {bib.length} {bib.length === 1 ? "referencia recomendada" : "referencias recomendadas"} por el CENEVAL
              </summary>
              <ol>
                {bib.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ol>
            </details>
          ) : (
            <p className="small">
              La guía no recomienda bibliografía para esta área: no evalúa contenidos, sino tu habilidad para leer textos variados. Lo que más ayuda es leer
              seguido y de todo.
            </p>
          )}

          <div className="fila" style={{ marginTop: 32 }}>
            <Link className="btn" href="/mini">
              Hacer 18 preguntas sin registrarme
            </Link>
            <Link className="btn sec" href="/entrar">
              Crear cuenta y hacer el diagnóstico
            </Link>
          </div>

          {relacionadas.length > 0 && (
            <nav aria-label="Áreas relacionadas" style={{ marginTop: 32 }}>
              <p className="small" style={{ marginBottom: 8 }}>
                También te puede servir:
              </p>
              <div className="fila">
                {relacionadas.map((r) => (
                  <Link key={r.slug} href={`/areas/${r.slug}`} className="pastilla enlace">
                    <IconoArea nombre={r.icono} size={16} /> {r.nombre}
                  </Link>
                ))}
                <Link href="/areas" className="pastilla enlace">
                  Todas las áreas
                </Link>
              </div>
            </nav>
          )}
          <p className="xs">Estudiar es Clave no tiene relación con el CENEVAL. Las preguntas de esta página son originales.</p>
        </div>
      </section>
    </div>
  );
}
