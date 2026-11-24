"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAlumno } from "@/lib/sesion";
import { crearEnlaceAvance, revocarEnlace, type DatosAvance } from "@/lib/compartir";
import { imagenAvance } from "@/lib/imagen-avance";
import { limitar } from "@/lib/limites";

export async function compartirAvance(_p: { url?: string; imagen?: string; error?: string } | undefined, form: FormData) {
  const ses = await requerirAlumno();
  if (!(await limitar("enlace", ses.cuenta.id)).ok) return { error: "Ya creaste varios enlaces en la última hora." };
  const canal = (String(form.get("canal") ?? "copiar") as "whatsapp" | "correo" | "copiar");
  const { enlace, token } = await crearEnlaceAvance(db, ses.cuenta.id, canal);
  const h = await headers();
  const base = process.env.BETTER_AUTH_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  let imagen = `${base}/a/${token}/imagen`;
  // Gráfica congelada en Vercel Blob, si está configurado.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const png = await imagenAvance(enlace.datos as DatosAvance).arrayBuffer();
      const b = await put(`avance/${enlace.id}.png`, Buffer.from(png), { access: "public", contentType: "image/png", addRandomSuffix: true });
      imagen = b.url;
      await db.update(s.enlaceCompartido).set({ imagenUrl: b.url }).where(eq(s.enlaceCompartido.id, enlace.id));
    } catch (e) {
      console.error("blob_fallo", (e as Error).message);
    }
  }
  revalidatePath("/avance");
  return { url: `${base}/a/${token}`, imagen };
}

export async function revocar(form: FormData) {
  const ses = await requerirAlumno();
  await revocarEnlace(db, ses.cuenta.id, String(form.get("id")));
  revalidatePath("/avance");
}
