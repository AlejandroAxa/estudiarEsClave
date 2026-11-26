import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { COMUNES_BUAP, areaPorSlug } from "@/lib/areas-exani";
import { totalCarreras } from "@/lib/areas-generales";
import { ENFOQUE_GRUPO, carreraPorSlug, hrefCarrera, todasLasCarreras } from "@/lib/carreras";
import { muestrasPublicas } from "@/lib/consultas";
import { IconoArea } from "@/components/area-exani";
import { DibujoMotivo } from "@/components/motivo-area";
import { Enunciado, Explicacion, Formula } from "@/components/formula";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return todasLasCarreras().map((c) => ({ slug: c.area.slug, carrera: c.slug }));
}

type Params = { params: Promise<{ slug: string; carrera: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, carrera } = await params;
  const c = carreraPorSlug(slug, carrera);
  if (!c) return {};
  return {
    title: `EXANI-II para ${c.nombre} BUAP: qué viene y cómo prepararte`,
    description: `Qué presentas en el EXANI-II si vas por ${c.nombre} en la BUAP (${c.area.nombre}): las 190 preguntas por área, qué reforzar y un mini diagnóstico gratis sin registro.`,
    alternates: { canonical: `/carreras/${slug}/${carrera}` },
  };
}

export default async function PaginaCarrera({ params }: Params) {
  const { slug, carrera } = await params;
  const c = carreraPorSlug(slug, carrera);
  if (!c) notFound();
  const { area: a, grupo } = c;
  const general = areaPorSlug(a.general);
  const modulo = areaPorSlug(a.modulo);
  const enfoque = ENFOQUE_GRUPO[grupo.nombre];
  const muestras = await muestrasPublicas(a.rutaId, 2).catch(() => []);
  const companeras = grupo.carreras.filter((x) => x !== c.nombre);
  const miniHref = `/mini?area=${a.slug}`;

  const bloques = [
    ...COMUNES_BUAP.map(([s, nombre, r]) => ({ slug: s, nombre, r, tipo: s === "ingles" ? "No cuenta" : "Todos" })),
    ...(general ? [{ slug: general.slug, nombre: general.nombre, r: general.reactivos, tipo: "Módulo general" }] : []),
    ...(modulo ? [{ slug: modulo.slug, nombre: modulo.nombre, r: modulo.reactivos, tipo: "Tu área" }] : []),
  ];
  const max = Math.max(...bloques.map((b) => b.r));
  const total = bloques.reduce((n, b) => n + b.r, 0);

  const faq = [
    {
      p: `¿Qué examen presento para ${c.nombre} en la BUAP?`,
      r: `El EXANI-II de la BUAP para el área de ${a.nombre}: ${total} reactivos con las áreas comunes, el módulo general de ${general?.nombre ?? "tu área"} y el módulo de ${modulo?.nombre ?? a.nombre}.`,
    },
    {
      p: `¿Las preguntas son distintas a las de otras carreras de ${a.corto}?`,
      r: `No. Las ${totalCarreras(a)} licenciaturas del área presentan el mismo examen. Lo que cambia entre carreras es el puntaje que necesitas, porque cada una tiene distinta demanda.`,
    },
    {
      p: "¿Se resta por error?",
      r: "No. Las preguntas sin responder cuentan como no acertadas, igual que las incorrectas, así que conviene contestar todas.",
    },
    {
      p: `¿Cómo me preparo para ${c.nombre}?`,
      r: "Empieza por saber dónde estás: un diagnóstico te dice qué subáreas dominas y cuáles no. Luego practica un poco cada día empezando por tus prioridades, y haz un simulacro con tiempo cada par de semanas.",
    },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
  };

  return (
    <div className={`ag ag-${a.tema} carrera`} style={{ "--acento": a.acento } as React.CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="noche band area-hero ag-hero">
        <div className="wrap area-hero-rejilla" style={{ position: "relative", zIndex: 1 }}>
          <div>
            <nav className="migas" aria-label="Ruta">
              <Link href="/carreras">Áreas generales</Link> <span aria-hidden>/</span> <Link href={`/carreras/${a.slug}`}>{a.corto}</Link>{" "}
              <span aria-hidden>/</span> <span>{c.nombre}</span>
            </nav>
            <div className="fila" style={{ marginTop: 18 }}>
              <span className="pastilla oscura">Licenciatura · BUAP</span>
              <span className="pastilla oscura">
                <IconoArea nombre={a.icono} size={14} color="var(--acento)" /> {a.nombre}
              </span>
            </div>
            <p className="carrera-ceja">EXANI-II para</p>
            <h1 className="carrera-h1">{c.nombre}</h1>
            <p className="lead" style={{ maxWidth: "58ch" }}>
              {enfoque?.perfil ?? a.texto} Aquí ves qué te van a preguntar, qué conviene reforzar y cómo saber hoy dónde estás.
            </p>
            <div className="fila" style={{ marginTop: 22 }}>
              <Link className="btn" href={miniHref}>
                Hacer mi mini diagnóstico gratis <ArrowRight size={18} aria-hidden />
              </Link>
              <a className="btn sec" href="#examen">
                Qué viene en el examen
              </a>
            </div>
            <ul className="carrera-promesas">
              <li>
                <Check size={16} aria-hidden /> 20 minutos
              </li>
              <li>
                <Check size={16} aria-hidden /> Sin cuenta ni tarjeta
              </li>
              <li>
                <Check size={16} aria-hidden /> Preguntas de {a.corto}
              </li>
            </ul>
          </div>
          <DibujoMotivo tema={a.tema} acento={a.acento} />
        </div>
        <div className="wrap">
          <dl className="carrera-cifras">
            <div>
              <dt>Reactivos</dt>
              <dd>{total}</dd>
            </div>
            <div>
              <dt>Opciones por pregunta</dt>
              <dd>3</dd>
            </div>
            <div>
              <dt>Se resta por error</dt>
              <dd>No</dd>
            </div>
            <div>
              <dt>Carreras con tu mismo examen</dt>
              <dd>{totalCarreras(a)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="band" id="examen">
        <div className="wrap carrera-dos">
          <div className="pila">
            <span className="app-ojo">Tu examen</span>
            <h2 className="h2-corto">Qué presentas para {c.nombre}</h2>
            <p>
              Las áreas comunes que presentan todos los aspirantes de la BUAP, más dos módulos de 24 reactivos que dependen de tu área. Inglés es
              diagnóstico: lo presentas, pero no suma a tu puntaje.
            </p>
            {enfoque && (
              <aside className="carrera-consejo">
                <b>Qué conviene reforzar</b>
                <p>{enfoque.reforzar}</p>
              </aside>
            )}
          </div>
          <div className="hoja sin-pad">
            <div className="membrete">
              <b>
                <IconoArea nombre={a.icono} size={18} color="var(--lc)" /> Estructura · {a.corto}
              </b>
              <span>{total} reactivos</span>
            </div>
            <ul className="carrera-estructura">
              {bloques.map((b) => (
                <li key={b.slug} className={b.tipo === "Tu área" ? "tuya" : b.tipo === "No cuenta" ? "no-cuenta" : undefined}>
                  <Link href={`/areas/${b.slug}`}>{b.nombre}</Link>
                  <span className="tipo">{b.tipo}</span>
                  <span className="num">{b.r}</span>
                  <span className="barra" aria-hidden>
                    <i style={{ width: `${(b.r / max) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {modulo && (
        <section className="band carrera-modulo">
          <div className="wrap">
            <span className="app-ojo">Lo propio de tu área</span>
            <h2 className="h2-corto">{modulo.nombre}</h2>
            <p className="lead" style={{ maxWidth: "62ch" }}>
              {modulo.definicion}
            </p>
            <ol className="carrera-subareas">
              {modulo.subareas.map((s) => (
                <li key={s.nombre}>
                  <span className="num">{s.reactivos}</span>
                  <div>
                    <b>{s.nombre}</b>
                    <span className="small">{s.temas.slice(0, 4).join(" · ")}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="small">
              <Link href={`/areas/${modulo.slug}`}>Ver el temario completo del módulo</Link>
            </p>
          </div>
        </section>
      )}

      <section className="band">
        <div className="wrap">
          <span className="app-ojo">Cómo te preparas aquí</span>
          <h2 className="h2-corto">Tres pasos, en este orden</h2>
          <ol className="carrera-pasos">
            <li>
              <span>01</span>
              <h3>Mini diagnóstico</h3>
              <p>3 preguntas de cada área de tu examen, sin cuenta. Sales con lo que dominas y lo que no.</p>
              <Link href={miniHref}>Hacerlo ahora</Link>
            </li>
            <li>
              <span>02</span>
              <h3>Práctica diaria</h3>
              <p>10 preguntas al día empezando por tus prioridades. Cada opción trae su porqué y lo que fallas vuelve a los 1, 3 y 7 días.</p>
              <Link href="/planes">Qué incluye gratis</Link>
            </li>
            <li>
              <span>03</span>
              <h3>Simulacro</h3>
              <p>Todo seguido y con un solo cronómetro, como el día del examen. Al final, la revisión pregunta por pregunta.</p>
              <Link href="/guia">Leer la guía del examen</Link>
            </li>
          </ol>
        </div>
      </section>

      {muestras.length > 0 && (
        <section className="band" style={{ paddingTop: 0 }}>
          <div className="angosto pila">
            <span className="app-ojo">Para que veas el estilo</span>
            <h2 className="h2-corto">Preguntas resueltas de {a.corto}</h2>
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
          </div>
        </section>
      )}

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap carrera-dos">
          <div className="pila">
            <span className="app-ojo">Preguntas frecuentes</span>
            <h2 className="h2-corto">Sobre el examen para {c.nombre}</h2>
            <div className="faq">
              {faq.map((f) => (
                <details key={f.p}>
                  <summary>{f.p}</summary>
                  <p>{f.r}</p>
                </details>
              ))}
            </div>
          </div>
          <nav className="pila" aria-label={`Carreras de ${grupo.nombre}`}>
            <span className="app-ojo">{grupo.nombre}</span>
            <h2 className="h2-corto">Carreras con tu mismo examen</h2>
            <p className="small">Estas carreras presentan exactamente el mismo examen que {c.nombre}.</p>
            <div className="fila">
              {companeras.map((x) => (
                <Link key={x} href={hrefCarrera(a.slug, x)} className="pastilla enlace">
                  {x}
                </Link>
              ))}
              <Link href={`/carreras/${a.slug}#carreras`} className="pastilla enlace">
                Las {totalCarreras(a)} de {a.corto}
              </Link>
            </div>
          </nav>
        </div>
      </section>

      <section className="noche band carrera-final">
        <div className="wrap" style={{ textAlign: "center" }}>
          <h2>
            ¿Vas por {c.nombre}? Empieza por saber <em>dónde estás</em>.
          </h2>
          <p className="lead" style={{ marginInline: "auto" }}>
            20 minutos, sin cuenta y sin tarjeta. Al terminar ves cómo vas en cada área de tu examen.
          </p>
          <Link className="btn" href={miniHref}>
            Hacer mi mini diagnóstico <ArrowRight size={18} aria-hidden />
          </Link>
          <p className="xs" style={{ marginTop: 24, marginInline: "auto" }}>
            Estudiar es Clave no tiene relación con el CENEVAL ni con la BUAP. La convocatoria de tu año es la que manda: una carrera puede cambiar de
            área o de sede.
          </p>
        </div>
      </section>
    </div>
  );
}
