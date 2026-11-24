/**
 * Planes y cuotas (RF-54, D23, D24). El plan sale de ACCESO: un pase vigente,
 * si no una prueba vigente y, si no, el plan gratis. Los límites se leen de
 * LIMITE_PLAN y siempre se verifican en el servidor.
 */
import { and, count, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { diaMx, inicioDiaMx, lunesDe, primeroDeMes, sumarDias } from "./fechas";

export type Plan = "anonimo" | "gratis" | "prueba" | "pase";
export type Recurso =
  | "mini"
  | "practica"
  | "diagnostico"
  | "simulacro"
  | "muestra"
  | "protecciones"
  | "repaso"
  | "resultado_completo"
  | "argumentaciones";

export interface EstadoPlan {
  plan: Plan;
  /** Áreas con acceso completo; nulo = todas. Solo aplica al plan pase. */
  areas: string[] | null;
  pruebaHasta: Date | null;
  paseHasta: Date | null;
  productos: string[];
  /** ¿Ya usó su prueba de 3 días? */
  pruebaUsada: boolean;
}

export async function estadoPlan(db: Db, cuentaId: string | null | undefined): Promise<EstadoPlan> {
  if (!cuentaId) return { plan: "anonimo", areas: null, pruebaHasta: null, paseHasta: null, productos: [], pruebaUsada: false };
  const ahora = new Date();
  const accesos = await db
    .select({ a: s.acceso, areas: s.producto.areas })
    .from(s.acceso)
    .leftJoin(s.producto, eq(s.producto.sku, s.acceso.productoSku))
    .where(eq(s.acceso.cuentaId, cuentaId));
  const vigentes = accesos.filter((x) => !x.a.revocadoEn && x.a.desde <= ahora && x.a.hasta >= ahora);
  const pases = vigentes.filter((x) => x.a.origen !== "prueba");
  const prueba = vigentes.find((x) => x.a.origen === "prueba");
  const pruebaUsada = accesos.some((x) => x.a.origen === "prueba");
  if (pases.length) {
    const todas = pases.some((p) => !p.areas);
    const areas = todas ? null : [...new Set(pases.flatMap((p) => p.areas!.split(",").map((x) => x.trim())))];
    const paseHasta = new Date(Math.max(...pases.map((p) => p.a.hasta.getTime())));
    return { plan: "pase", areas, pruebaHasta: prueba?.a.hasta ?? null, paseHasta, productos: pases.map((p) => p.a.productoSku!).filter(Boolean), pruebaUsada };
  }
  if (prueba) return { plan: "prueba", areas: null, pruebaHasta: prueba.a.hasta, paseHasta: null, productos: [], pruebaUsada };
  return { plan: "gratis", areas: null, pruebaHasta: null, paseHasta: null, productos: [], pruebaUsada };
}

/**
 * Plan efectivo para un área: con un pase que no cubre el área, esa área se
 * comporta como el mejor plan restante (prueba si está vigente, si no gratis).
 */
export function planParaArea(e: EstadoPlan, areaId: string | null): Plan {
  if (e.plan !== "pase" || !e.areas || !areaId || e.areas.includes(areaId)) return e.plan;
  return e.pruebaHasta && e.pruebaHasta > new Date() ? "prueba" : "gratis";
}

export async function limiteDe(db: Db, plan: Plan, recurso: Recurso) {
  const [l] = await db
    .select()
    .from(s.limitePlan)
    .where(and(eq(s.limitePlan.plan, plan), eq(s.limitePlan.recurso, recurso)));
  // Sin fila configurada: no disponible, para fallar del lado seguro.
  return l ?? { plan, recurso, cantidad: 0, periodo: "temporada", textoMuro: null };
}

export async function incluido(db: Db, plan: Plan, recurso: Recurso) {
  const l = await limiteDe(db, plan, recurso);
  return l.cantidad == null || l.cantidad > 0;
}

/** Inicio y fin del periodo actual de una cuota, en hora del centro de México. */
export function periodoActual(periodo: string, ahora = new Date()) {
  const hoy = diaMx(ahora);
  switch (periodo) {
    case "dia":
      return { desde: inicioDiaMx(hoy), recarga: inicioDiaMx(sumarDias(hoy, 1)) };
    case "semana": {
      const l = lunesDe(hoy);
      return { desde: inicioDiaMx(l), recarga: inicioDiaMx(sumarDias(l, 7)) };
    }
    case "mes": {
      const p = primeroDeMes(hoy);
      const sig = new Date(`${p}T12:00:00Z`);
      sig.setUTCMonth(sig.getUTCMonth() + 1);
      return { desde: inicioDiaMx(p), recarga: inicioDiaMx(sig.toISOString().slice(0, 10)) };
    }
    default: {
      // Temporada: del 1 de julio al 30 de junio (una sola aplicación al año).
      const anio = Number(hoy.slice(0, 4)) - (Number(hoy.slice(5, 7)) < 7 ? 1 : 0);
      return { desde: inicioDiaMx(`${anio}-07-01`), recarga: inicioDiaMx(`${anio + 1}-07-01`) };
    }
  }
}

async function consumido(db: Db, cuentaId: string, recurso: Recurso, desde: Date): Promise<number> {
  if (recurso === "practica" || recurso === "repaso") {
    const [r] = await db
      .select({ n: count() })
      .from(s.respuesta)
      .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
      .where(
        and(
          eq(s.intento.cuentaId, cuentaId),
          eq(s.intento.modo, "practica"),
          recurso === "repaso" ? eq(s.intento.filtro, "repaso") : sql`coalesce(${s.intento.filtro}, '') <> 'repaso'`,
          gte(s.respuesta.respondidaEn, desde),
        ),
      );
    return r.n;
  }
  if (recurso === "diagnostico" || recurso === "simulacro" || recurso === "muestra" || recurso === "mini") {
    const [r] = await db
      .select({ n: count() })
      .from(s.intento)
      .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, recurso), gte(s.intento.iniciaEn, desde)));
    return r.n;
  }
  return 0;
}

