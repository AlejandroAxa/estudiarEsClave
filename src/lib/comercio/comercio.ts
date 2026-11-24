/**
 * Comercio (RF-27 a RF-30, RF-44 a RF-46; D16, D17). Precio final visible,
 * un solo descuento por orden y acceso solo por webhook verificado.
 */
import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { diaMx, diasEntre, inicioDiaMx, sumarDias } from "../fechas";
import { pasarela, type PagoExterno } from "./pasarela";
import { buscarEnlacePago } from "../compartir";

export interface Cotizacion {
  sku: string;
  nombre: string;
  precioLista: number;
  total: number;
  descuento: { tipo: "cupon" | "referido" | "promocion"; codigo: string; pct: number; etiqueta: string } | null;
  /** Precio por día hasta el examen, para el ancla de precio. */
  porDia: number | null;
  diasAlExamen: number | null;
  fechaExamen: string | null;
  promocionDesde: string | null;
}

export async function cicloDe(db: Db, examenId: string, anio: number) {
  const [c] = await db
    .select()
    .from(s.cicloAdmision)
    .where(and(eq(s.cicloAdmision.examenId, examenId), eq(s.cicloAdmision.anio, anio)));
  return c ?? null;
}

/** Calcula el precio final. Si aplican varios descuentos, se usa el mayor (no se acumulan). */
export async function cotizar(db: Db, sku: string, o: { cupon?: string | null; referido?: string | null; beneficiarioId?: string | null; pagadorId?: string | null } = {}): Promise<Cotizacion> {
  const [p] = await db.select().from(s.producto).where(eq(s.producto.sku, sku));
  if (!p || !p.activo) throw new Error("Producto no disponible");
  const ciclo = await cicloDe(db, p.examenId, p.cicloAnio);
  const hoy = diaMx();
  const precio = Number(p.precioMxn);
  const opciones: NonNullable<Cotizacion["descuento"]>[] = [];

  const [promo] = await db
    .select()
    .from(s.promocion)
    .where(and(eq(s.promocion.examenId, p.examenId), eq(s.promocion.cicloAnio, p.cicloAnio), eq(s.promocion.activa, true)));
  let promocionDesde: string | null = null;
  if (promo && ciclo?.fechaExamen) {
    promocionDesde = sumarDias(ciclo.fechaExamen, -promo.diasAntesExamen);
    // D17: solo entre fecha − días y la fecha del examen.
    if (hoy >= promocionDesde && hoy <= ciclo.fechaExamen) {
      opciones.push({ tipo: "promocion", codigo: promo.id, pct: promo.descuentoPct, etiqueta: `${promo.descuentoPct} % del último mes antes del examen` });
    }
  }
  if (o.cupon) {
    const [c] = await db.select().from(s.cupon).where(eq(s.cupon.codigo, o.cupon.trim().toUpperCase()));
    if (c && c.vigenteHasta >= hoy && c.usos < c.usosMax) opciones.push({ tipo: "cupon", codigo: c.codigo, pct: c.descuentoPct, etiqueta: `Cupón ${c.codigo}` });
  }
  if (o.referido) {
    const [r] = await db
      .select()
      .from(s.codigoReferido)
      .where(and(eq(s.codigoReferido.codigo, o.referido.trim().toUpperCase()), eq(s.codigoReferido.activo, true)));
    // D16: el código no puede ser del comprador ni del beneficiario.
    if (r && r.cuentaId !== o.beneficiarioId && r.cuentaId !== o.pagadorId) {
      opciones.push({ tipo: "referido", codigo: r.codigo, pct: r.descuentoPct, etiqueta: `${r.descuentoPct} % por invitación` });
    }
  }
  const descuento = opciones.sort((a, b) => b.pct - a.pct)[0] ?? null;
  const total = Math.round(precio * (1 - (descuento?.pct ?? 0) / 100));
  const diasAlExamen = ciclo?.fechaExamen ? Math.max(1, diasEntre(hoy, ciclo.fechaExamen)) : null;
  return {
    sku,
    nombre: p.nombre,
    precioLista: precio,
    total,
    descuento,
    porDia: diasAlExamen ? Math.round((total / diasAlExamen) * 100) / 100 : null,
    diasAlExamen,
    fechaExamen: ciclo?.fechaExamen ?? null,
    promocionDesde,
  };
}

