/**
 * Lo que dice el Profe Tomás mientras contestas. Frases cortas, en tú y sin
 * regaños: el error es parte del estudio. {materia}, {n} y {faltan} se
 * reemplazan al mostrarlas.
 */
export const profe = {
  inicioPractica: [
    "¡Aquí estoy contigo! Lee con calma y descarta primero la opción que seguro no es.",
    "Diez preguntas, una a la vez. Tú puedes.",
    "Hoy vamos por {materia}. Cada acierto te acerca a tu siguiente medalla.",
    "Respira, lee la pregunta completa y después las tres opciones.",
  ],
  inicioExamen: [
    "Modo examen: aquí no te digo si vas bien, pero sí que te acompaño. ¡Con todo!",
    "Administra tu tiempo: si una se atora, márcala y regresa al final.",
    "Lo que estudiaste está ahí. Lee con calma y confía en ti.",
  ],
  pregunta: [
    "Subraya mentalmente lo que te piden. A veces la clave está en una sola palabra.",
    "Si dudas entre dos, busca el dato que hace falsa a una de ellas.",
    "Vas muy bien. Sigue con este ritmo.",
    "Fíjate en palabras como «siempre», «nunca» o «excepto».",
    "Una a la vez. Lo que importa es esta pregunta.",
    "Si hay números, estima antes de calcular: te ayuda a descartar.",
  ],
  pensando: ["Mmm, déjame revisar…", "Revisando tu respuesta…"],
  acierto: [
    "¡Eso! Bien razonado.",
    "¡Correcta! Así se hace.",
    "¡Lo tienes! Lee el procedimiento para que se quede.",
    "¡Bien! Esa ya es tuya.",
    "¡Excelente! Vas sumando.",
  ],
  racha: [
    "¡{n} seguidas! Estás en racha.",
    "¡Racha de {n}! No te detengas.",
    "¡{n} al hilo! Así se prepara un examen.",
  ],
  bonoRacha: "¡Racha de {n}! Te ganaste {b} puntos extra.",
  error: [
    "Casi. Lee por qué la correcta sí es: de aquí sale lo que más aprendes.",
    "No pasa nada, para eso practicamos. Revisa el procedimiento con calma.",
    "Esta se queda en tu repaso y volverá en unos días. La próxima es tuya.",
    "Errar aquí es ganar en el examen real. Mira la explicación.",
  ],
  rachaRota: "Se cortó tu racha de {n}, pero tu mejor marca sigue en {m}. ¡Vamos por otra!",
  medallaCerca: "Te faltan {faltan} aciertos en {materia} para tu siguiente medalla.",
  medalla: "¡Medalla de {materia}! Llevas {n} aciertos en esta materia. +30 puntos.",
  espera: [
    "Tómate tu tiempo. Si te atoras, descarta la que menos te convence.",
    "¿Te atoraste? Vuelve a leer la pregunta: a veces la respuesta está en el enunciado.",
    "Sigo aquí. Sin prisa, pero sin pausa.",
  ],
  mitad: "¡Ya vas a la mitad! Sigue así.",
  ultimas: "Últimas preguntas. Cierra fuerte.",
  final: "¡Terminaste! Revisa tu resumen y vuelve mañana por más.",
};

/** Elige una frase de la lista sin depender de Math.random al dibujar. */
export function frase(lista: readonly string[], semilla: number, valores: Record<string, string | number> = {}) {
  const base = lista[Math.abs(semilla) % lista.length];
  return rellenar(base, valores);
}

export function rellenar(texto: string, valores: Record<string, string | number>) {
  return texto.replace(/\{(\w+)\}/g, (_, k) => String(valores[k] ?? ""));
}
