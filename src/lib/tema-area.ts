/**
 * Capa de tema por área (propuesta «Un sistema, cuatro áreas»).
 *
 * La base es la misma para todos: Inicio, Diagnóstico, Práctica, Simulacro,
 * Avance y Liga, con los mismos componentes, botones en azul y semáforo solo en
 * resultados. Encima, cada área general de la BUAP cambia solo la superficie:
 * el color de acento, el motivo (motivo-area.tsx), el objeto que dibuja el
 * avance del día, la gráfica de la racha y algunas palabras.
 *
 * El tema sale de la ruta del perfil. Medicina cae en Naturales y de Salud y
 * se ve como siempre; Psicología va con Sociales y Humanidades, como en la
 * oferta oficial; las rutas de Ciencias Exactas van con Ingenierías.
 */
import { areaGeneralPorRuta, type TemaArea } from "./areas-generales";

export type VocabularioArea = {
  /** Área general a la que pertenece la ruta (para mostrarla junto al saludo). */
  area: string;
  acento: string;
  tema: TemaArea;
  /** «Consultorio de» Ana. */
  espacio: string;
  /** Nombre del diagnóstico completo en Inicio y en /diagnostico. */
  diagnostico: string;
  diagnosticoTexto: string;
  /** Nombre de las 10 preguntas del día (nav, Inicio, Práctica, examen). */
  practica: string;
  /** «Tu dosis de hoy», en minúscula después de «Tu». */
  practicaHoy: string;
  /** Título de la página de práctica. */
  practicaTitulo: string;
  /** Botón para empezar la práctica: «Tomar mi dosis». */
  tomar: string;
  /** Botón cuando ya completó las 10: «Tomar otra dosis». */
  tomarOtra: string;
  /** Nombre del bloque general de práctica. */
  bloqueGeneral: string;
  /** Pieza con la que se dibuja el avance del día (lectores de pantalla). */
  pieza: string;
  /** Racha: «día seguido» / «días seguidos». */
  racha: [string, string];
  /** Frases al acertar en la práctica. */
  aciertos: string[];
  /** Encabezado del reporte de resultados. */
  reporte: string;
};

const SALUD: Omit<VocabularioArea, "area" | "acento" | "tema"> = {
  espacio: "Consultorio de",
  diagnostico: "Laboratorio",
  diagnosticoTexto: "Tu primer estudio completo te dice qué atender primero.",
  practica: "Dosis diaria",
  practicaHoy: "dosis de hoy",
  practicaTitulo: "Farmacia",
  tomar: "Tomar mi dosis",
  tomarOtra: "Tomar otra dosis",
  bloqueGeneral: "Dosis general",
  pieza: "cápsulas",
  racha: ["latido seguido", "latidos seguidos"],
  aciertos: ["¡Eso! Diagnóstico certero.", "Correcto. Así se lee un caso.", "Bien visto. Siguiente paciente.", "Exacto. Pulso firme."],
  reporte: "Laboratorio Estudiar es Clave",
};

const VOCABULARIO: Record<TemaArea, Omit<VocabularioArea, "area" | "acento" | "tema">> = {
  expediente: SALUD,
  cuentas: {
    espacio: "Despacho de",
    diagnostico: "Auditoría",
    diagnosticoTexto: "Tu primera auditoría completa te dice qué cuentas no cuadran.",
    practica: "Cuota diaria",
    practicaHoy: "cuota de hoy",
    practicaTitulo: "Caja",
    tomar: "Pagar mi cuota",
    tomarOtra: "Pagar otra cuota",
    bloqueGeneral: "Cuota general",
    pieza: "monedas",
    racha: ["día en positivo", "días en positivo"],
    aciertos: ["Cuadra.", "Correcto. Cuentas claras.", "Bien visto. Siguiente movimiento.", "Exacto. Saldo a favor."],
    reporte: "Auditoría Estudiar es Clave",
  },
  archivo: {
    espacio: "Archivo de",
    diagnostico: "Fichero",
    diagnosticoTexto: "Tu primer fichero completo te dice qué temas faltan por leer.",
    practica: "Ficha del día",
    practicaHoy: "ficha de hoy",
    practicaTitulo: "Sala de lectura",
    tomar: "Abrir mi ficha",
    tomarOtra: "Abrir otra ficha",
    bloqueGeneral: "Ficha general",
    pieza: "fichas",
    racha: ["página seguida", "páginas seguidas"],
    aciertos: ["Bien argumentado.", "Correcto. Buena lectura.", "Bien visto. Siguiente ficha.", "Exacto. Fuente confirmada."],
    reporte: "Fichero Estudiar es Clave",
  },
  plano: {
    espacio: "Taller de",
    diagnostico: "Banco de pruebas",
    diagnosticoTexto: "Tu primera prueba completa te dice qué pieza reforzar.",
    practica: "Serie diaria",
    practicaHoy: "serie de hoy",
    practicaTitulo: "Mesa de trabajo",
    tomar: "Hacer mi serie",
    tomarOtra: "Hacer otra serie",
    bloqueGeneral: "Serie general",
    pieza: "tramos",
    racha: ["día de obra", "días de obra"],
    aciertos: ["Cálculo correcto.", "Correcto. Estructura firme.", "Bien visto. Siguiente pieza.", "Exacto. Medida justa."],
    reporte: "Banco de pruebas Estudiar es Clave",
  },
};

const RUTAS_FUERA_DE_EPIU: Record<string, { tema: TemaArea; area: string; acento: string }> = {
  medicina: { tema: "expediente", area: "Ciencias Naturales y de Salud", acento: "#8FE0C4" },
  psicologia: { tema: "archivo", area: "Ciencias Sociales y Humanidades", acento: "#E9D8EF" },
  "exactas-fis": { tema: "plano", area: "Ingenierías y Ciencias Exactas", acento: "#9CC9F5" },
  "exactas-pye": { tema: "plano", area: "Ingenierías y Ciencias Exactas", acento: "#9CC9F5" },
};

/**
 * Los nombres de lo que se hace (menú, títulos y botones) son los mismos en las
 * cinco áreas: en la auditoría de noviembre de 2026, «Pagar mi cuota», «Caja» o
 * «Farmacia» se leían como cobros o no decían qué hacía la página. El tema del
 * área se queda en el acento, el motivo, la racha, las frases al acertar y el
 * saludo («Despacho de Ana»).
 */
const FUNCIONAL = {
  diagnostico: "Diagnóstico",
  diagnosticoTexto: "Tu primer diagnóstico completo te dice qué estudiar primero.",
  practica: "Práctica diaria",
  practicaHoy: "práctica de hoy",
  practicaTitulo: "Práctica",
  tomar: "Empezar mis 10 preguntas",
  tomarOtra: "Hacer 10 preguntas más",
  bloqueGeneral: "Mezcla del día",
} satisfies Partial<VocabularioArea>;

/** Vocabulario y tema de una ruta. Sin ruta (o una desconocida) se queda con Salud, el diseño original. */
export function temaDeRuta(rutaId: string | null | undefined): VocabularioArea {
  const general = rutaId ? areaGeneralPorRuta(rutaId) : undefined;
  const base = general
    ? { tema: general.tema, area: general.nombre, acento: general.acento }
    : (rutaId && RUTAS_FUERA_DE_EPIU[rutaId]) || RUTAS_FUERA_DE_EPIU.medicina;
  return { ...base, ...VOCABULARIO[base.tema], ...FUNCIONAL };
}

export const plural = (n: number, [uno, varios]: [string, string]) => (n === 1 ? uno : varios);