export async function crearOrden(
  db: Db,
  p: {
    sku: string;
    beneficiarioId: string;
    quienPaga: "alumno" | "familiar" | "otro";
    cupon?: string | null;
    referido?: string | null;
    enlaceToken?: string | null;
    correoPagador?: string | null;
    origen: string;
  },
) {
  let enlaceId: string | null = null;
  if (p.enlaceToken) {
    const e = await buscarEnlacePago(db, p.enlaceToken);
    if (!e || e.cuentaId !== p.beneficiarioId) throw new Error("El enlace de pago ya no es válido");
    enlaceId = e.id;
    // Un enlace cobra como mucho una orden: si ya hay una pendiente, se reutiliza.
    const [previa] = await db.select().from(s.orden).where(eq(s.orden.enlaceId, e.id));
    if (previa) {
      if (previa.estado === "pagada") throw new Error("Este enlace ya se pagó");
      await db.update(s.orden).set({ enlaceId: null }).where(eq(s.orden.id, previa.id));
    }
  }
  const [perfil] = await db.select().from(s.perfilAlumno).where(eq(s.perfilAlumno.cuentaId, p.beneficiarioId));
  const referido = p.referido ?? perfil?.llegoConReferido ?? null;
  const c = await cotizar(db, p.sku, { cupon: p.cupon, referido, beneficiarioId: p.beneficiarioId, pagadorId: p.quienPaga === "alumno" ? p.beneficiarioId : null });
  const pg = pasarela();
  const [orden] = await db
    .insert(s.orden)
    .values({
      beneficiarioId: p.beneficiarioId,
      enlaceId,
      productoSku: p.sku,
      cuponCodigo: c.descuento?.tipo === "cupon" ? c.descuento.codigo : null,
      referidoCodigo: c.descuento?.tipo === "referido" ? c.descuento.codigo : null,
      promocionId: c.descuento?.tipo === "promocion" ? c.descuento.codigo : null,
      quienPaga: p.quienPaga,
      precioLista: c.precioLista.toFixed(2),
      total: c.total.toFixed(2),
      proveedor: pg.nombre,
    })
    .returning();
  const { url, referencia } = await pg.crearCheckout({
    ordenId: orden.id,
    titulo: `${c.nombre} — Estudiar es Clave`,
    totalMxn: c.total,
    urlRetorno: `${p.origen}/pago/estado?orden=${orden.id}`,
    urlWebhook: `${p.origen}/api/pagos/webhook`,
    correoPagador: p.correoPagador,
  });
  await db.update(s.orden).set({ referenciaCheckout: referencia }).where(eq(s.orden.id, orden.id));
  return { orden, url, cotizacion: c };
}

/** Fin del acceso: el día del examen del ciclo; sin fecha, el 30 de junio del año del ciclo. */
async function finDeAcceso(db: Db, sku: string) {
  const [p] = await db.select().from(s.producto).where(eq(s.producto.sku, sku));
  const ciclo = await cicloDe(db, p.examenId, p.cicloAnio);
  const dia = ciclo?.fechaExamen ?? `${p.cicloAnio}-06-30`;
  return new Date(inicioDiaMx(sumarDias(dia, 1)).getTime() - 1000);
}

/**
 * Procesa un pago confirmado por la pasarela. Idempotente por referencia
 * externa: un aviso repetido no tiene efecto (RF-29).
 */
