/** Derechos ARCO: acceso (descarga de datos) y cancelación (borrado de la cuenta). */
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";

export async function exportarDatos(db: Db, cuentaId: string) {
  const uno = async <T>(p: Promise<T[]>) => (await p)[0] ?? null;
  const [cuenta, perfil] = await Promise.all([
    uno(db.select({ id: s.cuenta.id, nombre: s.cuenta.name, correo: s.cuenta.email, creadaEn: s.cuenta.createdAt, aviso: s.cuenta.avisoVersionAceptada }).from(s.cuenta).where(eq(s.cuenta.id, cuentaId))),
    uno(db.select().from(s.perfilAlumno).where(eq(s.perfilAlumno.cuentaId, cuentaId))),
  ]);
  const intentos = await db
    .select({ id: s.intento.id, modo: s.intento.modo, estado: s.intento.estado, inicia: s.intento.iniciaEn, enviado: s.intento.enviadoEn, calificacion: s.resultado.global, nivel: s.resultado.nivel })
    .from(s.intento)
    .leftJoin(s.resultado, eq(s.resultado.intentoId, s.intento.id))
    .where(eq(s.intento.cuentaId, cuentaId));
  return {
    generado: new Date().toISOString(),
    cuenta,
    perfil,
    preferencias: await db.select().from(s.preferenciaContacto).where(eq(s.preferenciaContacto.cuentaId, cuentaId)),
    intentos,
    accesos: await db.select().from(s.acceso).where(eq(s.acceso.cuentaId, cuentaId)),
    ordenes: await db.select().from(s.orden).where(eq(s.orden.beneficiarioId, cuentaId)),
    puntos: await db.select().from(s.eventoPuntos).where(eq(s.eventoPuntos.cuentaId, cuentaId)),
    racha: await uno(db.select().from(s.racha).where(eq(s.racha.cuentaId, cuentaId))),
    insignias: await db.select().from(s.cuentaInsignia).where(eq(s.cuentaInsignia.cuentaId, cuentaId)),
    enlaces: (await db.select().from(s.enlaceCompartido).where(eq(s.enlaceCompartido.cuentaId, cuentaId))).map((e) => ({ ...e, tokenHash: undefined })),
    reportes: await db.select().from(s.reporteError).where(eq(s.reporteError.cuentaId, cuentaId)),
  };
}

/**
 * Borra la cuenta. Lo personal se va en cascada; los intentos quedan sin dueño
 * (sirven a la calibración del banco) y las órdenes pagadas se conservan sin
 * beneficiario por obligación fiscal.
 */
export async function borrarCuenta(db: Db, cuentaId: string) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.arco', 'si', true)`);
    await tx.insert(s.auditoria).values({ actorId: null, accion: "arco_cancelacion", entidad: "cuenta", entidadId: cuentaId });
    await tx.delete(s.cuenta).where(eq(s.cuenta.id, cuentaId));
  });
}
