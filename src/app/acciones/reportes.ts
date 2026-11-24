"use server";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { sesionActual } from "@/lib/sesion";
import { limitar } from "@/lib/limites";

const esquema = z.object({ reactivoId: z.string().max(30), version: z.coerce.number().int().positive(), motivo: z.string().trim().min(5).max(1000) });

export async function reportarError(_p: { ok?: boolean; error?: string } | undefined, form: FormData) {
  const ses = await sesionActual();
  if (!ses) return { error: "Inicia sesión para reportar." };
  const l = await limitar("enlace", `reporte:${ses.cuenta.id}`);
  if (!l.ok) return { error: "Ya enviaste varios reportes. Gracias; intenta más tarde." };
  const p = esquema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Cuéntanos qué viste (al menos 5 letras)." };
  await db.insert(s.reporteError).values({ ...p.data, cuentaId: ses.cuenta.id });
  return { ok: true };
}
