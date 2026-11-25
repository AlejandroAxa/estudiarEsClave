import type { TemaArea } from "@/lib/areas-generales";

/**
 * Avance del día: 10 piezas que se van tomando al contestar. Cada área dibuja
 * su propio objeto: cápsulas (Salud), monedas (Económico Administrativas),
 * fichas (Sociales y Humanidades) o tramos de regla (Ingenierías).
 */
export function Blister({ tomadas, total = 10, tema = "expediente", pieza = "cápsulas" }: { tomadas: number; total?: number; tema?: TemaArea; pieza?: string }) {
  return (
    <div>
      <div className={`blister blister-${tema}`} role="img" aria-label={`${Math.min(tomadas, total)} de ${total} ${pieza} del día`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`capsula ${i < tomadas ? "tomada" : ""}`}>
            {tema !== "expediente" && <Pieza tema={tema} i={i} />}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pieza({ tema, i }: { tema: TemaArea; i: number }) {
  if (tema === "cuentas")
    return (
      <svg viewBox="0 0 32 36" aria-hidden>
        <circle className="canto" cx="16" cy="20" r="14" />
        <circle className="cara" cx="16" cy="16" r="14" />
        <circle className="filo" cx="16" cy="16" r="9.5" />
        <text x="16" y="21" textAnchor="middle">
          $
        </text>
      </svg>
    );
  if (tema === "archivo") {
    const tab = (i % 3) * 7;
    return (
      <svg viewBox="0 0 32 52" aria-hidden>
        <path className="cara" d={`M2 9 h${3 + tab} v-7 h11 v7 h${14 - tab} v41 h-28 Z`} />
        <path className="renglon" d="M8 20 h16 M8 28 h12 M8 36 h16" />
        <rect className="lomo" x="2" y="46" width="28" height="4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 40" preserveAspectRatio="none" aria-hidden>
      <rect className="cara" x="0.75" y="8" width="30.5" height="24" />
      <path className="marca" d="M8 8 v6 M16 8 v10 M24 8 v6" />
    </svg>
  );
}
