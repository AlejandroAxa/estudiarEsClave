/**
 * Composición de fórmulas del banco con KaTeX (y mhchem para química).
 *
 * Reglas del texto del banco:
 *   $…$     fórmula en línea          $$…$$   fórmula en su propia línea
 *   \ce{…}  química (dentro de $…$)    \$      signo de pesos literal
 * Por compatibilidad, «$1,200» o «$45» (pesos seguidos de espacio o
 * puntuación) se leen como dinero, no como fórmula.
 *
 * Seguridad: solo entra texto del banco, que se importa validado desde el
 * panel de administración. Aun así, todo lo que no es fórmula se escapa como
 * HTML y KaTeX corre con trust:false, así que el resultado no puede inyectar
 * etiquetas ni enlaces.
 */
import katex from "katex";
import "katex/contrib/mhchem";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escaparHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

// Una fórmula que empieza con número («$1 - \cos^2 x$») se distingue del dinero porque trae TeX (\, ^, _, { o }).
const TOKENS = /\\\$|\$\$([\s\S]+?)\$\$|\$(\d[^$\n]*?[\\^_{}][^$\n]*?)\$|\$\d[\d,]*(?:\.\d+)?(?![\d,.]\d)(?=[\s,;:)?!]|\.(?!\d)|$)(?!\$)|\$([^$\n]+?)\$/g;

function tex(fuente: string, bloque: boolean) {
  return katex.renderToString(fuente, {
    displayMode: bloque,
    throwOnError: false,
    output: "htmlAndMathml",
    trust: false,
    strict: "ignore",
  });
}

/** ¿El texto trae alguna fórmula? (para no tocar los 80 reactivos que no la usan). */
export function tieneFormulas(texto: string) {
  TOKENS.lastIndex = 0;
  for (const m of texto.matchAll(TOKENS)) if (m[1] != null || m[2] != null || m[3] != null) return true;
  return false;
}

/** Texto del banco → HTML seguro. Los saltos de línea se conservan. */
export function componer(texto: string): string {
  const br = (s: string) => escaparHtml(s).replace(/\n/g, "<br>");
  let out = "";
  let ultimo = 0;
  for (const m of texto.matchAll(TOKENS)) {
    const previo = texto.slice(ultimo, m.index);
    ultimo = m.index! + m[0].length;
    if (m[1] != null) {
      // Una fórmula en bloque ya rompe la línea: no se agregan <br> alrededor.
      out += br(previo.replace(/\s*\n\s*$/, "")) + tex(m[1].trim(), true);
      if (texto[ultimo] === "\n") ultimo++;
      continue;
    }
    out += br(previo);
    if (m[0] === "\\$") out += "$";
    else if ((m[2] ?? m[3]) != null) out += tex((m[2] ?? m[3])!.trim(), false);
    else out += escaparHtml(m[0]); // dinero: $1,200
  }
  return out + br(texto.slice(ultimo));
}

/** Variables de la ficha de datos: el símbolo se compone; la descripción admite fórmulas. */
export function componerDatos(datos: { tex: string; desc: string }[] | null | undefined) {
  return (datos ?? []).map((d) => ({ tex: tex(d.tex, false), desc: componer(d.desc) }));
}

/**
 * Explicación como pasos: si las líneas empiezan con «1)», «2.» o «Paso 1:»,
 * se devuelven por separado para mostrarlas como lista numerada.
 */
export function pasosDe(explicacion: string): string[] | null {
  const lineas = explicacion.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lineas.length < 2) return null;
  const marca = /^(?:paso\s*)?\d+\s*[).:-]\s*/i;
  if (!lineas.every((l) => marca.test(l))) return null;
  return lineas.map((l) => componer(l.replace(marca, "")));
}

/** HTML de la explicación: lista numerada si viene en pasos, párrafo si no. */
export function componerExplicacion(explicacion: string) {
  const pasos = pasosDe(explicacion);
  if (pasos) return `<ol class="pasos">${pasos.map((p) => `<li><span>${p}</span></li>`).join("")}</ol>`;
  return `<p>${componer(explicacion)}</p>`;
}

/** Fórmulas que KaTeX no puede componer (para rechazar el banco al importar). */
export function erroresFormula(texto: string): string[] {
  const errores: string[] = [];
  for (const m of texto.matchAll(TOKENS)) {
    const fuente = m[1] ?? m[2] ?? m[3];
    if (fuente == null) continue;
    try {
      katex.renderToString(fuente, { throwOnError: true, displayMode: m[1] != null, trust: false, strict: "ignore" });
    } catch (e) {
      errores.push(`«${fuente.trim().slice(0, 40)}»: ${(e as Error).message.replace(/^KaTeX parse error: /, "")}`);
    }
  }
  return errores;
}
