/**
 * Piezas del estilo «editorial» (referencia: infinityideas.studio): ceja en
 * píldora, titulares en mayúsculas con mucho aire entre letras, una franja de
 * cifras, tarjetas numeradas y una marquesina. Se usa en Guía, Preguntas y
 * Áreas generales.
 */
export function HeroEditorial({
  ceja,
  titulo,
  sub,
  cifras = [],
  children,
}: {
  ceja: string;
  titulo: React.ReactNode;
  sub?: React.ReactNode;
  cifras?: [string, string][];
  children?: React.ReactNode;
}) {
  return (
    <section className="ed-hero">
      <div className="wrap">
        <span className="ed-ceja">{ceja}</span>
        <h1 className="ed-h1">{titulo}</h1>
        {sub && <p className="ed-sub">{sub}</p>}
        {children}
        {cifras.length > 0 && (
          <dl className="ed-cifras">
            {cifras.map(([n, t]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{n}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export function Marquesina({
  items,
  etiqueta,
}: {
  items: string[];
  etiqueta: string;
}) {
  const fila = (oculta: boolean) => (
    <ul aria-hidden={oculta || undefined}>
      {items.map((t, k) => (
        <li key={k}>{t}</li>
      ))}
    </ul>
  );
  return (
    <div className="ed-marquesina" role="region" aria-label={etiqueta}>
      <div className="ed-marquesina-pista">
        {fila(false)}
        {fila(true)}
      </div>
    </div>
  );
}

export function Encabezado({
  ceja,
  titulo,
  children,
}: {
  ceja: string;
  titulo: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="ed-encabezado">
      <span className="ed-ojo">{ceja}</span>
      <h2 className="ed-h2">{titulo}</h2>
      {children}
    </header>
  );
}
