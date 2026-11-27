/**
 * Quién puede cambiar su cuenta de área, y a cuál. Sin esto, cualquiera entraba
 * a los bancos de todas las áreas desde el selector de Diagnóstico.
 *
 * - Con un plan de área (o el Paquete Medicina): solo a las rutas que ese plan
 *   cubre. Para estudiar otra área hay que comprar su plan.
 * - Sin plan dirigido a una ruta (gratis, prueba o Pase Básico): un cambio cada
 *   30 días, para quien de verdad cambió de carrera.
 */
import { and, desc, eq, gte } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { estadoPlan } from "./planes";
import { rutaCubierta } from "./planes-area";

export const DIAS_ENTRE_CAMBIOS = 30;
/** Rutas que no se ofrecen en el selector (bancos de apoyo, no un examen de la BUAP). */
const OCULTAS = new Set(["exactas-fis", "exactas-pye"]);

export type ReglaCambio = {
  /** Rutas a las que puede cambiar; nulo = cualquiera del selector. */
  permitidas: string[] | null;
  /** Si no puede cambiar todavía, desde cuándo podrá. */
  bloqueadoHasta: Date | null;
  motivo: "plan" | "espera" | null;
};

export async function reglaCambio(db: Db, cuentaId: string, rutas: { id: string }[]): Promise<ReglaCambio> {
  const plan = await estadoPlan(db, cuentaId);
  const dirigidos = plan.plan === "pase" ? plan.rutas : [];
  if (dirigidos.length && !dirigidos.includes(null)) {
    return { permitidas: rutas.map((r) => r.id).filter((r) => dirigidos.some((p) => rutaCubierta(p!, r))), bloqueadoHasta: null, motivo: "plan" };
  }
  const desde = new Date(Date.now() - DIAS_ENTRE_CAMBIOS * 86400000);
  const [ultimo] = await db
    .select({ fecha: s.auditoria.fecha })
    .from(s.auditoria)
    .where(and(eq(s.auditoria.actorId, cuentaId), eq(s.auditoria.accion, "ruta_cambiada"), gte(s.auditoria.fecha, desde)))
    .orderBy(desc(s.auditoria.fecha))
    .limit(1);
  if (ultimo) return { permitidas: null, bloqueadoHasta: new Date(ultimo.fecha.getTime() + DIAS_ENTRE_CAMBIOS * 86400000), motivo: "espera" };
  return { permitidas: null, bloqueadoHasta: null, motivo: null };
}

/** Las rutas que se muestran en el selector para esta cuenta. */
export function opcionesSelector<T extends { id: string }>(rutas: T[], regla: ReglaCambio, actual: string) {
  return rutas.filter((r) => r.id === actual || ((!regla.permitidas || regla.permitidas.includes(r.id)) && !OCULTAS.has(r.id)));
}

export function puedeCambiarA(regla: ReglaCambio, rutaId: string, actual: string) {
  if (rutaId === actual) return false;
  if (regla.bloqueadoHasta) return false;
  if (OCULTAS.has(rutaId)) return false;
  return !regla.permitidas || regla.permitidas.includes(rutaId);
}
