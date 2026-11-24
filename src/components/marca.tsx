/** Logotipo «estudiar es / clave» con la v como latido de electrocardiograma. */
export function Latido({ className, titulo }: { className?: string; titulo?: string }) {
  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden={titulo ? undefined : true} role={titulo ? "img" : undefined}>
      {titulo ? <title>{titulo}</title> : null}
      <path d="M0 72H10L20 18L32 96L42 52H60" fill="none" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Logotipo() {
  return (
    <span className="logo" role="img" aria-label="Estudiar es Clave">
      <span className="pre" aria-hidden>
        estudiar es
      </span>
      <span className="word" aria-hidden>
        cla
        <Latido />e
      </span>
    </span>
  );
}

export function MarcaChica() {
  return (
    <>
      <Latido className="latido-chico" />
      <b>clave</b>
    </>
  );
}
