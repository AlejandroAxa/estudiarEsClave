/** Consultas compartidas por varias pantallas. */
import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";

export async function ciclo(examenId = "EXANI-II", anio = 2027) {
  const [c] = await db.select().from(s.cicloAdmision).where(and(eq(s.cicloAdmision.examenId, examenId), eq(s.cicloAdmision.anio, anio)));
  return c ?? null;
}

export async function rutasElegibles() {
  return db
    .select({ id: s.ruta.id, nombre: s.ruta.nombre, examenId: s.ruta.examenId, carrera: s.ruta.carrera })
    .from(s.ruta)
    .where(eq(s.ruta.esGrupo, false))
    .orderBy(asc(s.ruta.examenId), asc(s.ruta.nombre));
}

export async function bancoEnDesarrollo(examenId = "EXANI-II") {
  const [r] = await db
    .select({ v: s.release.version })
    .from(s.release)
    .where(and(eq(s.release.examenId, examenId), eq(s.release.vigente, true)))
    .orderBy(desc(s.release.publicadoEn))
    .limit(1);
  return !!r?.v && r.v.includes("dev");
}

/** Tres preguntas resueltas de muestra para páginas públicas (RF-53). Solo de un release vigente. */
export async function muestrasPublicas(rutaId = "medicina", cuantas = 3) {
  const filas = await db
    .select({ rv: s.reactivoVersion, area: s.area.nombre })
    .from(s.releaseItem)
    .innerJoin(s.release, and(eq(s.release.version, s.releaseItem.releaseVersion), eq(s.release.vigente, true)))
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.releaseItem.reactivoId), eq(s.reactivoVersion.version, s.releaseItem.version)))
    .innerJoin(s.reactivoRuta, and(eq(s.reactivoRuta.reactivoId, s.reactivoVersion.reactivoId), eq(s.reactivoRuta.version, s.reactivoVersion.version)))
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .innerJoin(s.area, eq(s.area.id, s.subarea.areaId))
    .where(and(eq(s.reactivoRuta.rutaId, rutaId), eq(s.reactivoVersion.dificultadEstimada, 2)))
    .orderBy(asc(s.reactivoVersion.reactivoId))
    .limit(cuantas);
  const out = [];
  for (const f of filas) {
    const ops = await db
      .select()
      .from(s.opcion)
      .where(and(eq(s.opcion.reactivoId, f.rv.reactivoId), eq(s.opcion.version, f.rv.version)))
      .orderBy(asc(s.opcion.opcionId));
    out.push({ id: f.rv.reactivoId, area: f.area, enunciado: f.rv.enunciado, explicacion: f.rv.explicacion, opciones: ops });
  }
  return out;
}
