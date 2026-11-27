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