export interface Cuota {
  permitido: boolean;
  cantidad: number | null;
  usados: number;
  restante: number | null;
  recargaEn: Date | null;
  textoMuro: string | null;
  plan: Plan;
}

export async function cuota(db: Db, cuentaId: string | null, recurso: Recurso, plan?: Plan): Promise<Cuota> {
  const p = plan ?? (await estadoPlan(db, cuentaId)).plan;
  const l = await limiteDe(db, p, recurso);
  if (l.cantidad == null) return { permitido: true, cantidad: null, usados: 0, restante: null, recargaEn: null, textoMuro: null, plan: p };
  if (!cuentaId || l.cantidad === 0)
    return { permitido: l.cantidad !== 0, cantidad: l.cantidad, usados: 0, restante: l.cantidad, recargaEn: null, textoMuro: l.textoMuro, plan: p };
  const { desde, recarga } = periodoActual(l.periodo);
  const usados = await consumido(db, cuentaId, recurso, desde);
  const restante = Math.max(0, l.cantidad - usados);
  return { permitido: restante > 0, cantidad: l.cantidad, usados, restante, recargaEn: recarga, textoMuro: l.textoMuro, plan: p };
}

/** Crea la prueba inversa de 3 días (una por cuenta). */
export async function darPrueba(db: Db, cuentaId: string) {
  const desde = new Date();
  const hasta = new Date(desde.getTime() + 3 * 86400000);
  await db.insert(s.acceso).values({ cuentaId, origen: "prueba", desde, hasta }).onConflictDoNothing();
}

/** Accesos de pase vigentes (para la pantalla de cuenta). */
export async function accesosVigentes(db: Db, cuentaId: string) {
  const ahora = new Date();
  return db
    .select({ acceso: s.acceso, producto: s.producto })
    .from(s.acceso)
    .leftJoin(s.producto, eq(s.producto.sku, s.acceso.productoSku))
    .where(and(eq(s.acceso.cuentaId, cuentaId), isNull(s.acceso.revocadoEn), lte(s.acceso.desde, ahora), gte(s.acceso.hasta, ahora), inArray(s.acceso.origen, ["orden", "cortesia", "prueba"])));
}
