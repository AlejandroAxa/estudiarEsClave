"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { auditar, COOKIE_ANONIMA, COOKIE_REF, requerirSesion, sesionActual } from "@/lib/sesion";
import { puedeCambiarA, reglaCambio } from "@/lib/cambio-area";
import { darPrueba } from "@/lib/planes";
import { asegurarCodigoReferido } from "@/lib/comercio/comercio";
import { adoptarAnonimos } from "@/lib/evaluacion/evaluacion";

const AVISO_VIGENTE = "2026-11";

/** El alias no puede parecer correo ni nombre completo (sección 11). */
function aliasValido(a: string) {
  if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(a)) return "Usa de 3 a 24 letras, números, punto, guion o guion bajo, sin espacios.";
  if (/@|\.(com|mx|net)$/i.test(a)) return "El alias no puede ser un correo.";
  return null;
}

const esquema = z.object({
  nombre: z.string().trim().max(40).optional(),
  alias: z.string().trim(),
  ruta: z.string().min(1),
  aviso: z.literal("si"),
  siguiente: z.string().optional(),
});

export async function guardarBienvenida(_p: { error?: string } | undefined, form: FormData) {
  const ses = await requerirSesion();
  const p = esquema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Elige tu carrera, escribe un alias y acepta el aviso de privacidad." };
  const e = aliasValido(p.data.alias);
  if (e) return { error: e };
  const [rt] = await db.select().from(s.ruta).where(and(eq(s.ruta.id, p.data.ruta), eq(s.ruta.esGrupo, false)));
  if (!rt) return { error: "Esa carrera no está disponible." };
  const [repetido] = await db
    .select({ c: s.perfilAlumno.cuentaId })
    .from(s.perfilAlumno)
    .where(and(sql`lower(${s.perfilAlumno.alias}) = lower(${p.data.alias})`, ne(s.perfilAlumno.cuentaId, ses.cuenta.id)));
  if (repetido) return { error: "Ese alias ya lo usa alguien más. Prueba otro." };

  const jar = await cookies();
  const ref = jar.get(COOKIE_REF)?.value ?? null;
  const [refFila] = ref ? await db.select().from(s.codigoReferido).where(eq(s.codigoReferido.codigo, ref)) : [];
  const llego = refFila && refFila.cuentaId !== ses.cuenta.id ? refFila.codigo : null;

  const valores = {
    nivel: rt.examenId === "EXANI-I" ? "prepa" : "licenciatura",
    carreraObjetivo: rt.carrera ?? rt.nombre,
    rutaId: rt.id,
    examenId: rt.examenId,
    cicloAnio: 2027,
    alias: p.data.alias,
  };
  const nuevo = !ses.perfil;
  await db
    .insert(s.perfilAlumno)
    .values({ cuentaId: ses.cuenta.id, ...valores, llegoConReferido: llego })
    // Con perfil ya creado, el área solo se cambia desde Diagnóstico (con sus reglas), no aquí.
    .onConflictDoUpdate({ target: s.perfilAlumno.cuentaId, set: nuevo ? valores : { alias: valores.alias } });
  await db
    .update(s.cuenta)
    .set({ name: p.data.nombre ?? "", avisoVersionAceptada: AVISO_VIGENTE, updatedAt: new Date() })
    .where(eq(s.cuenta.id, ses.cuenta.id));
  if (nuevo) {
    await darPrueba(db, ses.cuenta.id);
    await asegurarCodigoReferido(db, ses.cuenta.id, p.data.alias);
    await db
      .insert(s.preferenciaContacto)
      .values([
        { cuentaId: ses.cuenta.id, canal: "correo", tipo: "avisos_cuenta", activo: true },
        { cuentaId: ses.cuenta.id, canal: "correo", tipo: "resumen_semanal", activo: false },
      ])
      .onConflictDoNothing();
    const anon = jar.get(COOKIE_ANONIMA)?.value;
    if (anon) await adoptarAnonimos(db, anon, ses.cuenta.id);
    jar.delete(COOKIE_REF);
  }
  const sig = p.data.siguiente?.startsWith("/") && !p.data.siguiente.startsWith("//") ? p.data.siguiente : "/inicio";
  redirect(nuevo ? "/inicio?bienvenida=1" : sig);
}

