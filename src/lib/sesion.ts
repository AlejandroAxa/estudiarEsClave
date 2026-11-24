/** Capa de acceso a la sesión (DAL): un solo lugar para saber quién es y qué puede hacer. */
import "server-only";
import { cache } from "react";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { auth } from "./auth/auth";
import { mfaValida } from "./auth/totp";

export const COOKIE_ANONIMA = "eec_anon";
export const COOKIE_MFA = "eec_mfa";
export const COOKIE_REF = "eec_ref";

export const sesionActual = cache(async () => {
  const s0 = await auth.api.getSession({ headers: await headers() });
  if (!s0) return null;
  const [cuenta] = await db.select().from(s.cuenta).where(eq(s.cuenta.id, s0.user.id));
  if (!cuenta || cuenta.estado !== "activa") return null;
  const roles = (await db.select().from(s.cuentaRol).where(eq(s.cuentaRol.cuentaId, cuenta.id))).map((r) => r.rol);
  const [perfil] = await db.select().from(s.perfilAlumno).where(eq(s.perfilAlumno.cuentaId, cuenta.id));
  return { sesionId: s0.session.id, cuenta, roles, perfil: perfil ?? null };
});

export type Sesion = NonNullable<Awaited<ReturnType<typeof sesionActual>>>;

/** Exige sesión; si falta el perfil, manda a la bienvenida. */
export async function requerirAlumno(siguiente = "/inicio") {
  const ses = await sesionActual();
  if (!ses) redirect(`/entrar?siguiente=${encodeURIComponent(siguiente)}`);
  if (!ses.perfil) redirect("/bienvenida");
  return ses as Sesion & { perfil: NonNullable<Sesion["perfil"]> };
}

export async function requerirSesion(siguiente = "/inicio") {
  const ses = await sesionActual();
  if (!ses) redirect(`/entrar?siguiente=${encodeURIComponent(siguiente)}`);
  return ses;
}

/** Administrador con MFA vigente. */
export async function requerirAdmin() {
  const ses = await requerirSesion("/admin");
  if (!ses.roles.includes("admin")) redirect("/inicio");
  const sello = (await cookies()).get(COOKIE_MFA)?.value;
  if (!mfaValida(ses.sesionId, sello)) redirect("/admin/verificar");
  return ses;
}

export async function sesionAnonima() {
  return (await cookies()).get(COOKIE_ANONIMA)?.value ?? null;
}

export async function auditar(actorId: string | null, accion: string, entidad: string, entidadId: string) {
  await db.insert(s.auditoria).values({ actorId, accion, entidad, entidadId });
}
