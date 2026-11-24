"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { sesionActual } from "@/lib/sesion";
import { crearOrden } from "@/lib/comercio/comercio";
import { buscarEnlacePago, crearEnlacePago } from "@/lib/compartir";
import { limitar, ipDe } from "@/lib/limites";

async function origen() {
  const h = await headers();
  return process.env.BETTER_AUTH_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

const compra = z.object({ sku: z.string().max(40), cupon: z.string().trim().max(30).optional(), quien: z.enum(["alumno", "familiar", "otro"]) });

export async function comprar(_p: { error?: string } | undefined, form: FormData) {
  const ses = await sesionActual();
  if (!ses?.perfil) redirect("/entrar?siguiente=/planes");
  const p = compra.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Indica quién paga." };
  if (!(await limitar("enlace", `orden:${ses.cuenta.id}`)).ok) return { error: "Demasiados intentos. Espera unos minutos." };
  let url: string;
  try {
    const r = await crearOrden(db, { sku: p.data.sku, beneficiarioId: ses.cuenta.id, quienPaga: p.data.quien, cupon: p.data.cupon || null, correoPagador: p.data.quien === "alumno" ? ses.cuenta.email : null, origen: await origen() });
    url = r.url;
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect(url);
}

/** Pago desde un enlace compartido: quien paga no necesita cuenta (RF-30). */
const pagoEnlace = z.object({ token: z.string(), quien: z.enum(["familiar", "otro", "alumno"]), correo: z.string().email().optional().or(z.literal("")), mayor: z.literal("si") });

export async function pagarEnlace(_p: { error?: string } | undefined, form: FormData) {
  const p = pagoEnlace.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Indica quién paga y confirma que eres mayor de edad." };
  if (!(await limitar("enlace", `pagar:${ipDe(await headers())}`)).ok) return { error: "Demasiados intentos. Espera unos minutos." };
  const e = await buscarEnlacePago(db, p.data.token);
  if (!e || !e.productoSku) return { error: "Este enlace ya venció o ya se usó. Pide uno nuevo al aspirante." };
  let url: string;
  try {
    const r = await crearOrden(db, { sku: e.productoSku, beneficiarioId: e.cuentaId, quienPaga: p.data.quien, enlaceToken: p.data.token, correoPagador: p.data.correo || null, origen: await origen() });
    url = r.url;
  } catch (err) {
    return { error: (err as Error).message };
  }
  redirect(url);
}

export async function crearPedidoFamilia(_p: { url?: string; error?: string } | undefined, form: FormData) {
  const ses = await sesionActual();
  if (!ses?.perfil) redirect("/entrar?siguiente=/planes");
  const sku = String(form.get("sku") ?? "");
  const canal = (String(form.get("canal") ?? "copiar") as "whatsapp" | "correo" | "copiar");
  if (!(await limitar("enlace", ses.cuenta.id)).ok) return { error: "Ya creaste varios enlaces. Espera un rato." };
  const { token } = await crearEnlacePago(db, ses.cuenta.id, sku, canal);
  return { url: `${await origen()}/pagar/${token}` };
}
