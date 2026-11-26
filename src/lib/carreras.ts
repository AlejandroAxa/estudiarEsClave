/**
 * Una página por licenciatura (/carreras/[area]/[carrera]). Todas las carreras
 * de un área general presentan el mismo EXANI-II, así que el contenido del
 * examen sale del área; lo propio de cada carrera es su grupo (con quién
 * comparte perfil) y cómo se le explica al aspirante qué le conviene reforzar.
 */
import { AREAS_GENERALES, type AreaGeneral, type GrupoCarreras } from "./areas-generales";

export type Carrera = { slug: string; nombre: string; area: AreaGeneral; grupo: GrupoCarreras };

export function slugCarrera(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Medicina tiene su propia página y su propia evaluación (EIPM). */
export const tienePaginaPropia = (nombre: string) => nombre === "Medicina";

export const hrefCarrera = (areaSlug: string, nombre: string) => (tienePaginaPropia(nombre) ? "/carreras/medicina" : `/carreras/${areaSlug}/${slugCarrera(nombre)}`);

export function todasLasCarreras(): Carrera[] {
  return AREAS_GENERALES.flatMap((area) =>
    area.grupos.flatMap((grupo) => grupo.carreras.filter((c) => !tienePaginaPropia(c)).map((nombre) => ({ slug: slugCarrera(nombre), nombre, area, grupo }))),
  );
}

export const carreraPorSlug = (areaSlug: string, slug: string) => todasLasCarreras().find((c) => c.area.slug === areaSlug && c.slug === slug);

/**
 * Para quién es cada grupo y qué partes del examen conviene reforzar. Las
 * subáreas que se nombran son las del módulo de área o del módulo general que
 * presentan (src/lib/areas-exani.ts); no hay ponderaciones por carrera.
 */
export const ENFOQUE_GRUPO: Record<string, { perfil: string; reforzar: string }> = {
  "Administración y negocios": {
    perfil: "Para quien quiere dirigir organizaciones, emprender, atender turistas o mover mercancías entre países.",
    reforzar: "En el módulo de área, Fundamentos de administración empresarial y Matemáticas financieras básicas son lo más cercano a tu carrera; no descuides Pensamiento matemático, que pesa 30 reactivos.",
  },
  "Contaduría, economía y finanzas": {
    perfil: "Para quien disfruta los números con propósito: llevar cuentas, analizar mercados o administrar el dinero público.",
    reforzar: "Matemáticas financieras básicas y Entorno económico y social, del módulo de área, más Pensamiento matemático en las áreas comunes.",
  },
  "Comunicación y mercadotecnia": {
    perfil: "Para quien quiere contar historias, informar o entender cómo se convence a un público.",
    reforzar: "Comprensión lectora y Redacción indirecta (60 reactivos entre las dos) y, en el módulo de área, Entorno económico y social.",
  },
  Derecho: {
    perfil: "Para quien quiere defender casos, asesorar a personas y empresas o entender cómo se investiga un delito.",
    reforzar: "Marco legal y Estado de derecho, del módulo de área, y Comprensión lectora: buena parte del examen es leer con precisión.",
  },
  "Sociedad y política": {
    perfil: "Para quien quiere entender cómo se organizan las sociedades, cómo se toman las decisiones públicas y cómo se relacionan los países.",
    reforzar: "Estudio de los fenómenos sociales, del módulo general, y Principios de economía y estructura social, del módulo de área.",
  },
  "Humanidades y lenguas": {
    perfil: "Para quien quiere leer, escribir, enseñar idiomas o pensar a fondo sobre la historia y las ideas.",
    reforzar: "Humanidades y Procesos históricos, del módulo de área, y las dos áreas de lenguaje (Comprensión lectora y Redacción indirecta).",
  },
  "Educación, mente y cuerpo": {
    perfil: "Para quien quiere enseñar, acompañar el desarrollo de las personas o trabajar con la mente y el movimiento.",
    reforzar: "Construcción del conocimiento, del módulo general, y Comprensión lectora. Psicología tiene además su propio banco de preguntas en el simulador.",
  },
  Artes: {
    perfil: "Para quien quiere crear: imagen, escena, música, danza o cine.",
    reforzar: "El examen de admisión es el mismo de toda el área: Humanidades y Procesos históricos, del módulo de área, más las áreas comunes. Revisa en tu convocatoria si tu carrera pide además una prueba de aptitud.",
  },
  Salud: {
    perfil: "Para quien quiere cuidar la salud de las personas desde la clínica, la comunidad o el laboratorio.",
    reforzar: "Biología celular, genética y anatomía humana, del módulo de área, y la parte de Biología del módulo de Ciencias experimentales.",
  },
  "Química y farmacia": {
    perfil: "Para quien quiere trabajar en el laboratorio: medicamentos, análisis clínicos o evidencia forense.",
    reforzar: "Fundamentos de química y física médica, del módulo de área, y Química en el módulo de Ciencias experimentales.",
  },
  "Vida y campo": {
    perfil: "Para quien quiere estudiar los seres vivos, cuidar animales o producir alimentos de forma sustentable.",
    reforzar: "Biología celular, genética y anatomía humana, del módulo de área, y Biología del módulo de Ciencias experimentales.",
  },
  "Ciencias exactas": {
    perfil: "Para quien disfruta demostrar, modelar y medir: matemáticas, física y sus aplicaciones.",
    reforzar: "Matemáticas avanzadas y cálculo diferencial y Física fundamental aplicada, del módulo de área: son 20 de sus 24 reactivos.",
  },
  "Computación y datos": {
    perfil: "Para quien quiere programar, proteger sistemas o sacar conclusiones de grandes cantidades de datos.",
    reforzar: "Matemáticas avanzadas y cálculo diferencial, del módulo de área, y Pensamiento matemático en las áreas comunes.",
  },
  Ingenierías: {
    perfil: "Para quien quiere diseñar, construir y mejorar máquinas, procesos, materiales y obras.",
    reforzar: "Matemáticas avanzadas y cálculo diferencial y Física fundamental aplicada, del módulo de área, más Física y Química del módulo de Ciencias experimentales.",
  },
  "Diseño, ciudad e innovación": {
    perfil: "Para quien quiere diseñar espacios, imágenes y ciudades, o convertir ideas en proyectos.",
    reforzar: "Pensamiento matemático y Matemáticas avanzadas y cálculo diferencial, del módulo de área; la geometría y las proporciones aparecen seguido.",
  },
};
