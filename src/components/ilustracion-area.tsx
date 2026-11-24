/**
 * Ilustración propia de cada área: trazo continuo, como un monitor, sobre el
 * negatoscopio (DESIGN-F: «ilustración de trazo en lila claro sobre noche»).
 * Cada área tiene su dibujo y su color de acento; el acento solo vive sobre
 * fondo oscuro y en detalles decorativos, nunca en botones ni en el semáforo.
 */

const c = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y} h${w} v${h} h${-w} Z`;
const poli = (pts: [number, number][], cerrar = false) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (cerrar ? " Z" : "");

function helice() {
  const a: [number, number][] = [];
  const b: [number, number][] = [];
  const peld: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const y = 20 + i * 3.7;
    const s = Math.sin((i / 60) * Math.PI * 3);
    a.push([200 + 70 * s, y]);
    b.push([200 - 70 * s, y]);
    if (i % 5 === 2) peld.push(`M${(200 + 70 * s).toFixed(1)} ${y.toFixed(1)} H${(200 - 70 * s).toFixed(1)}`);
  }
  return [poli(a), poli(b), ...peld];
}

function hexagono(cx: number, cy: number, r: number) {
  return poli(
    Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((Math.PI / 3) * i + Math.PI / 6), cy + r * Math.sin((Math.PI / 3) * i + Math.PI / 6)] as [number, number]),
    true,
  );
}

const DADO = (x: number, y: number, puntos: [number, number][]) => [rect(x, y, 64, 64), ...puntos.map(([px, py]) => c(x + px, y + py, 4))];

export const DIBUJOS: Record<string, { acento: string; trazos: string[] }> = {
  "comprension-lectora": {
    acento: "#E9D8EF",
    trazos: [
      "M200 70 Q140 48 66 62 V214 Q140 200 200 222 Z",
      "M200 70 Q260 48 334 62 V214 Q260 200 200 222",
      "M88 92 Q135 82 182 94 M88 118 Q135 108 182 120 M88 144 Q130 136 160 144",
      "M218 94 Q265 82 312 92 M218 120 Q265 108 312 118 M218 146 Q250 138 290 144",
      c(300, 180, 22),
      "M316 196 L346 230",
    ],
  },
  "redaccion-indirecta": {
    acento: "#F4B8D9",
    trazos: [
      "M318 34 L356 72 L214 214 L170 228 L184 184 Z",
      "M184 184 L214 214 M300 52 L338 90",
      "M40 70 H200 M40 100 H170 M40 130 H190",
      "M50 176 L76 200 L124 150",
      "M30 240 Q60 220 90 240 T150 240",
    ],
  },
  "pensamiento-matematico": {
    acento: "#9CC9F5",
    trazos: ["M40 220 H366 M60 244 V24", "M90 52 Q200 338 310 52", "M70 208 L346 68", c(200, 195, 6), c(126, 172, 5), c(274, 97, 5), "M340 40 l12 0 M346 34 l0 12"],
  },
  ingles: {
    acento: "#8FE0C4",
    trazos: [
      "M70 40 H214 Q236 40 236 62 V122 Q236 144 214 144 H120 L84 176 L92 144 H70 Q48 144 48 122 V62 Q48 40 70 40 Z",
      "M184 128 H330 Q352 128 352 150 V198 Q352 220 330 220 H306 L316 250 L278 220 H184 Q162 220 162 198 V150 Q162 128 184 128 Z",
      "M78 78 H206 M78 104 H174",
      "M192 164 H322 M192 188 H290",
    ],
  },
  administracion: {
    acento: "#F7C59F",
    trazos: [
      rect(158, 30, 84, 46),
      rect(52, 164, 84, 46),
      rect(158, 164, 84, 46),
      rect(264, 164, 84, 46),
      "M200 76 V120 M94 120 H306 M94 120 V164 M200 120 V164 M306 120 V164",
      "M176 53 H224 M70 187 H118 M176 187 H224 M282 187 H330",
      "M40 238 H360",
    ],
  },
  aritmetica: {
    acento: "#E6E28A",
    trazos: [
      "M96 50 V118 M62 84 H130",
      "M270 84 H338",
      "M72 156 L120 204 M120 156 L72 204",
      "M270 180 H338",
      c(304, 158, 6),
      c(304, 202, 6),
      "M172 120 H228 M172 142 H228",
    ],
  },
  biologia: { acento: "#8FE0C4", trazos: helice() },
  "calculo-diferencial-e-integral": {
    acento: "#9CC9F5",
    trazos: [
      "M40 222 H366 M60 244 V24",
      "M62 204 C150 204 210 70 350 48",
      "M150 222 L340 60",
      rect(214, 116, 22, 106),
      rect(236, 100, 22, 122),
      rect(258, 88, 22, 134),
      rect(280, 77, 22, 145),
      c(205, 128, 6),
    ],
  },
  "ciencias-de-la-salud": {
    acento: "#F4B8D9",
    trazos: [
      "M200 232 C80 152 58 72 128 60 C170 54 194 84 200 102 C206 84 230 54 272 60 C342 72 320 152 200 232 Z",
      "M30 142 H140 L160 142 L176 96 L196 188 L212 118 L224 142 H370",
    ],
  },
  derecho: {
    acento: "#E9D8EF",
    trazos: [
      "M200 48 V218",
      "M136 234 H264 M160 218 H240 V234 M160 218 V234",
      "M84 74 H316",
      c(200, 40, 9),
      "M84 74 L56 150 M84 74 L112 150",
      "M50 150 Q84 186 118 150 Z",
      "M316 74 L288 150 M316 74 L344 150",
      "M282 150 Q316 186 350 150 Z",
    ],
  },
  economia: {
    acento: "#F7C59F",
    trazos: ["M60 28 V222 H366", "M90 56 L334 204", "M90 204 L334 56", "M212 130 V222 M60 130 H212", c(212, 130, 7), "M330 46 l10 -2 -2 10 M90 216 l0 0"],
  },
  filosofia: {
    acento: "#E9D8EF",
    trazos: [
      "M130 46 H270",
      "M146 46 Q134 70 160 76 H240 Q266 70 254 46",
      rect(150, 76, 100, 14),
      "M166 90 V208 M234 90 V208 M188 96 V204 M212 96 V204",
      rect(150, 208, 100, 14),
      "M126 222 H274 V236 H126 Z",
      "M304 78 Q304 50 326 50 Q348 50 348 72 Q348 88 326 96 V112",
      c(326, 128, 3),
    ],
  },
  fisica: {
    acento: "#9CC9F5",
    trazos: [
      "M140 30 H260",
      "M200 30 L282 168",
      c(290, 182, 17),
      "M200 30 L118 168",
      "M108 176 Q200 226 292 200",
      "M40 238 q20 -22 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0",
    ],
  },
  historia: {
    acento: "#F7C59F",
    trazos: [
      "M96 206 H304",
      "M116 206 V180 H284 V206",
      "M136 180 V154 H264 V180",
      "M156 154 V128 H244 V154",
      "M176 128 V102 H224 V128",
      "M188 102 V84 H212 V102",
      "M200 128 V206",
      c(324, 62, 20),
      "M30 236 H370 M70 228 V244 M200 228 V244 M330 228 V244",
    ],
  },
  literatura: {
    acento: "#F4B8D9",
    trazos: [
      "M320 26 C236 58 184 130 152 214 C206 152 266 110 320 26 Z",
      "M320 26 L152 214 L140 240",
      "M226 120 L250 128 M200 150 L226 156",
      "M40 110 H130 M40 136 H118 M40 162 H104",
      "M40 228 C80 196 124 252 174 228 S250 214 280 232",
    ],
  },
  "matematicas-financieras": {
    acento: "#E6E28A",
    trazos: [
      rect(56, 172, 40, 50),
      rect(116, 142, 40, 80),
      rect(176, 108, 40, 114),
      rect(236, 74, 40, 148),
      "M40 222 H370",
      "M60 150 L252 46 M232 42 L256 44 L248 66",
      c(330, 168, 28),
      "M340 154 Q330 146 320 152 Q312 162 330 168 Q348 174 340 184 Q330 192 318 182 M330 140 V196",
    ],
  },
  premedicina: {
    acento: "#8FE0C4",
    trazos: [
      c(148, 30, 6),
      c(252, 30, 6),
      "M148 36 Q138 110 200 124",
      "M252 36 Q262 110 200 124",
      "M200 124 V172 Q200 232 262 232 Q306 232 306 190 V176",
      c(306, 156, 20),
      c(306, 156, 9),
      "M40 120 H90 L102 92 L116 150 L128 120 H150",
    ],
  },
  "probabilidad-y-estadistica": {
    acento: "#9CC9F5",
    trazos: [
      ...DADO(46, 150, [[16, 16], [32, 32], [48, 48]]),
      ...DADO(134, 174, [[18, 18], [46, 18], [18, 46], [46, 46]]),
      "M216 130 C258 130 268 46 296 46 C324 46 334 130 376 130",
      "M216 130 H376 M296 46 V130",
      "M256 104 V130 M336 104 V130",
    ],
  },
  psicologia: {
    acento: "#E9D8EF",
    trazos: [
      "M150 236 V194 Q108 182 108 140 Q108 56 192 48 Q272 44 292 110 Q298 130 310 150 L292 156 Q298 182 282 192 Q262 198 250 192 V236",
      c(170, 112, 6),
      c(216, 92, 6),
      c(244, 134, 6),
      c(198, 150, 6),
      "M176 110 L210 94 M220 98 L240 128 M238 138 L204 148 M192 146 L174 118 M176 116 L238 132",
    ],
  },
  quimica: {
    acento: "#8FE0C4",
    trazos: [
      hexagono(140, 130, 60),
      c(140, 130, 32),
      "M140 70 V30 M192 160 L226 180",
      "M272 54 V108 L232 198 Q226 216 244 216 H334 Q352 216 346 198 L306 108 V54 M262 54 H316",
      "M250 170 H328",
      c(284, 148, 5),
      c(302, 130, 4),
      c(292, 112, 3),
    ],
  },
  "ciencias-experimentales": {
    acento: "#E6E28A",
    trazos: [
      "M176 38 L230 58 L200 142 L146 122 Z",
      "M170 126 L162 152 M150 158 H186",
      "M232 76 Q300 112 282 204",
      "M138 176 H300",
      "M120 236 H320 M210 204 V236 Q210 204 240 204 H282",
      c(78, 96, 30),
      "M100 118 L124 144",
      "M62 96 Q78 80 94 96",
    ],
  },
  "ciencias-sociales": {
    acento: "#F7C59F",
    trazos: [
      c(116, 104, 22),
      c(200, 84, 26),
      c(284, 104, 22),
      "M76 204 Q76 142 116 138 Q156 142 156 204",
      "M146 204 Q146 122 200 118 Q254 122 254 204",
      "M244 204 Q244 142 284 138 Q324 142 324 204",
      "M44 214 H356",
      "M116 70 Q150 30 200 44 Q250 30 284 70",
    ],
  },
  "habilidades-blandas": {
    acento: "#E6E28A",
    trazos: [
      "M70 60 H130 Q130 40 150 40 Q170 40 170 60 H230 V120 Q250 120 250 140 Q250 160 230 160 V220 H70 V160 Q90 160 90 140 Q90 120 70 120 Z",
      "M230 60 H290 Q290 80 310 80 Q330 80 330 60 H350 V220 H230",
      c(120, 110, 6),
      c(180, 170, 6),
      "M126 114 L174 166",
      "M268 120 L290 142 L330 100",
    ],
  },
  "razonamiento-clinico-avanzado": {
    acento: "#F4B8D9",
    trazos: [
      rect(110, 46, 180, 200),
      rect(160, 30, 80, 32),
      "M200 100 V160 M170 130 H230",
      "M140 196 H260 M140 220 H220",
      "M300 120 H340 L352 92 L366 150 L378 120 H396",
    ],
  },
  "ciencias-economico-administrativas": {
    acento: "#F7C59F",
    trazos: [
      rect(40, 92, 220, 120),
      c(150, 152, 30),
      "M58 110 H80 M220 194 H242",
      "M160 138 Q150 130 140 136 Q132 146 150 152 Q168 158 160 168 Q150 176 138 166 M150 124 V180",
      "M290 212 V140 M320 212 V110 M350 212 V80",
      "M280 120 L360 52 M340 50 L362 50 L360 72",
      "M30 230 H370",
    ],
  },
  "ciencias-sociales-y-humanidades": {
    acento: "#E9D8EF",
    trazos: [
      "M200 40 C120 40 60 92 60 150 C60 200 100 226 140 220 C170 216 160 186 186 180 C214 174 226 206 262 204 C316 200 340 160 340 128 C340 76 280 40 200 40 Z",
      c(140, 100, 14),
      c(206, 82, 14),
      c(270, 108, 14),
      c(116, 160, 12),
      "M300 40 L250 150 M250 150 L240 176 L262 160 Z",
    ],
  },
  "ciencias-naturales-y-de-salud": {
    acento: "#8FE0C4",
    trazos: [
      "M90 220 C80 120 160 50 310 40 C310 160 230 230 90 220 Z",
      "M90 220 C150 170 210 120 280 70",
      "M150 172 L150 130 M190 140 L196 100 M230 110 L246 82 M170 156 L130 150 M210 126 L172 120",
      "M260 210 H300 L312 186 L326 236 L338 210 H380",
    ],
  },
  "ingenierias-y-ciencias-exactas": {
    acento: "#9CC9F5",
    trazos: [
      c(150, 130, 64),
      c(150, 130, 22),
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i;
        return `M${(150 + 64 * Math.cos(a)).toFixed(1)} ${(130 + 64 * Math.sin(a)).toFixed(1)} L${(150 + 84 * Math.cos(a)).toFixed(1)} ${(130 + 84 * Math.sin(a)).toFixed(1)}`;
      }),
      "M250 220 L330 60 L370 220 Z",
      "M290 220 V180 H330 V220",
      "M250 236 H380",
    ],
  },
};

export function IlustracionArea({ slug, className = "ilustracion" }: { slug: string; className?: string }) {
  const d = DIBUJOS[slug];
  if (!d) return null;
  return (
    <svg className={className} viewBox="0 0 400 260" role="presentation" aria-hidden style={{ color: d.acento }}>
      {d.trazos.map((t, i) => (
        <path key={i} d={t} pathLength={1} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </svg>
  );
}

export const acentoDe = (slug: string) => DIBUJOS[slug]?.acento ?? "#E9D8EF";
