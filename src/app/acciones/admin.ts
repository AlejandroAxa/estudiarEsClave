"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { COOKIE_MFA, auditar, requerirAdmin, requerirSesion } from "@/lib/sesion";
import { sellarMfa, verificarTotp } from "@/lib/auth/totp";
import { limitar } from "@/lib/limites";
import { importarBanco } from "@/lib/banco/importar";
import { publicarRelease } from "@/lib/banco/publicar";
import { borrarCuenta } from "@/lib/arco";
import { sembrarProductos } from "@/lib/semilla";

type Estado = { error?: string; ok?: string } | undefined;

/* ───────── Segundo factor ───────── */

export async function verificarMfa(_p: Estado, form: FormData): Promise<Estado> {
  const ses = await requerirSesion("/admin");
  if (!ses.roles.includes("admin")) redirect("/inicio");
  const lim = await limitar("mfa", ses.cuenta.id);
  if (!lim.ok) return { error: "Demasiados intentos. Espera unos minutos." };
  if (!verificarTotp(String(form.get("codigo") ?? "").trim())) {
    await auditar(ses.cuenta.id, "mfa_fallido", "cuenta", ses.cuenta.id);
    return { error: "Código incorrecto." };
  }
  (await cookies()).set(COOKIE_MFA, sellarMfa(ses.sesionId), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 12 * 3600 });
  await auditar(ses.cuenta.id, "mfa_ok", "cuenta", ses.cuenta.id);
  redirect("/admin");
}

/* ───────── Banco ───────── */

export async function subirBanco(_p: Estado, form: FormData): Promise<Estado & { errores?: string[] }> {
  const ses = await requerirAdmin();
  const f = form.get("archivo");
  if (!(f instanceof File) || f.size === 0) return { error: "Elige un archivo JSON." };
  if (f.size > 20 * 1024 * 1024) return { error: "El archivo pesa más de 20 MB." };
  const permitir = process.env.NODE_ENV !== "production" && form.get("sinValidar") === "on";
  const r = await importarBanco(db, await f.text(), { archivo: f.name, ejecutadaPor: ses.cuenta.id, permitirSinValidar: permitir });
  await auditar(ses.cuenta.id, r.aceptada ? "banco_importado" : "banco_rechazado", "importacion", r.importacionId);
  revalidatePath("/admin/banco");
  if (!r.aceptada) return { error: `Se rechazó el archivo completo (${r.errores.length} errores).`, errores: r.errores.slice(0, 50) };
  await sembrarProductos(db);
  return { ok: `Importado: ${r.versionesNuevas} versiones nuevas, ${r.sinCambios} sin cambios. Plantillas: ${r.plantillas.join(", ") || "ninguna"}.` };
}

export async function publicar(_p: Estado, form: FormData): Promise<Estado> {
  const ses = await requerirAdmin();
  const version = String(form.get("version") ?? "").trim();
  const examenId = String(form.get("examenId") ?? "EXANI-II");
  try {
    await publicarRelease(db, { examenId, version, notas: String(form.get("notas") ?? "") || undefined, actorId: ses.cuenta.id });
  } catch (e) {
    return { error: (e as Error).message };
  }
  await auditar(ses.cuenta.id, "release_publicado", "release", version);
  revalidatePath("/admin/banco");
  return { ok: `Release ${version} publicado y vigente.` };
}

export async function alternarPlantilla(form: FormData) {
  const ses = await requerirAdmin();
  const id = String(form.get("id"));
  await db.update(s.plantilla).set({ activa: sql`not ${s.plantilla.activa}` }).where(eq(s.plantilla.id, id));
  await auditar(ses.cuenta.id, "plantilla_alternada", "plantilla", id);
  revalidatePath("/admin/banco");
}

/* ───────── Comercio ───────── */

export async function guardarProducto(form: FormData) {
  const ses = await requerirAdmin();
  const p = z.object({ sku: z.string(), precio: z.coerce.number().positive().max(99999), activo: z.string().optional() }).parse(Object.fromEntries(form));
  await db.update(s.producto).set({ precioMxn: p.precio.toFixed(2), activo: p.activo === "on" }).where(eq(s.producto.sku, p.sku));
  await auditar(ses.cuenta.id, "producto_editado", "producto", p.sku);
  revalidatePath("/admin/comercio");
  revalidatePath("/planes");
}

export async function crearCupon(_p: Estado, form: FormData): Promise<Estado> {
  const ses = await requerirAdmin();
  const p = z
    .object({ codigo: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/), pct: z.coerce.number().int().min(1).max(100), hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), usos: z.coerce.number().int().min(1) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Revisa el código (letras y números), el porcentaje, la fecha y los usos." };
  const r = await db.insert(s.cupon).values({ codigo: p.data.codigo, descuentoPct: p.data.pct, vigenteHasta: p.data.hasta, usosMax: p.data.usos }).onConflictDoNothing().returning();
  if (!r.length) return { error: "Ese cupón ya existe." };
  await auditar(ses.cuenta.id, "cupon_creado", "cupon", p.data.codigo);
  revalidatePath("/admin/comercio");
  return { ok: `Cupón ${p.data.codigo} creado.` };
}

