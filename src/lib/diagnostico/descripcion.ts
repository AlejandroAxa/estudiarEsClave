/**
 * Descripción personal (R11, txt-1). Plantillas fijas con tres huecos que salen
 * del resultado real. La variante se elige con la semilla del intento: un mismo
 * resultado siempre muestra el mismo texto. Ninguna frase promete el ingreso.
 */
import { derivar, elegir } from "../aleatorio";
import type { ResultadoDiagnostico } from "./calificar";

export const VERSION_TEXTOS = "txt-1";

const FUERTE = [
  "Tu punto fuerte hoy es {s}: ahí ya respondes con seguridad.",
  "Donde mejor te fue fue en {s}. Esa base te va a sostener.",
  "{s} es tu terreno firme por ahora; cuídalo con repasos cortos.",
  "Llegas con ventaja en {s}. Eso no se improvisa.",
];
const PRIORIDAD = [
  "Lo que más puntos te puede dar ahora es {s}, porque vale mucho en el examen y aún tiene margen.",
  "Si solo estudias una cosa esta semana, que sea {s}: pesa en el examen y ahí está tu mayor margen.",
  "Tu siguiente consulta es {s}. Subirla mueve tu calificación más que cualquier otra.",
  "{s} es la receta de esta semana: mucho peso en el examen y espacio para crecer.",
];
const ERROR = [
  "Ojo con un patrón que se repitió: {e}",
  "El error que más se te repitió: {e}",
  "Un hábito a corregir, porque apareció varias veces: {e}",
];
const SIN_ERROR = [
  "No apareció ningún error repetido, así que tus fallos parecen descuidos sueltos más que un patrón.",
  "Tus fallos no forman un patrón claro; eso es buena señal.",
  "Ningún tipo de error se repitió dos veces. Bien.",
];

export function describir(
  r: ResultadoDiagnostico,
  semilla: number,
  nombres: { subarea: (id: string) => string; error: (id: string) => string },
): string {
  const frases: string[] = [];
  const conDatos = r.subareas.filter((s) => s.dominio != null);
  if (conDatos.length) {
    const mejor = [...conDatos].sort((a, b) => b.dominio! - a.dominio! || b.peso - a.peso)[0];
    if (mejor.dominio! > 0) frases.push(elegir(FUERTE, derivar(semilla, 1)).replace("{s}", nombres.subarea(mejor.id)));
  }
  const p1 = r.prioridades[0];
  if (p1) frases.push(elegir(PRIORIDAD, derivar(semilla, 2)).replace("{s}", nombres.subarea(p1.id)));
  const e1 = r.errores[0];
  if (e1) {
    const desc = nombres.error(e1.errorId);
    frases.push(elegir(ERROR, derivar(semilla, 3)).replace("{e}", desc.charAt(0).toLowerCase() + desc.slice(1) + "."));
  } else if (conDatos.length) {
    frases.push(elegir(SIN_ERROR, derivar(semilla, 3)));
  }
  return frases.join(" ");
}