export async function procesarPago(db: Db, p: PagoExterno, proveedor: string) {
  const [orden] = await db.select().from(s.orden).where(eq(s.orden.id, p.ordenId));
  if (!orden) return { efecto: "orden_desconocida" as const };
  return db.transaction(async (tx) => {
    const [previo] = await tx.select().from(s.pago).where(eq(s.pago.referenciaExterna, p.referenciaExterna));
    if (previo?.estado === p.estado) return { efecto: "repetido" as const };
    const valores = { ordenId: orden.id, proveedor, referenciaExterna: p.referenciaExterna, metodo: p.metodo, estado: p.estado, montoMxn: p.montoMxn.toFixed(2), confirmadoEn: p.estado === "aprobado" ? new Date() : null };
    if (previo) await tx.update(s.pago).set(valores).where(eq(s.pago.id, previo.id));
    else await tx.insert(s.pago).values(valores);

    if (p.estado === "aprobado" && orden.estado === "pendiente") {
      if (Math.abs(p.montoMxn - Number(orden.total)) > 1) return { efecto: "monto_distinto" as const };
      await tx.update(s.orden).set({ estado: "pagada" }).where(eq(s.orden.id, orden.id));
      if (orden.beneficiarioId) {
        await tx
          .insert(s.acceso)
          .values({ cuentaId: orden.beneficiarioId, productoSku: orden.productoSku, ordenId: orden.id, origen: "orden", desde: new Date(), hasta: await finDeAcceso(db, orden.productoSku) })
          .onConflictDoNothing();
      }
      if (orden.cuponCodigo) await tx.update(s.cupon).set({ usos: sql`${s.cupon.usos} + 1` }).where(eq(s.cupon.codigo, orden.cuponCodigo));
      if (orden.enlaceId) await tx.update(s.enlaceCompartido).set({ usadoEn: new Date() }).where(eq(s.enlaceCompartido.id, orden.enlaceId));
      await tx.insert(s.auditoria).values({ accion: "acceso_otorgado", entidad: "orden", entidadId: orden.id });
      return { efecto: "acceso_otorgado" as const, beneficiarioId: orden.beneficiarioId };
    }
    if (p.estado === "reembolsado" && orden.estado === "pagada") {
      await tx.update(s.orden).set({ estado: "reembolsada" }).where(eq(s.orden.id, orden.id));
      await tx.update(s.acceso).set({ revocadoEn: new Date() }).where(eq(s.acceso.ordenId, orden.id));
      await tx.insert(s.auditoria).values({ accion: "acceso_revocado", entidad: "orden", entidadId: orden.id });
      return { efecto: "acceso_revocado" as const };
    }
    return { efecto: "registrado" as const };
  });
}

/** Órdenes pendientes de más de 4 días: expiran (la ficha de OXXO/SPEI ya venció). */
export async function expirarOrdenes(db: Db) {
  const r = await db
    .update(s.orden)
    .set({ estado: "expirada" })
    .where(and(eq(s.orden.estado, "pendiente"), sql`${s.orden.creadaEn} < now() - interval '4 days'`))
    .returning({ id: s.orden.id });
  return r.length;
}

/* ───────────── Referidos (RF-44) ───────────── */

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function codigoAleatorio(n = 7) {
  const b = randomBytes(n);
  return Array.from(b, (x) => ALFABETO[x % ALFABETO.length]).join("");
}

export async function asegurarCodigoReferido(db: Db, cuentaId: string, alias?: string) {
  const [ya] = await db.select().from(s.codigoReferido).where(eq(s.codigoReferido.cuentaId, cuentaId));
  if (ya) return ya;
  const base = (alias ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  for (let k = 0; k < 5; k++) {
    const codigo = (base.length >= 3 ? base + codigoAleatorio(3) : codigoAleatorio(7)).slice(0, 12);
    const r = await db.insert(s.codigoReferido).values({ codigo, cuentaId }).onConflictDoNothing().returning();
    if (r.length) return r[0];
  }
  throw new Error("No se pudo generar el código de referido");
}

export async function estadisticasReferido(db: Db, codigo: string) {
  const [r] = await db
    .select({ invitados: sql<number>`count(distinct ${s.perfilAlumno.cuentaId})::int` })
    .from(s.perfilAlumno)
    .where(eq(s.perfilAlumno.llegoConReferido, codigo));
  const [c] = await db
    .select({ compras: sql<number>`count(*)::int` })
    .from(s.orden)
    .where(and(eq(s.orden.referidoCodigo, codigo), eq(s.orden.estado, "pagada")));
  return { invitados: r.invitados, compras: c.compras };
}

export async function productosActivos(db: Db, examenId = "EXANI-II") {
  return db
    .select()
    .from(s.producto)
    .where(and(eq(s.producto.examenId, examenId), eq(s.producto.activo, true)))
    .orderBy(s.producto.orden);
}

export async function ordenesDe(db: Db, cuentaId: string) {
  return db
    .select({ orden: s.orden, producto: s.producto.nombre })
    .from(s.orden)
    .innerJoin(s.producto, eq(s.producto.sku, s.orden.productoSku))
    .where(eq(s.orden.beneficiarioId, cuentaId))
    .orderBy(sql`${s.orden.creadaEn} desc`);
}

export { gt, isNull };
