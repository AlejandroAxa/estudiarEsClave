/** Lectura del resultado guardado de un intento (CU-06). */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";

export async function cargarResultado(db: Db, intentoId: string) {
  const [res] = await db.select().from(s.resultado).where(eq(s.resultado.intentoId, intentoId));
  if (!res) return null;
  const areas = await db
    .select({ r: s.resultadoArea, nombre: s.area.nombre, orden: s.area.orden })
    .from(s.resultadoArea)
    .innerJoin(s.area, eq(s.area.id, s.resultadoArea.areaId))
    .where(eq(s.resultadoArea.intentoId, intentoId))
    .orderBy(asc(s.area.orden));
  const subareas = await db
    .select({ r: s.resultadoSubarea, nombre: s.subarea.nombre, areaId: s.subarea.areaId, peso: s.subarea.reactivosExamen, orden: s.subarea.orden })
    .from(s.resultadoSubarea)
    .innerJoin(s.subarea, eq(s.subarea.id, s.resultadoSubarea.subareaId))
    .where(eq(s.resultadoSubarea.intentoId, intentoId))
    .orderBy(asc(s.subarea.areaId), asc(s.subarea.orden));
  const temas = await db
    .select({ r: s.resultadoTema, nombre: s.tema.nombre, subareaId: s.tema.subareaId })
    .from(s.resultadoTema)
    .innerJoin(s.tema, eq(s.tema.id, s.resultadoTema.temaId))
    .where(eq(s.resultadoTema.intentoId, intentoId))
    .orderBy(asc(s.tema.orden));
  const errores = await db
    .select({ r: s.errorFrecuente, descripcion: s.errorCatalogo.descripcion, recomendacion: s.errorCatalogo.recomendacion })
    .from(s.errorFrecuente)
    .innerJoin(s.errorCatalogo, eq(s.errorCatalogo.id, s.errorFrecuente.errorId))
    .where(eq(s.errorFrecuente.intentoId, intentoId))
    .orderBy(asc(s.errorFrecuente.lugar));
  return { res, areas, subareas, temas, errores };
}

/** Revisión pregunta por pregunta (CU-07): solo después de enviar. */
export async function cargarRevision(db: Db, intentoId: string) {
  const items = await db
    .select({ it: s.itemIntento, rv: s.reactivoVersion, resp: s.respuesta, areaId: s.subarea.areaId, subarea: s.subarea.nombre, tema: s.tema.nombre })
    .from(s.itemIntento)
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.itemIntento.reactivoId), eq(s.reactivoVersion.version, s.itemIntento.version)))
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .leftJoin(s.respuesta, and(eq(s.respuesta.intentoId, s.itemIntento.intentoId), eq(s.respuesta.orden, s.itemIntento.orden)))
    .where(eq(s.itemIntento.intentoId, intentoId))
    .orderBy(asc(s.itemIntento.orden));
  const ids = [...new Set(items.map((i) => i.it.reactivoId))];
  const ops = ids.length ? await db.select().from(s.opcion).where(inArray(s.opcion.reactivoId, ids)) : [];
  const refs = ids.length ? await db.select().from(s.referencia).where(inArray(s.referencia.reactivoId, ids)) : [];
  const textoIds = [...new Set(items.map((i) => i.rv.textoId).filter(Boolean))] as string[];
  const textos = textoIds.length ? await db.select().from(s.texto).where(inArray(s.texto.id, textoIds)) : [];
  return items.map((x) => {
    const perm = x.it.ordenOpciones.split("");
    const opciones = perm.map((orig, pos) => {
      const o = ops.find((y) => y.reactivoId === x.it.reactivoId && y.version === x.it.version && y.opcionId.trim() === orig)!;
      return { letra: "ABC"[pos], original: orig, texto: o.texto, correcta: o.correcta, argumentacion: o.argumentacion };
    });
    return {
      orden: x.it.orden,
      reactivoId: x.it.reactivoId,
      version: x.it.version,
      areaId: x.areaId,
      subarea: x.subarea,
      tema: x.tema,
      enunciado: x.rv.enunciado,
      explicacion: x.rv.explicacion,
      datos: x.rv.datos ?? null,
      figura: x.rv.figura ?? null,
      smiles: x.rv.smiles ?? null,
      validadoPor: x.rv.validadoPor,
      texto: textos.find((t) => t.id === x.rv.textoId) ?? null,
      opciones,
      elegida: x.resp?.opcionId ? "ABC"[perm.indexOf(x.resp.opcionId.trim())] : null,
      correcta: !!x.resp?.correcta,
      referencias: refs
        .filter((r) => r.reactivoId === x.it.reactivoId && r.version === x.it.version)
        .sort((a, b) => a.orden - b.orden)
        .map((r) => ({ fuente: r.fuente, ubicacion: r.ubicacion })),
    };
  });
}
