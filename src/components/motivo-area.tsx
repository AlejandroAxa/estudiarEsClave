/**
 * Motivo visual de cada área general (páginas /carreras/[slug]).
 * Mismo lenguaje de la marca (trazo continuo en el color de acento sobre noche),
 * pero cada área tiene su propio objeto: un estado de cuenta, una ficha de
 * archivo, un expediente clínico y un plano. El acento nunca va en botones.
 */
import type { TemaArea } from "@/lib/areas-generales";

const c = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y} h${w} v${h} h${-w} Z`;

const DIBUJOS: Record<TemaArea, string[]> = {
  // Un ticket con su total, unas barras que suben y una moneda.
  cuentas: [
    "M70 30 H210 V214 L196 226 L182 214 L168 226 L154 214 L140 226 L126 214 L112 226 L98 214 L84 226 L70 214 Z",
    "M92 62 H188 M92 86 H160 M92 110 H176 M92 134 H150",
    "M92 170 H188 M150 190 H188",
    "M246 220 H382",
    rect(256, 170, 22, 50),
    rect(290, 140, 22, 80),
    rect(324, 104, 22, 116),
    "M252 150 L300 112 L330 126 L376 70 M376 70 H356 M376 70 V90",
    c(340, 40, 18),
    "M340 30 V50 M334 35 H344 M334 45 H346",
  ],
  // Un libro abierto, unas comillas y una columna clásica.
  archivo: [
    "M200 80 Q140 56 60 70 V222 Q140 208 200 232 Q260 208 340 222 V70 Q260 56 200 80 Z",
    "M200 80 V232",
    "M84 104 H176 M84 128 H170 M84 152 H176 M84 176 H150",
    "M224 104 H316 M224 128 H300 M224 152 H316",
    "M236 182 q-10 0 -10 12 q0 10 10 10 M262 182 q-10 0 -10 12 q0 10 10 10",
    "M300 20 H380 M306 32 H374 M314 32 V60 M330 32 V60 M346 32 V60 M362 32 V60 M306 60 H374 M300 70 H380",
  ],
  // El expediente: tabla con clip, renglones marcados y el latido de la marca.
  expediente: [
    "M90 40 H250 V236 H90 Z",
    "M140 28 H200 V52 H140 Z",
    c(122, 92, 8),
    "M140 92 H226",
    c(122, 126, 8),
    "M140 126 H214",
    c(122, 160, 8),
    "M140 160 H226",
    "M117 92 L121 96 L128 87 M117 126 L121 130 L128 121",
    "M270 140 C262 92 300 54 362 50 C362 110 326 146 270 140 Z M270 140 C298 118 324 94 350 66",
    "M100 204 H150 L162 180 L176 228 L188 204 H380",
  ],
  // El plano: engrane, escuadra, cotas y una curva.
  plano: [
    c(130, 120, 56),
    c(130, 120, 20),
    ...Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i;
      const x1 = 130 + 56 * Math.cos(a);
      const y1 = 120 + 56 * Math.sin(a);
      const x2 = 130 + 72 * Math.cos(a);
      const y2 = 120 + 72 * Math.sin(a);
      return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }),
    "M240 226 L240 70 L380 226 Z",
    "M262 204 L262 132 L326 204 Z",
    "M58 236 H202 M58 228 V244 M202 228 V244",
    "M392 70 V226 M384 70 H400 M384 226 H400",
    "M240 40 Q300 -4 380 30",
  ],
};

export function DibujoMotivo({ tema, acento, className = "ilustracion" }: { tema: TemaArea; acento: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 260" role="presentation" aria-hidden style={{ color: acento }}>
      {DIBUJOS[tema].map((t, i) => (
        <path key={i} d={t} pathLength={1} style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </svg>
  );
}
