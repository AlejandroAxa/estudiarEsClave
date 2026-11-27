/**
 * Un plan por área general de conocimiento (BUAP). Cada plan abre las áreas
 * comunes y los dos módulos que presenta esa área; las preguntas que ve el
 * alumno salen del banco de su área, así que quien va para Derecho nunca recibe
 * las de Química. Medicina (EIPM) tiene su propio paquete.
 */
import { AREAS_GENERALES, type AreaGeneral } from "./areas-generales";

/** Áreas comunes a todos los exámenes (más Inglés, que es diagnóstico). */
export const AREAS_COMUNES = ["CL", "RI", "PM", "ING"];

export type PlanArea = {
  sku: string;
  rutaId: string;
  nombre: string;
  /** Otras rutas que se eligen en la cuenta y que este plan también cubre. */
  rutasExtra: string[];
  /** Áreas del banco que abre, además de las comunes. */
  modulos: string[];
  /** Cómo se le explican al alumno los módulos que abre. */
  incluye: string[];
  precio: string;
  orden: number;
};

const DEF: Record<string, Omit<PlanArea, "rutaId" | "nombre" | "orden" | "precio">> = {
  "epiu-economico-administrativas": {
    sku: "plan-economico-administrativas-2027",
    rutasExtra: [],
    modulos: ["CSO", "CEA"],
    incluye: ["Módulo general de Ciencias sociales", "Módulo de Ciencias Económico Administrativas"],
  },
  "epiu-sociales-humanidades": {
    sku: "plan-sociales-humanidades-2027",
    rutasExtra: ["psicologia"],
    modulos: ["CSO", "CSH", "PSI"],
    incluye: ["Módulo general de Ciencias sociales", "Módulo de Ciencias Sociales y Humanidades", "Banco de Psicología, si eliges esa carrera en tu cuenta"],
  },
  "epiu-naturales-salud": {
    sku: "plan-naturales-salud-2027",
    rutasExtra: [],
    modulos: ["CEX", "CNS", "BIO", "QUI"],
    incluye: ["Módulo general de Ciencias experimentales", "Módulo de Ciencias Naturales y de Salud"],
  },
  "epiu-ingenierias-exactas": {
    sku: "plan-ingenierias-exactas-2027",
    rutasExtra: ["exactas-fis", "exactas-pye"],
    modulos: ["CEX", "ICE", "CAL", "FIS", "PYE"],
    incluye: ["Módulo general de Ciencias experimentales", "Módulo de Ingenierías y Ciencias Exactas", "Bancos de Cálculo, Física y Probabilidad, si eliges Ciencias exactas en tu cuenta"],
  },
};

export const PLANES_AREA: (PlanArea & { area: AreaGeneral })[] = AREAS_GENERALES.map((area, k) => ({
  ...DEF[area.rutaId],
  rutaId: area.rutaId,
  nombre: `Plan ${area.corto}`,
  precio: "449.00",
  orden: 2 + k,
  area,
}));

export const SKU_MEDICINA = "paquete-medicina-2027";
export const SKU_BASICO = "pase-basico-2027";

/** Plan que cubre una ruta de la cuenta (la del área o una de sus rutas extra). */
export const planDeRuta = (rutaId: string | null | undefined) => PLANES_AREA.find((p) => p.rutaId === rutaId || (!!rutaId && p.rutasExtra.includes(rutaId)));

/** ¿Un producto dirigido a `rutaProducto` sirve para la ruta `rutaCuenta`? */
export const rutaCubierta = (rutaProducto: string, rutaCuenta: string) =>
  rutaProducto === rutaCuenta || !!PLANES_AREA.find((p) => p.rutaId === rutaProducto)?.rutasExtra.includes(rutaCuenta);
export const planPorSku = (sku: string) => PLANES_AREA.find((p) => p.sku === sku);
