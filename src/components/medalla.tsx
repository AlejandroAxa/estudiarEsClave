/** Medalla por materia: una por cada 10 aciertos. Bronce, plata, oro y luego diamante. */
const COLORES = {
  bronce: ["#e3a36b", "#a8622c"],
  plata: ["#e6eef2", "#8fa3ad"],
  oro: ["#ffd76a", "#c9961a"],
  diamante: ["#9ff0ff", "#00a3cc"],
  vacia: ["transparent", "currentColor"],
} as const;

export type NivelMedalla = keyof typeof COLORES;

export function nivelDe(numero: number): NivelMedalla {
  if (numero <= 0) return "vacia";
  if (numero === 1) return "bronce";
  if (numero === 2) return "plata";
  if (numero === 3) return "oro";
  return "diamante";
}

export function Medalla({ numero, tamano = 40, titulo }: { numero: number; tamano?: number; titulo?: string }) {
  const nivel = nivelDe(numero);
  const [cara, canto] = COLORES[nivel];
  const vacia = nivel === "vacia";
  return (
    <svg
      viewBox="0 0 48 60"
      width={tamano * 0.8}
      height={tamano}
      className={`medalla-svg medalla-${nivel}`}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {!vacia && (
        <>
          <path d="M12 2h10l6 18h-10z" fill="#1f5bc4" />
          <path d="M36 2H26l-6 18h10z" fill="#00c5f4" />
        </>
      )}
      <circle cx="24" cy="38" r="19" fill={canto} opacity={vacia ? 0.25 : 1} />
      <circle cx="24" cy="38" r="14.5" fill={vacia ? "none" : cara} stroke={vacia ? "currentColor" : "rgba(0,0,0,.18)"} strokeWidth="1.5" strokeDasharray={vacia ? "3 3" : undefined} />
      {!vacia && (
        <text x="24" y="43.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#0b1d2e" fontFamily="system-ui, sans-serif">
          {numero}
        </text>
      )}
    </svg>
  );
}

/** Roseta de 12 picos para las medallas de logro (se distinguen de las de materia). */
function roseta(cx: number, cy: number, r1: number, r2: number, picos = 12) {
  const pts: string[] = [];
  for (let i = 0; i < picos * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (Math.PI * i) / picos - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const TONOS_LOGRO = [
  ["#e3a36b", "#a8622c"],
  ["#e6eef2", "#8fa3ad"],
  ["#ffd76a", "#c9961a"],
  ["#9ff0ff", "#00a3cc"],
  ["#ffb3ab", "#d2453a"],
] as const;

/**
 * Medalla de logro: por aciertos totales (palomita) o por racha de aciertos
 * (flama). El tono sube con la meta: bronce, plata, oro, diamante y rubí.
 */
export function MedallaLogro({
  tipo,
  meta,
  escalon,
  ganada,
  tamano = 56,
  titulo,
}: {
  tipo: "aciertos" | "racha";
  meta: number;
  /** 0 a 4: qué tan alta es la meta dentro de su serie. */
  escalon: number;
  ganada: boolean;
  tamano?: number;
  titulo?: string;
}) {
  const [cara, canto] = TONOS_LOGRO[Math.min(escalon, TONOS_LOGRO.length - 1)];
  return (
    <svg
      viewBox="0 0 64 64"
      width={tamano}
      height={tamano}
      className={`medalla-logro ${ganada ? "ganada" : "bloqueada"}`}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <polygon points={roseta(32, 32, 31, 26)} fill={ganada ? canto : "none"} stroke={ganada ? "none" : "currentColor"} strokeWidth="1.5" strokeDasharray={ganada ? undefined : "3 3"} />
      <circle cx="32" cy="32" r="21" fill={ganada ? cara : "none"} stroke={ganada ? "rgba(0,0,0,.18)" : "currentColor"} strokeWidth="1.5" opacity={ganada ? 1 : 0.5} />
      {tipo === "racha" ? (
        <path
          d="M32 12c4 6 9 8 9 14a9 9 0 0 1-18 0c0-3 1.5-5 3-6.5 0 2.5 1.5 4 3 4-1-4 0-8 3-11.5z"
          transform="translate(8 6) scale(.75)"
          fill={ganada ? "#f08a24" : "currentColor"}
          opacity={ganada ? 1 : 0.4}
          className="medalla-logro-icono"
        />
      ) : (
        <path d="M24 22l5 5 11-11" fill="none" stroke={ganada ? "#1b7342" : "currentColor"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity={ganada ? 1 : 0.4} transform="translate(0 2)" />
      )}
      <text x="32" y="47" textAnchor="middle" fontSize={meta >= 100 ? 12 : 14} fontWeight="900" fill={ganada ? "#0b1d2e" : "currentColor"} opacity={ganada ? 1 : 0.6} fontFamily="system-ui, sans-serif">
        {meta}
      </text>
    </svg>
  );
}
