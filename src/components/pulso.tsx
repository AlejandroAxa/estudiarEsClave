import type { TemaArea } from "@/lib/areas-generales";
import { diaMx, sumarDias } from "@/lib/fechas";

/**
 * Racha de los últimos 14 días. Cada área la dibuja con su gráfica: latido
 * (Salud), balance que sube (Económico Administrativas), línea del tiempo
 * (Sociales y Humanidades) o cotas de obra (Ingenierías). El día sin estudio
 * siempre se ve plano o vacío.
 */
export function Pulso({
  dias,
  racha,
  mejor,
  tema = "expediente",
  textos = ["día seguido", "días seguidos"],
}: {
  dias: string[];
  racha: number;
  mejor: number;
  tema?: TemaArea;
  textos?: [string, string];
}) {
  const hoy = diaMx();
  const set = new Set(dias);
  const n = 14;
  const ancho = 600;
  const paso = ancho / n;
  const marcas = Array.from({ length: n }, (_, i) => set.has(sumarDias(hoy, i - (n - 1))));
  const estudiados = marcas.filter(Boolean).length;
  return (
    <div className={`pulso pulso-${tema}`}>
      <div className="fila entre">
        <span>
          <b className="cifra" style={{ fontSize: 28, color: "#fff" }}>
            {racha}
          </b>{" "}
          {racha === 1 ? textos[0] : textos[1]}
        </span>
        <span className="small">Mejor racha: {mejor}</span>
      </div>
      <svg viewBox={`0 0 ${ancho} 64`} preserveAspectRatio="none" role="img" aria-label={`${estudiados} de los últimos ${n} días con estudio`}>
        <Grafica tema={tema} marcas={marcas} paso={paso} ancho={ancho} />
      </svg>
    </div>
  );
}

function Grafica({ tema, marcas, paso, ancho }: { tema: TemaArea; marcas: boolean[]; paso: number; ancho: number }) {
  if (tema === "cuentas") {
    // Balance: sube un escalón cada día estudiado, se queda igual el día que no.
    const sube = 44 / Math.max(1, marcas.length);
    let y = 56;
    let d = `M0 ${y}`;
    marcas.forEach((m, i) => {
      if (m) y -= sube;
      d += ` H${i * paso + paso / 2} V${y.toFixed(1)} H${(i + 1) * paso}`;
    });
    return (
      <>
        <path className="guia" d={`M0 56 H${ancho}`} />
        <path className="relleno" d={`${d} V64 H0 Z`} />
        <path d={d} />
      </>
    );
  }
  if (tema === "archivo") {
    // Línea del tiempo: un punto por día; lleno si estudiaste, hueco si no.
    return (
      <>
        <path className="guia" d={`M${paso / 2} 34 H${ancho - paso / 2}`} />
        {marcas.map((m, i) =>
          m && marcas[i + 1] ? <path key={`t${i}`} d={`M${i * paso + paso / 2} 34 H${(i + 1) * paso + paso / 2}`} /> : null,
        )}
        {marcas.map((m, i) => (
          <circle key={i} className={m ? "lleno" : "hueco"} cx={i * paso + paso / 2} cy={34} r={m ? 7 : 5.5} />
        ))}
      </>
    );
  }
  if (tema === "plano") {
    // Cotas de obra: cada día estudiado levanta un tramo; el que no, queda en planta.
    const altos = marcas.map((_, i) => Math.min(54, 10 + 3 * marcas.slice(0, i + 1).filter(Boolean).length));
    return (
      <>
        <path className="guia" d={`M0 60 H${ancho}`} />
        {marcas.map((m, i) => {
          const x = i * paso + 6;
          const w = paso - 12;
          if (!m) return <path key={i} className="guia" d={`M${x} 60 h${w}`} strokeDasharray="4 4" />;
          const alto = altos[i];
          return <path key={i} d={`M${x} 60 V${60 - alto} H${x + w} V60 M${x} ${60 - alto} L${x + w} 60`} />;
        })}
      </>
    );
  }
  let d = `M0 40`;
  marcas.forEach((m, i) => {
    const x = i * paso;
    d += m
      ? ` L${x + paso * 0.25} 40 L${x + paso * 0.38} 10 L${x + paso * 0.52} 58 L${x + paso * 0.64} 30 L${x + paso * 0.74} 40 L${x + paso} 40`
      : ` L${x + paso} 40`;
  });
  return <path d={d} />;
}