const prefs = z.object({
  alias: z.string().trim(),
  nombre: z.string().trim().max(40).optional(),
  tema: z.enum(["claro", "oscuro", "sistema"]),
  ranking: z.string().optional(),
  repaso: z.string().optional(),
  resumen: z.string().optional(),
});

export async function guardarCuenta(_p: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const ses = await sesionActual();
  if (!ses?.perfil) redirect("/entrar");
  const p = prefs.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Revisa los datos." };
  const e = aliasValido(p.data.alias);
  if (e) return { error: e };
  const [repetido] = await db
    .select({ c: s.perfilAlumno.cuentaId })
    .from(s.perfilAlumno)
    .where(and(sql`lower(${s.perfilAlumno.alias}) = lower(${p.data.alias})`, ne(s.perfilAlumno.cuentaId, ses.cuenta.id)));
  if (repetido) return { error: "Ese alias ya lo usa alguien más." };
  const visible = p.data.ranking === "on";
  await db
    .update(s.perfilAlumno)
    .set({ alias: p.data.alias, temaInterfaz: p.data.tema, visibleEnRanking: visible, repasoEspaciado: p.data.repaso === "on" })
    .where(eq(s.perfilAlumno.cuentaId, ses.cuenta.id));
  // D20: al ocultarse, sale de todas las ligas.
  if (!visible) await db.delete(s.clasificacionSemanal).where(eq(s.clasificacionSemanal.cuentaId, ses.cuenta.id));
  await db.update(s.cuenta).set({ name: p.data.nombre ?? "" }).where(eq(s.cuenta.id, ses.cuenta.id));
  await db
    .insert(s.preferenciaContacto)
    .values({ cuentaId: ses.cuenta.id, canal: "correo", tipo: "resumen_semanal", activo: p.data.resumen === "on" })
    .onConflictDoUpdate({
      target: [s.preferenciaContacto.cuentaId, s.preferenciaContacto.canal, s.preferenciaContacto.tipo],
      set: { activo: p.data.resumen === "on", actualizadoEn: new Date() },
    });
  (await cookies()).set("eec_tema", p.data.tema, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return { ok: true };
}

/** Cambia la carrera (ruta) del alumno: el diagnóstico, el simulacro y la práctica salen de su banco. */
export async function cambiarRuta(form: FormData) {
  const ses = await sesionActual();
  if (!ses?.perfil) redirect("/entrar");
  const rutaId = String(form.get("ruta") ?? "");
  const [rt] = await db.select().from(s.ruta).where(and(eq(s.ruta.id, rutaId), eq(s.ruta.esGrupo, false)));
  if (!rt) redirect("/diagnostico");
  const rutas = await db.select({ id: s.ruta.id }).from(s.ruta).where(eq(s.ruta.esGrupo, false));
  const regla = await reglaCambio(db, ses.cuenta.id, rutas);
  // El servidor decide: el selector solo muestra lo permitido, pero un formulario se puede armar a mano.
  if (!puedeCambiarA(regla, rt.id, ses.perfil.rutaId)) redirect("/diagnostico?cambio=no#area");
  await db
    .update(s.perfilAlumno)
    .set({ rutaId: rt.id, carreraObjetivo: rt.carrera ?? rt.nombre, examenId: rt.examenId, nivel: rt.examenId === "EXANI-I" ? "prepa" : "licenciatura" })
    .where(eq(s.perfilAlumno.cuentaId, ses.cuenta.id));
  await auditar(ses.cuenta.id, "ruta_cambiada", "perfil", `${ses.perfil.rutaId}>${rt.id}`);
  redirect("/diagnostico?cambio=1");
}
