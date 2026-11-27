/**
 * Datos de configuración iniciales: exámenes, ciclo 2027, productos, promoción,
 * límites del plan gratis y catálogo de insignias. Todo se puede cambiar luego
 * desde el panel de administración sin desplegar código.
 */
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { AREAS_COMUNES, PLANES_AREA } from "./planes-area";

export const LIMITES_INICIALES: (typeof s.limitePlan.$inferInsert)[] = [
  // recurso, cantidad (null = ilimitado, 0 = no incluido), periodo
  ...(
    [
      ["anonimo", "mini", null, "temporada"],
      ["anonimo", "practica", 0, "dia"],
      ["anonimo", "diagnostico", 0, "temporada"],
      ["anonimo", "simulacro", 0, "temporada"],
      ["anonimo", "muestra", 0, "temporada"],
      ["gratis", "mini", null, "temporada"],
      ["gratis", "practica", 15, "dia"],
      ["gratis", "diagnostico", 1, "temporada"],
      ["gratis", "simulacro", 0, "temporada"],
      ["gratis", "muestra", 1, "temporada"],
      ["gratis", "protecciones", 1, "mes"],
      ["gratis", "repaso", 0, "dia"],
      ["gratis", "resultado_completo", 0, "temporada"],
      ["gratis", "argumentaciones", 0, "temporada"],
      ["prueba", "mini", null, "temporada"],
      ["prueba", "practica", null, "dia"],
      ["prueba", "diagnostico", null, "temporada"],
      ["prueba", "simulacro", 1, "temporada"],
      ["prueba", "muestra", null, "temporada"],
      ["prueba", "protecciones", 1, "semana"],
      ["prueba", "repaso", null, "dia"],
      ["prueba", "resultado_completo", null, "temporada"],
      ["prueba", "argumentaciones", null, "temporada"],
      ["pase", "mini", null, "temporada"],
      ["pase", "practica", null, "dia"],
      ["pase", "diagnostico", null, "temporada"],
      ["pase", "simulacro", null, "temporada"],
      ["pase", "muestra", null, "temporada"],
      ["pase", "protecciones", 1, "semana"],
      ["pase", "repaso", null, "dia"],
      ["pase", "resultado_completo", null, "temporada"],
      ["pase", "argumentaciones", null, "temporada"],
    ] as const
  ).map(([plan, recurso, cantidad, periodo]) => ({ plan, recurso, cantidad, periodo, textoMuro: textoMuro(recurso) })),
];

function textoMuro(recurso: string) {
  switch (recurso) {
    case "practica":
      return "Ya tomaste tu dosis de hoy. Mañana se recarga, o sigue sin límite con el pase.";
    case "diagnostico":
      return "Tu diagnóstico gratis de la temporada ya está hecho. Con el pase lo repites cuando quieras.";
    case "simulacro":
      return "El simulacro completo viene con el pase. Mientras, prueba el de muestra de 20 minutos.";
    case "muestra":
      return "Ya usaste tu simulacro de muestra.";
    case "repaso":
      return "Tienes errores esperando repaso. El repaso espaciado viene con el pase.";
    case "resultado_completo":
    case "argumentaciones":
      return "Incluido en el pase.";
    default:
      return null as unknown as string;
  }
}

export const INSIGNIAS: (typeof s.insignia.$inferInsert)[] = [
  { id: "primer-diagnostico", nombre: "Punto de partida", descripcion: "Terminaste tu primer diagnóstico completo.", condicion: "Enviar un diagnóstico", icono: "flag" },
  { id: "primera-seccion", nombre: "Primer paso", descripcion: "Cerraste tu primera sección de diagnóstico.", condicion: "Terminar una sección", icono: "footprints" },
  { id: "dosis-completa", nombre: "Meta del día", descripcion: "Respondiste 10 preguntas de práctica en un día.", condicion: "10 prácticas en un día", icono: "target" },
  { id: "subarea-sube", nombre: "Subiendo de nivel", descripcion: "Una subárea subió de nivel entre dos diagnósticos.", condicion: "Subir de nivel una subárea", icono: "trending-up" },
  { id: "error-corregido", nombre: "Error superado", descripcion: "Un error que se te repetía dejó de aparecer.", condicion: "Un error frecuente desaparece en el siguiente diagnóstico", icono: "badge-check" },
  { id: "tema-dominado", nombre: "Tema dominado", descripcion: "Acertaste 5 seguidas del mismo tema en práctica.", condicion: "5 aciertos seguidos en un tema", icono: "award" },
  { id: "racha-7", nombre: "Semana completa", descripcion: "Estudiaste 7 días seguidos.", condicion: "Racha de 7 días", icono: "flame" },
];

