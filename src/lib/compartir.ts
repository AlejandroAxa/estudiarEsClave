/**
 * Enlaces compartidos (RF-30, RF-34; D25). El token solo viaja en el enlace;
 * en la base se guarda su hash. Un enlace de avance muestra una gráfica
 * congelada, nunca respuestas.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const nuevoToken = () => randomBytes(24).toString("base64url");

export interface DatosAvance {
  nombre: string;
  ruta: string;
  primerGlobal: number | null;
  ultimoGlobal: number | null;
  diagnosticos: number;
  temasEstudiados: number;
  preguntasPracticadas: number;
  racha: number;
  subareas: { nombre: string; antes: number | null; ahora: number | null }[];
  fechaExamen: string | null;
  generado: string;
}

export async function datosAvance(db: Db, cuentaId: string): Promise<DatosAvance> {
  const [c] = await db.select().from(s.cuenta).where(eq(s.cuenta.id, cuentaId));
  const [p] = await db
    .select({ p: s.perfilAlumno, ruta: s.ruta.nombre })
    .from(s.perfilAlumno)
    .innerJoin(s.ruta, eq(s.ruta.id, s.perfilAlumno.rutaId))
    .where(eq(s.perfilAlumno.cuentaId, cuentaId));
  const diags = await db
    .select({ id: s.intento.id, global: s.resultado.global })
    .from(s.intento)
    .innerJoin(s.resultado, eq(s.resultado.intentoId, s.intento.id))
    .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, "diagnostico"), eq(s.intento.estado, "enviado")))
    .orderBy(asc(s.intento.enviadoEn));
  const primero = diags[0];
  const ultimo = diags[diags.length - 1];
  const subs = async (id?: string) =>
    id
      ? db
          .select({ id: s.resultadoSubarea.subareaId, nombre: s.subarea.nombre, dominio: s.resultadoSubarea.dominio })
          .from(s.resultadoSubarea)
          .innerJoin(s.subarea, eq(s.subarea.id, s.resultadoSubarea.subareaId))
          .where(eq(s.resultadoSubarea.intentoId, id))
          .orderBy(asc(s.subarea.areaId), asc(s.subarea.orden))
      : [];
  const antes = await subs(primero?.id);
  const ahora = await subs(ultimo?.id);
  const [pr] = await db
    .select({ n: count(), temas: sql<number>`count(distinct ${s.reactivoVersion.temaId})::int` })
    .from(s.respuesta)
    .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.respuesta.reactivoId), eq(s.reactivoVersion.version, s.respuesta.version)))
    .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, "practica")));
  const [r] = await db.select().from(s.racha).where(eq(s.racha.cuentaId, cuentaId));
  const [ciclo] = p
    ? await db
        .select()
        .from(s.cicloAdmision)
        .where(and(eq(s.cicloAdmision.examenId, p.p.examenId), eq(s.cicloAdmision.anio, p.p.cicloAnio)))
    : [];
  return {
    nombre: c?.name || p?.p.alias || "Aspirante",
    ruta: p?.ruta ?? "",
    primerGlobal: primero?.global != null ? Number(primero.global) : null,
    ultimoGlobal: ultimo?.global != null ? Number(ultimo.global) : null,
    diagnosticos: diags.length,
    temasEstudiados: pr?.temas ?? 0,
    preguntasPracticadas: pr?.n ?? 0,
    racha: r?.actual ?? 0,
    subareas: ahora.map((x) => ({
      nombre: x.nombre,
      antes: antes.find((a) => a.id === x.id)?.dominio != null ? Number(antes.find((a) => a.id === x.id)!.dominio) : null,
      ahora: x.dominio != null ? Number(x.dominio) : null,
    })),
    fechaExamen: ciclo?.fechaExamen ?? null,
    generado: new Date().toISOString(),
  };
}

export async function crearEnlaceAvance(db: Db, cuentaId: string, canal: "correo" | "whatsapp" | "copiar") {
  const token = nuevoToken();
  const datos = await datosAvance(db, cuentaId);
  const creado = new Date();
  const [e] = await db
    .insert(s.enlaceCompartido)
    .values({ cuentaId, tokenHash: hashToken(token), tipo: "avance", canal, datos, creadoEn: creado, venceEn: new Date(creado.getTime() + 30 * 86400000) })
    .returning();
  return { enlace: e, token };
}

export async function crearEnlacePago(db: Db, cuentaId: string, sku: string, canal: "correo" | "whatsapp" | "copiar") {
  const token = nuevoToken();
  const creado = new Date();
  const [e] = await db
    .insert(s.enlaceCompartido)
    .values({ cuentaId, tokenHash: hashToken(token), tipo: "pago", canal, productoSku: sku, creadoEn: creado, venceEn: new Date(creado.getTime() + 7 * 86400000) })
    .returning();
  return { enlace: e, token };
}

async function buscar(db: Db, token: string, tipo: "avance" | "pago") {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [e] = await db
    .select()
    .from(s.enlaceCompartido)
    .where(and(eq(s.enlaceCompartido.tokenHash, hashToken(token)), eq(s.enlaceCompartido.tipo, tipo), isNull(s.enlaceCompartido.revocadoEn), gt(s.enlaceCompartido.venceEn, new Date())));
  return e ?? null;
}

export const buscarEnlaceAvance = (db: Db, token: string) => buscar(db, token, "avance");
export async function buscarEnlacePago(db: Db, token: string) {
  const e = await buscar(db, token, "pago");
  return e && !e.usadoEn ? e : null;
}

export async function enlacesDe(db: Db, cuentaId: string) {
  return db.select().from(s.enlaceCompartido).where(eq(s.enlaceCompartido.cuentaId, cuentaId)).orderBy(desc(s.enlaceCompartido.creadoEn)).limit(20);
}

export async function revocarEnlace(db: Db, cuentaId: string, id: string) {
  await db
    .update(s.enlaceCompartido)
    .set({ revocadoEn: new Date() })
    .where(and(eq(s.enlaceCompartido.id, id), eq(s.enlaceCompartido.cuentaId, cuentaId)));
}