export async function guardarPromocion(form: FormData) {
  const ses = await requerirAdmin();
  const p = z.object({ id: z.string(), pct: z.coerce.number().int().min(1).max(100), dias: z.coerce.number().int().min(1).max(365), activa: z.string().optional() }).parse(Object.fromEntries(form));
  await db.update(s.promocion).set({ descuentoPct: p.pct, diasAntesExamen: p.dias, activa: p.activa === "on" }).where(eq(s.promocion.id, p.id));
  await auditar(ses.cuenta.id, "promocion_editada", "promocion", p.id);
  revalidatePath("/admin/comercio");
}

export async function guardarCiclo(form: FormData) {
  const ses = await requerirAdmin();
  const p = z
    .object({ examenId: z.string(), anio: z.coerce.number().int(), fecha: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/), convocatoria: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/) })
    .parse(Object.fromEntries(form));
  await db
    .update(s.cicloAdmision)
    .set({ fechaExamen: p.fecha || null, convocatoriaEn: p.convocatoria || null })
    .where(and(eq(s.cicloAdmision.examenId, p.examenId), eq(s.cicloAdmision.anio, p.anio)));
  await auditar(ses.cuenta.id, "ciclo_editado", "ciclo_admision", `${p.examenId}-${p.anio}`);
  revalidatePath("/", "layout");
}

/* ───────── Límites del plan ───────── */

export async function guardarLimite(form: FormData) {
  const ses = await requerirAdmin();
  const p = z
    .object({ plan: z.enum(["anonimo", "gratis", "prueba", "pase"]), recurso: z.string(), cantidad: z.string(), periodo: z.enum(["dia", "semana", "mes", "temporada"]), muro: z.string().optional() })
    .parse(Object.fromEntries(form));
  const cantidad = p.cantidad.trim() === "" ? null : Math.max(0, Math.floor(Number(p.cantidad)));
  await db
    .update(s.limitePlan)
    .set({ cantidad, periodo: p.periodo, textoMuro: p.muro?.trim() || null })
    .where(and(eq(s.limitePlan.plan, p.plan), eq(s.limitePlan.recurso, p.recurso)));
  await auditar(ses.cuenta.id, "limite_editado", "limite_plan", `${p.plan}/${p.recurso}`);
  revalidatePath("/admin/limites");
}

/* ───────── Reportes de error ───────── */

export async function resolverReporte(form: FormData) {
  const ses = await requerirAdmin();
  const p = z.object({ id: z.string().uuid(), estado: z.enum(["confirmado", "descartado", "abierto"]) }).parse(Object.fromEntries(form));
  await db.update(s.reporteError).set({ estado: p.estado }).where(eq(s.reporteError.id, p.id));
  await auditar(ses.cuenta.id, `reporte_${p.estado}`, "reporte_error", p.id);
  revalidatePath("/admin/reportes");
}

/* ───────── Cuentas (ARCO y cortesías) ───────── */

export async function darCortesia(form: FormData) {
  const ses = await requerirAdmin();
  const p = z.object({ cuentaId: z.string(), sku: z.string(), dias: z.coerce.number().int().min(1).max(400) }).parse(Object.fromEntries(form));
  const desde = new Date();
  await db.insert(s.acceso).values({ cuentaId: p.cuentaId, productoSku: p.sku, origen: "cortesia", desde, hasta: new Date(desde.getTime() + p.dias * 86400000) });
  await auditar(ses.cuenta.id, "cortesia_otorgada", "cuenta", p.cuentaId);
  revalidatePath("/admin/cuentas");
}

export async function suspender(form: FormData) {
  const ses = await requerirAdmin();
  const id = String(form.get("cuentaId"));
  const estado = form.get("estado") === "activa" ? "activa" : "suspendida";
  await db.update(s.cuenta).set({ estado }).where(eq(s.cuenta.id, id));
  if (estado === "suspendida") await db.delete(s.sesion).where(eq(s.sesion.userId, id));
  await auditar(ses.cuenta.id, `cuenta_${estado}`, "cuenta", id);
  revalidatePath("/admin/cuentas");
}

export async function borrarPorArco(form: FormData) {
  const ses = await requerirAdmin();
  const id = String(form.get("cuentaId"));
  if (form.get("confirmar") !== "BORRAR") return;
  if (id === ses.cuenta.id) return;
  await borrarCuenta(db, id);
  await auditar(ses.cuenta.id, "arco_cancelacion_admin", "cuenta", id);
  redirect("/admin/cuentas");
}
