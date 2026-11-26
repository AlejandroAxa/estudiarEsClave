/**
 * Fondo del titular: un cielo de madrugada en lila y durazno sobre un mar
 * oscuro que se mueve despacio. Capas de SVG que se desplazan en bucle; con
 * movimiento reducido se quedan quietas.
 */
const ola = (y: number, a: number, fase: number) => {
  // Dos periodos idénticos de 1440 para que el desplazamiento de -50 % no se note.
  let d = `M0 ${y}`;
  for (let x = 0; x <= 2880; x += 120) {
    const yy = y + Math.sin((x / 1440) * Math.PI * 4 + fase) * a;
    d += ` L${x} ${yy.toFixed(1)}`;
  }
  return `${d} L2880 600 L0 600 Z`;
};

const CAPAS = [
  { y: 150, a: 3, fase: 0, color: "url(#mar-1)", vel: 60 },
  { y: 190, a: 5, fase: 1.4, color: "url(#mar-2)", vel: 44 },
  { y: 260, a: 8, fase: 2.6, color: "url(#mar-3)", vel: 30 },
  { y: 370, a: 12, fase: 0.8, color: "url(#mar-4)", vel: 20 },
];

export function Horizonte() {
  return (
    <div className="horizonte" aria-hidden>
      <div className="horizonte-cielo" />
      <div className="horizonte-sol" />
      <svg
        className="horizonte-mar"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mar-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a97a6" />
            <stop offset="1" stopColor="#003b5c" />
          </linearGradient>
          <linearGradient id="mar-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#326680" />
            <stop offset="1" stopColor="#0b2634" />
          </linearGradient>
          <linearGradient id="mar-3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a3f51" />
            <stop offset="1" stopColor="#06141c" />
          </linearGradient>
          <linearGradient id="mar-4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d222d" />
            <stop offset="1" stopColor="#020608" />
          </linearGradient>
        </defs>
        {CAPAS.map((c, i) => (
          <path
            key={i}
            d={ola(c.y, c.a, c.fase)}
            fill={c.color}
            className="horizonte-ola"
            style={{ "--vel": `${c.vel}s` } as React.CSSProperties}
          />
        ))}
      </svg>
      <div className="horizonte-grano" />
    </div>
  );
}
