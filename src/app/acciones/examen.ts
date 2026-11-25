"use server";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { COOKIE_ANONIMA, sesionActual } from "@/lib/sesion";
import { duenoActual } from "@/lib/dueno";
import { crearIntento, crearPractica, enviarIntento, ErrorEvaluacion, iniciarSeccion, plantillaActiva, terminarSeccion } from "@/lib/evaluacion/evaluacion";
import { ipDe, limitar } from "@/lib/limites";
import { OPCIONES_MINI } from "@/lib/areas-generales";

export type EstadoAccion = { error?: string; codigo?: string } | undefined;

async function limitarIntentos(clave: string) {
  const l = await limitar("intento", clave);
  if (!l.ok) throw new ErrorEvaluacion("Demasiados intentos seguidos. Espera unos minutos.", "invalido");
}

/** Rutas que se pueden elegir en el mini diagnóstico (las 4 áreas generales y Medicina). */
const RUTAS_MINI = new Set(OPCIONES_MINI.map((o) => o.id));

export async function empezarMini(rutaElegida?: string): Promise<EstadoAccion> {
  const ses = await sesionActual();
  const jar = await cookies();
  let anon = jar.get(COOKIE_ANONIMA)?.value ?? null;
  if (!ses && !anon) {
    anon = randomUUID();
    jar.set(COOKIE_ANONIMA, anon, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  let id: string;
  try {
    await limitarIntentos(ses?.cuenta.id ?? anon ?? ipDe(await headers()));
    const rutaId = rutaElegida && RUTAS_MINI.has(rutaElegida) ? rutaElegida : (ses?.perfil?.rutaId ?? "medicina");
    const pl = await plantillaActiva(db, rutaId, "mini");
    if (!pl) return { error: "El mini diagnóstico todavía no está disponible." };
    const i = await crearIntento(db, { plantillaId: pl.id, cuentaId: ses?.cuenta.id ?? null, sesionAnonimaId: ses ? null : anon });
    id = i.id;
  } catch (e) {
    return { error: (e as Error).message, codigo: (e as ErrorEvaluacion).codigo };
  }
  redirect(`/examen/${id}`);
}

export async function empezarExamen(_prev: EstadoAccion, form: FormData): Promise<EstadoAccion> {
  const ses = await sesionActual();
  if (!ses?.perfil) redirect("/entrar");
  const modo = String(form.get("modo"));
  if (!["diagnostico", "simulacro", "muestra"].includes(modo)) return { error: "Modo inválido" };
  let id: string;
  try {
    await limitarIntentos(ses.cuenta.id);
    const pl = await plantillaActiva(db, ses.perfil.rutaId, modo);
    if (!pl) return { error: "Este examen todavía no está disponible para tu carrera." };
    id = (await crearIntento(db, { plantillaId: pl.id, cuentaId: ses.cuenta.id })).id;
  } catch (e) {
    return { error: (e as Error).message, codigo: (e as ErrorEvaluacion).codigo };
  }
  redirect(`/examen/${id}`);
}

export async function empezarPractica(_prev: EstadoAccion, form: FormData): Promise<EstadoAccion> {
  const ses = await sesionActual();
  if (!ses?.perfil) redirect("/entrar");
  const subareaId = (form.get("subarea") as string) || undefined;
  const temaId = (form.get("tema") as string) || undefined;
  const repaso = form.get("repaso") === "1";
  let id: string;
  try {
    await limitarIntentos(ses.cuenta.id);
    id = (await crearPractica(db, ses.cuenta.id, { subareaId, temaId, repaso })).id;
  } catch (e) {
    return { error: (e as Error).message, codigo: (e as ErrorEvaluacion).codigo };
  }
  redirect(`/examen/${id}`);
}

export async function accionIniciarSeccion(intentoId: string, numero: number): Promise<EstadoAccion> {
  try {
    await iniciarSeccion(db, intentoId, numero, await duenoActual());
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function accionTerminarSeccion(intentoId: string, numero: number): Promise<{ enviado?: boolean; error?: string }> {
  try {
    const r = await terminarSeccion(db, intentoId, numero, await duenoActual());
    return { enviado: r.enviado };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function accionEnviar(intentoId: string): Promise<{ error?: string }> {
  try {
    await enviarIntento(db, intentoId, await duenoActual());
  } catch (e) {
    return { error: (e as Error).message };
  }
  return {};
}
