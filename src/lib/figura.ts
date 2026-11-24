/**
 * Gráficas para la revisión (nunca durante el examen): se dibujan en el
 * servidor como SVG a partir del campo opcional «figura» del reactivo.
 * La función se interpreta con un analizador propio (sin eval): solo números,
 * la variable t o x, + − · / ^ y paréntesis.
 */
import { escaparHtml } from "./formulas";

export interface Figura {
  tipo: "parabola" | "funcion";
  f: string;
  dominio: [number, number];
  marcar?: [number, number];
  ejes?: { x?: string; y?: string };
}

type Nodo = (v: number) => number;

export function analizar(expr: string): Nodo {
  const s = expr.replace(/\s+/g, "").replace(/−/g, "-").replace(/[·×]/g, "*");
  let i = 0;
  const ver = () => s[i];
  function primario(): Nodo {
    if (ver() === "(") {
      i++;
      const n = suma();
      if (s[i++] !== ")") throw new Error("Falta «)»");
      return n;
    }
    if (ver() === "t" || ver() === "x") {
      i++;
      return (v) => v;
    }
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (!m) throw new Error(`No se entiende la función cerca de «${s.slice(i, i + 6)}»`);
    i += m[0].length;
    const k = Number(m[0]);
    return () => k;
  }
  function potencia(): Nodo {
    const b = primario();
    if (ver() === "^") {
      i++;
      const e = unario();
      return (v) => b(v) ** e(v);
    }
    return b;
  }
  function unario(): Nodo {
    if (ver() === "-") {
      i++;
      const n = unario();
      return (v) => -n(v);
    }
    if (ver() === "+") i++;
    return potencia();
  }
  function producto(): Nodo {
    let n = unario();
    for (;;) {
      const op = ver();
      // Multiplicación implícita: 5t, 2(t+1)
      if (op === "*" || op === "/") {
        i++;
        const d = unario();
        const a = n;
        n = op === "*" ? (v) => a(v) * d(v) : (v) => a(v) / d(v);
      } else if (op === "t" || op === "x" || op === "(") {
        const d = potencia();
        const a = n;
        n = (v) => a(v) * d(v);
      } else return n;
    }
  }
  function suma(): Nodo {
    let n = producto();
    while (ver() === "+" || ver() === "-") {
      const op = s[i++];
      const d = producto();
      const a = n;
      n = op === "+" ? (v) => a(v) + d(v) : (v) => a(v) - d(v);
    }
    return n;
  }
  const raiz = suma();
  if (i !== s.length) throw new Error(`Sobra «${s.slice(i)}» en la función`);
  return raiz;
}

const num = (n: number) => (Math.round(n * 100) / 100).toString();

/** SVG accesible con la curva, los ejes y el punto marcado. */
export function figuraSvg(fig: Figura): string {
  const f = analizar(fig.f);
  const [x0, x1] = fig.dominio;
  const N = 80;
  const pts = Array.from({ length: N + 1 }, (_, k) => {
    const x = x0 + ((x1 - x0) * k) / N;
    return [x, f(x)] as const;
  });
  const ys = pts.map((p) => p[1]).concat(fig.marcar ? [fig.marcar[1]] : [], [0]);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys) * 1.1 || 1;
  const W = 480, H = 300, m = { i: 48, d: 20, a: 24, b: 50 };
  const X = (x: number) => m.i + ((x - x0) / (x1 - x0)) * (W - m.i - m.d);
  const Y = (y: number) => H - m.b - ((y - y0) / (y1 - y0)) * (H - m.a - m.b);
  const ruta = pts.map(([x, y], k) => `${k ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ");
  const ejeX = Y(Math.max(y0, 0));
  const ex = escaparHtml(fig.ejes?.x ?? "t");
  const ey = escaparHtml(fig.ejes?.y ?? "y");
  let marca = "";
  if (fig.marcar) {
    const [mx, my] = fig.marcar;
    marca = `<line x1="${X(mx)}" y1="${Y(my)}" x2="${X(mx)}" y2="${ejeX}" class="guia"/><line x1="${m.i}" y1="${Y(my)}" x2="${X(mx)}" y2="${Y(my)}" class="guia"/>
<circle cx="${X(mx)}" cy="${Y(my)}" r="6" class="punto"/><text x="${X(mx) + 10}" y="${Y(my) - 10}" class="etq">(${num(mx)}, ${num(my)})</text>`;
  }
  const desc = `Gráfica de ${escaparHtml(fig.f)} entre ${num(x0)} y ${num(x1)}${fig.marcar ? `, con el punto (${num(fig.marcar[0])}, ${num(fig.marcar[1])}) marcado` : ""}.`;
  return `<svg class="figura" viewBox="0 0 ${W} ${H}" role="img" aria-label="${desc}">
<line x1="${m.i}" y1="${ejeX}" x2="${W - m.d}" y2="${ejeX}" class="eje"/><line x1="${m.i}" y1="${m.a}" x2="${m.i}" y2="${H - m.b}" class="eje"/>
<text x="${W - m.d}" y="${ejeX + 38}" class="etq" text-anchor="end">${ex}</text><text x="${m.i - 10}" y="${m.a + 4}" class="etq" text-anchor="end">${ey}</text>
<text x="${m.i}" y="${ejeX + 18}" class="num" text-anchor="middle">${num(x0)}</text><text x="${X(x1)}" y="${ejeX + 18}" class="num" text-anchor="middle">${num(x1)}</text>
<path d="${ruta}" class="curva"/>${marca}</svg>`;
}