export async function sembrarConfiguracion(db: Db, opciones: { fechaExamen?: string | null } = {}) {
  await db
    .insert(s.examen)
    .values([
      { id: "EXANI-II", nombre: "EXANI-II (licenciatura)", nivel: "licenciatura" },
      { id: "EXANI-I", nombre: "EXANI-I (bachillerato)", nivel: "prepa" },
    ])
    .onConflictDoNothing();
  await db
    .insert(s.cicloAdmision)
    .values([
      { examenId: "EXANI-II", anio: 2027, fechaExamen: opciones.fechaExamen ?? null },
      { examenId: "EXANI-I", anio: 2027, fechaExamen: null },
    ])
    .onConflictDoNothing();
  await db.insert(s.limitePlan).values(LIMITES_INICIALES).onConflictDoNothing();
  await db.insert(s.insignia).values(INSIGNIAS).onConflictDoNothing();
  await db
    .insert(s.promocion)
    .values({ id: "mes-final-2027", examenId: "EXANI-II", cicloAnio: 2027, descuentoPct: 40, diasAntesExamen: 30, activa: true })
    .onConflictDoNothing();
}

/**
 * Productos. Los que van dirigidos a una ruta solo se crean si esa ruta ya
 * existe (las rutas se crean al importar el banco), así que se puede llamar en
 * cada arranque: lo que ya existe no se toca y el precio se edita en el panel.
 */
export async function sembrarProductos(db: Db) {
  const rutas = new Set((await db.select({ id: s.ruta.id }).from(s.ruta)).map((r) => r.id));
  const productos: (typeof s.producto.$inferInsert)[] = [
    {
      sku: "pase-basico-2027",
      examenId: "EXANI-II",
      cicloAnio: 2027,
      nombre: "Pase Básico",
      descripcion: "Todo abierto en Comprensión lectora, Redacción indirecta y Pensamiento matemático hasta el día del examen.",
      tipo: "pase",
      precioMxn: "299.00",
      areas: "CL,RI,PM",
      vigenteDesde: "2026-11-24",
      orden: 1,
    },
    ...PLANES_AREA.map((p) => ({
      sku: p.sku,
      examenId: "EXANI-II",
      cicloAnio: 2027,
      nombre: p.nombre,
      descripcion: `Todo abierto para las carreras de ${p.area.nombre}: áreas comunes, ${p.incluye.join(", ").toLowerCase()}, con simulacros completos ilimitados hasta el día del examen.`,
      tipo: "paquete" as const,
      precioMxn: p.precio,
      areas: [...AREAS_COMUNES, ...p.modulos].join(","),
      rutaId: p.rutaId,
      vigenteDesde: "2026-11-26",
      orden: p.orden,
    })),
    {
      sku: "paquete-medicina-2027",
      examenId: "EXANI-II",
      cicloAnio: 2027,
      nombre: "Paquete Medicina",
      descripcion: "Todo el Pase Básico más Biología, Química y Premedicina, con simulacros completos ilimitados.",
      tipo: "paquete",
      precioMxn: "599.00",
      areas: null,
      rutaId: "medicina",
      vigenteDesde: "2026-11-24",
      orden: 6,
    },
  ];
  const listos = productos.filter((p) => !p.rutaId || rutas.has(p.rutaId));
  if (listos.length) await db.insert(s.producto).values(listos).onConflictDoNothing();
}
