/** Semáforo de resultados: forma + texto + color, nunca solo color (RNF-08). */
type N = "Dominas" | "En desarrollo" | "Área de oportunidad" | string | null | undefined;

export function Semaforo({ nivel }: { nivel: N }) {
  const k = nivel === "Dominas" ? "ok" : nivel === "En desarrollo" ? "mid" : nivel === "Área de oportunidad" ? "bad" : "na";
  return (
    <span className={`sem ${k}`}>
      <svg viewBox="0 0 24 24" aria-hidden>
        {k === "ok" && <circle cx="12" cy="12" r="10" fill="currentColor" />}
        {k === "mid" && (
          <>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
          </>
        )}
        {k === "bad" && <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3.2 2.4" />}
        {k === "na" && (
          <>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M8 12h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
      </svg>
      {k === "na" ? "Datos insuficientes" : nivel}
    </span>
  );
}

/** Barra con la banda deseable (80–100 %) y el indicador del alumno. */
export function BarraRango({ valor, etiqueta }: { valor: number | null; etiqueta: string }) {
  if (valor == null) return <span className="xs">—</span>;
  const pct = Math.max(0, Math.min(100, valor * 100));
  return (
    <div className="barra-rango" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={etiqueta}>
      <div className="banda" />
      <div className="ind" style={{ left: `${pct}%` }} />
    </div>
  );
}

export const porcentaje = (d: number | string | null | undefined) => (d == null ? "—" : `${Math.round(Number(d) * 100)} %`);
