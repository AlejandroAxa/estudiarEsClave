import { diaMx, sumarDias } from "@/lib/fechas";

/** Pulso de racha: un latido por día estudiado, línea plana el día que no. Últimos 14 días. */
export function Pulso({ dias, racha, mejor }: { dias: string[]; racha: number; mejor: number }) {
  const hoy = diaMx();
  const set = new Set(dias);
  const n = 14;
  const ancho = 600;
  const paso = ancho / n;
  let d = `M0 40`;
  let estudiados = 0;
  for (let i = 0; i < n; i++) {
    const dia = sumarDias(hoy, i - (n - 1));
    const x = i * paso;
    if (set.has(dia)) {
      estudiados++;
      d += ` L${x + paso * 0.25} 40 L${x + paso * 0.38} 10 L${x + paso * 0.52} 58 L${x + paso * 0.64} 30 L${x + paso * 0.74} 40 L${x + paso} 40`;
    } else d += ` L${x + paso} 40`;
  }
  return (
    <div className="pulso">
      <div className="fila entre">
        <span>
          <b className="cifra" style={{ fontSize: 28, color: "#fff" }}>
            {racha}
          </b>{" "}
          {racha === 1 ? "día seguido" : "días seguidos"}
        </span>
        <span className="small">Mejor racha: {mejor}</span>
      </div>
      <svg viewBox={`0 0 ${ancho} 64`} preserveAspectRatio="none" role="img" aria-label={`${estudiados} de los últimos ${n} días con estudio`}>
        <path d={d} />
      </svg>
    </div>
  );
}
