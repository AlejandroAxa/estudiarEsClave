import type { TemaArea } from "@/lib/areas-generales";
import { DibujoMotivo } from "./motivo-area";

/**
 * Cabecera de las páginas con sesión (Inicio, Diagnóstico, Práctica, Avance,
 * Liga, Cuenta). Toma el lenguaje de las páginas editoriales públicas (fondo
 * noche, ceja en píldora cian, titular ancho y franja de cifras) para que entrar
 * a la cuenta no se sienta como otro sitio. El acento y el motivo salen del área
 * del alumno.
 */
export function CabeceraApp({
  ceja,
  titulo,
  sub,
  acciones,
  cifras = [],
  tema,
  acento,
}: {
  ceja: React.ReactNode;
  titulo: React.ReactNode;
  sub?: React.ReactNode;
  acciones?: React.ReactNode;
  cifras?: { valor: React.ReactNode; etiqueta: string; nota?: React.ReactNode }[];
  tema?: TemaArea;
  acento?: string;
}) {
  return (
    <section className="app-cabeza" style={acento ? ({ "--acento": acento } as React.CSSProperties) : undefined}>
      {tema && (
        <div className="app-cabeza-motivo" aria-hidden>
          <DibujoMotivo tema={tema} acento={acento ?? "var(--lc)"} />
        </div>
      )}
      <div className="wrap app-cabeza-rejilla">
        <div className="app-cabeza-texto">
          <span className="app-ceja">{ceja}</span>
          <h1 className="app-h1">{titulo}</h1>
          {sub && <p className="app-sub">{sub}</p>}
        </div>
        {acciones && <div className="app-acciones">{acciones}</div>}
      </div>
      {cifras.length > 0 && (
        <div className="wrap">
          <dl className="app-cifras" style={{ "--n": cifras.length } as React.CSSProperties}>
            {cifras.map((c) => (
              <div key={c.etiqueta}>
                <dt>{c.etiqueta}</dt>
                <dd>{c.valor}</dd>
                {c.nota && <span className="app-cifra-nota">{c.nota}</span>}
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

/** Título de bloque dentro de las páginas con sesión: ojo en mayúsculas + título. */
export function TituloBloque({ ojo, titulo, children, id }: { ojo?: string; titulo: React.ReactNode; children?: React.ReactNode; id?: string }) {
  return (
    <div className="app-titulo">
      <div>
        {ojo && <span className="app-ojo">{ojo}</span>}
        <h2 id={id}>{titulo}</h2>
      </div>
      {children && <div className="app-titulo-extra">{children}</div>}
    </div>
  );
}
