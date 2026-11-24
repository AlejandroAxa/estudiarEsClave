/**
 * Releases (RF-12, D11) y exportación al JSON canónico (RF-07).
 */
import { and, asc, desc, eq, inArray, max, sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { checksum } from "./importar";

/** Última versión utilizable de cada reactivo del examen. */
async function versionesParaRelease(db: Db, examenId: string) {
  const filas = await db
    .select({ reactivoId: s.reactivoVersion.reactivoId, version: max(s.reactivoVersion.version) })
    .from(s.reactivoVersion)
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .innerJoin(s.area, eq(s.area.id, s.subarea.areaId))
    .where(and(eq(s.area.examenId, examenId), inArray(s.reactivoVersion.estado, ["validado", "publicado"])))
    .groupBy(s.reactivoVersion.reactivoId);
  return filas.map((f) => ({ reactivoId: f.reactivoId, version: Number(f.version) }));
}

export async function publicarRelease(db: Db, p: { examenId: string; version: string; notas?: string; actorId?: string | null }) {
  if (!/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(p.version)) throw new Error("La versión debe tener la forma 1.0.0");
  const existe = await db.select().from(s.release).where(eq(s.release.version, p.version));
  if (existe.length) throw new Error(`El release ${p.version} ya existe y es inmutable.`);

  const items = await versionesParaRelease(db, p.examenId);
  if (!items.length) throw new Error("No hay reactivos validados para publicar.");
  const incluidos = new Set(items.map((i) => i.reactivoId));

  // D11: todos los reactivos de las plantillas activas del examen deben entrar.
  const enPlantillas = await db
    .selectDistinct({ reactivoId: s.plantillaReactivo.reactivoId, plantillaId: s.plantillaReactivo.plantillaId })
    .from(s.plantillaReactivo)
    .innerJoin(s.plantilla, eq(s.plantilla.id, s.plantillaReactivo.plantillaId))
    .innerJoin(s.ruta, eq(s.ruta.id, s.plantilla.rutaId))
    .where(and(eq(s.plantilla.activa, true), eq(s.ruta.examenId, p.examenId)));
  const faltan = enPlantillas.filter((x) => !incluidos.has(x.reactivoId));
  if (faltan.length) {
    throw new Error(
      `Faltan reactivos de plantillas activas: ${faltan
        .slice(0, 10)
        .map((f) => `${f.reactivoId} (${f.plantillaId})`)
        .join(", ")}. Retíralos de la plantilla o desactívala.`,
    );
  }

  const suma = checksum(JSON.stringify(items));
  await db.transaction(async (tx) => {
    await tx.insert(s.release).values({ version: p.version, examenId: p.examenId, publicadoPor: p.actorId ?? null, checksum: suma, notas: p.notas ?? null });
    for (let i = 0; i < items.length; i += 500) {
      await tx.insert(s.releaseItem).values(items.slice(i, i + 500).map((x) => ({ releaseVersion: p.version, ...x })));
    }
    for (const x of items) {
      await tx
        .update(s.reactivoVersion)
        .set({ estado: "publicado" })
        .where(and(eq(s.reactivoVersion.reactivoId, x.reactivoId), eq(s.reactivoVersion.version, x.version), eq(s.reactivoVersion.estado, "validado")));
    }
    await tx.update(s.release).set({ vigente: false }).where(eq(s.release.examenId, p.examenId));
    await tx.update(s.release).set({ vigente: true }).where(eq(s.release.version, p.version));
    await tx.insert(s.auditoria).values({ actorId: p.actorId ?? null, accion: "publicar_release", entidad: "release", entidadId: p.version });
  });
  return { version: p.version, reactivos: items.length };
}

export async function releaseVigente(db: Db, examenId: string) {
  const [r] = await db
    .select()
    .from(s.release)
    .where(and(eq(s.release.examenId, examenId), eq(s.release.vigente, true)))
    .orderBy(desc(s.release.publicadoEn))
    .limit(1);
  return r ?? null;
}

/** Exporta un release al formato del LEEME, sin pérdida de campos. */
export async function exportarRelease(db: Db, version: string) {
  const [rel] = await db.select().from(s.release).where(eq(s.release.version, version));
  if (!rel) throw new Error("Release no encontrado");
  const [ex] = await db.select().from(s.examen).where(eq(s.examen.id, rel.examenId));
  const areas = await db.select().from(s.area).where(eq(s.area.examenId, rel.examenId)).orderBy(asc(s.area.orden));
  const subs = await db.select().from(s.subarea).orderBy(asc(s.subarea.orden));
  const temas = await db.select().from(s.tema).orderBy(asc(s.tema.orden));
  const items = await db.select().from(s.releaseItem).where(eq(s.releaseItem.releaseVersion, version));
  const claves = items.map((i) => `${i.reactivoId}|${i.version}`);
  const ids = items.map((i) => i.reactivoId);
  const vers = ids.length ? await db.select().from(s.reactivoVersion).where(inArray(s.reactivoVersion.reactivoId, ids)) : [];
  const ops = ids.length ? await db.select().from(s.opcion).where(inArray(s.opcion.reactivoId, ids)) : [];
  const refs = ids.length ? await db.select().from(s.referencia).where(inArray(s.referencia.reactivoId, ids)) : [];
  const rutas = ids.length ? await db.select().from(s.reactivoRuta).where(inArray(s.reactivoRuta.reactivoId, ids)) : [];
  const errores = await db.select().from(s.errorCatalogo);
  const textos = await db.select().from(s.texto);
  const rutasEx = await db.select().from(s.ruta).where(eq(s.ruta.examenId, rel.examenId));
  const plantillas = await db
    .select()
    .from(s.plantilla)
    .where(and(inArray(s.plantilla.rutaId, rutasEx.map((r) => r.id)), eq(s.plantilla.modo, "diagnostico")));
  const pr = plantillas.length
    ? await db.select().from(s.plantillaReactivo).where(inArray(s.plantillaReactivo.plantillaId, plantillas.map((p) => p.id))).orderBy(asc(s.plantillaReactivo.orden))
    : [];

  const temaInfo = new Map(temas.map((t) => [t.id, t]));
  const subInfo = new Map(subs.map((x) => [x.id, x]));
  const enRelease = vers.filter((v) => claves.includes(`${v.reactivoId}|${v.version}`)).sort((a, b) => a.reactivoId.localeCompare(b.reactivoId));
  const areaIds = new Set(areas.map((a) => a.id));
  const textosUsados = new Set(enRelease.map((v) => v.textoId).filter(Boolean));

  return {
    meta: {
      nombre: `Release ${version} — ${ex?.nombre ?? rel.examenId}`,
      version,
      fecha: rel.publicadoEn.toISOString().slice(0, 10),
      examen: rel.examenId,
      idioma: "es-MX",
      total_reactivos: enRelease.length,
      checksum: rel.checksum,
      notas: rel.notas,
    },
    rutas: rutasEx.filter((r) => !r.esGrupo).map((r) => ({ id: r.id, nombre: r.nombre, grupos: r.grupos.split(",").filter(Boolean), carrera: r.carrera ?? undefined })),
    taxonomia: areas.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      tipo: a.tipo,
      cuenta_puntaje: a.cuentaPuntaje,
      subareas: subs
        .filter((x) => x.areaId === a.id)
        .map((x) => ({
          id: x.id,
          nombre: x.nombre,
          reactivos_examen: x.reactivosExamen,
          temas: temas.filter((t) => t.subareaId === x.id).map((t) => ({ id: t.id, nombre: t.nombre })),
        })),
    })),
    errores: errores
      .filter((e) => !e.areaId || areaIds.has(e.areaId))
      .map((e) => ({ id: e.id, area: e.areaId ?? "GEN", descripcion: e.descripcion, recomendacion: e.recomendacion })),
    textos: textos
      .filter((t) => textosUsados.has(t.id))
      .map((t) => ({
        id: t.id,
        ambito: t.ambito,
        tipo_texto: t.tipoTexto,
        titulo: t.titulo,
        ...(t.esVerso ? { versos: t.cuerpo.split("\n\n") } : { parrafos: t.cuerpo.split("\n\n") }),
        autoria: t.autoria,
      })),
    reactivos: enRelease.map((v) => {
      const t = temaInfo.get(v.temaId)!;
      const sa = subInfo.get(t.subareaId)!;
      return {
        id: v.reactivoId,
        version: v.version,
        examen: rel.examenId,
        rutas: rutas.filter((r) => r.reactivoId === v.reactivoId && r.version === v.version).map((r) => r.rutaId),
        area: sa.areaId,
        subarea: sa.id,
        tema: v.temaId,
        habilidad: v.habilidad,
        dificultad_estimada: v.dificultadEstimada,
        formato: v.formato,
        texto_id: v.textoId,
        enunciado: v.enunciado,
        opciones: ops
          .filter((o) => o.reactivoId === v.reactivoId && o.version === v.version)
          .sort((a, b) => a.opcionId.localeCompare(b.opcionId))
          .map((o) => ({ id: o.opcionId, texto: o.texto, correcta: o.correcta, argumentacion: o.argumentacion, error_id: o.errorId })),
        explicacion: v.explicacion,
        ...(v.datos ? { datos: v.datos } : {}),
        ...(v.figura ? { figura: v.figura } : {}),
        ...(v.smiles ? { smiles: v.smiles } : {}),
        referencias: refs
          .filter((r) => r.reactivoId === v.reactivoId && r.version === v.version)
          .sort((a, b) => a.orden - b.orden)
          .map((r) => ({ fuente: r.fuente, ubicacion: r.ubicacion })),
        tiempo_estimado_seg: v.tiempoEstimadoSeg,
        estado: v.estado,
        origen: v.origen,
        validado_por: v.validadoPor,
        validado_en: v.validadoEn,
        revision: v.revision ?? undefined,
      };
    }),
    plantillas: plantillas.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      ruta: p.rutaId,
      modo: p.modo,
      reactivos: pr.filter((x) => x.plantillaId === p.id).map((x) => x.reactivoId),
      tiempo_limite_min: p.tiempoLimiteMin,
      ponderacion: "reactivos_examen",
      umbrales: { domina: Number(p.umbralDomina), en_desarrollo: Number(p.umbralDesarrollo) },
      minimo_reactivos_para_reportar: p.minimoReportar,
      familia_equivalencia: p.familiaEquivalencia ?? undefined,
      notas: p.notas ?? undefined,
    })),
  };
}

export async function conteoPorEstado(db: Db) {
  return db
    .select({ estado: s.reactivoVersion.estado, n: sql<number>`count(*)::int` })
    .from(s.reactivoVersion)
    .groupBy(s.reactivoVersion.estado);
}
