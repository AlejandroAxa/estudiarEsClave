/**
 * Motivación (R12, R13, mot-1): puntos como registro de solo inserción,
 * racha con protección automática e insignias por logros de aprendizaje.
 */
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { diaMx, diasEntre, inicioDiaMx, lunesDe, primeroDeMes, sumarDias } from "../fechas";
import { estadoPlan, limiteDe } from "../planes";

export const VERSION_MOTIVACION = "mot-1";
export const PUNTOS = { seccion: 50, acierto: 10, dia: 20, insignia: 30 } as const;

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Inserta un evento de puntos si no existe; actualiza la liga de la semana. */
export async function otorgarPuntos(
  db: Tx,
  e: { cuentaId: string; motivo: keyof typeof PUNTOS | "racha"; puntos: number; idem: string; intentoId?: string | null },
) {
  const filas = await db
    .insert(s.eventoPuntos)
    .values({ cuentaId: e.cuentaId, motivo: e.motivo, puntos: e.puntos, idIdempotencia: e.idem, intentoId: e.intentoId ?? null })
    .onConflictDoNothing()
    .returning({ id: s.eventoPuntos.id });
  if (!filas.length) return false;
  await sumarALiga(db, e.cuentaId, e.puntos);
  return true;
}

async function sumarALiga(db: Tx, cuentaId: string, puntos: number) {
  const [perfil] = await db.select({ visible: s.perfilAlumno.visibleEnRanking }).from(s.perfilAlumno).where(eq(s.perfilAlumno.cuentaId, cuentaId));
  if (!perfil?.visible) return; // D20: oculto no aparece en ninguna liga.
  const semana = lunesDe(diaMx());
  const actualizada = await db
    .update(s.clasificacionSemanal)
    .set({ puntos: sql`${s.clasificacionSemanal.puntos} + ${puntos}` })
    .where(and(eq(s.clasificacionSemanal.semana, semana), eq(s.clasificacionSemanal.cuentaId, cuentaId)))
    .returning({ c: s.clasificacionSemanal.cuentaId });
  if (actualizada.length) return;
  // Primera actividad de la semana: división según la semana pasada y grupo de unos 30.
  const [previa] = await db
    .select()
    .from(s.clasificacionSemanal)
    .where(and(eq(s.clasificacionSemanal.cuentaId, cuentaId), eq(s.clasificacionSemanal.semana, sumarDias(semana, -7))));
  const division = previa ? divisionSiguiente(previa.division, previa.posicion, await tamanoGrupo(db, previa.semana, previa.division, previa.grupo)) : "bronce";
  const [{ n }] = await db
    .select({ n: count() })
    .from(s.clasificacionSemanal)
    .where(and(eq(s.clasificacionSemanal.semana, semana), eq(s.clasificacionSemanal.division, division)));
  const grupo = Math.floor(n / 30) + 1;
  await db
    .insert(s.clasificacionSemanal)
    .values({ semana, cuentaId, division, grupo, puntos })
    .onConflictDoUpdate({
      target: [s.clasificacionSemanal.semana, s.clasificacionSemanal.cuentaId],
      set: { puntos: sql`${s.clasificacionSemanal.puntos} + ${puntos}` },
    });
}

async function tamanoGrupo(db: Tx, semana: string, division: string, grupo: number) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(s.clasificacionSemanal)
    .where(and(eq(s.clasificacionSemanal.semana, semana), eq(s.clasificacionSemanal.division, division), eq(s.clasificacionSemanal.grupo, grupo)));
  return n;
}

const DIVISIONES = ["bronce", "plata", "oro"] as const;
export function divisionSiguiente(division: string, posicion: number | null, tamano: number) {
  const i = DIVISIONES.indexOf(division as (typeof DIVISIONES)[number]);
  if (posicion == null) return division;
  if (posicion <= 5 && i < 2) return DIVISIONES[i + 1];
  if (tamano > 10 && posicion > tamano - 5 && i > 0) return DIVISIONES[i - 1];
  return division;
}

/** Cierre semanal de ligas (lunes 00:00 CDMX): fija posiciones de la semana anterior. */
export async function cerrarLigas(db: Db, semana = sumarDias(lunesDe(diaMx()), -7)) {
  const filas = await db
    .select()
    .from(s.clasificacionSemanal)
    .where(eq(s.clasificacionSemanal.semana, semana))
    .orderBy(asc(s.clasificacionSemanal.division), asc(s.clasificacionSemanal.grupo), desc(s.clasificacionSemanal.puntos));
  const grupos = new Map<string, typeof filas>();
  for (const f of filas) {
    const k = `${f.division}|${f.grupo}`;
    (grupos.get(k) ?? grupos.set(k, []).get(k)!).push(f);
  }
  for (const lista of grupos.values()) {
    for (const [i, f] of lista.entries()) {
      await db
        .update(s.clasificacionSemanal)
        .set({ posicion: i + 1 })
        .where(and(eq(s.clasificacionSemanal.semana, f.semana), eq(s.clasificacionSemanal.cuentaId, f.cuentaId)));
    }
  }
  return { semana, alumnos: filas.length, grupos: grupos.size };
}

/**
 * Registra que el alumno estudió hoy (terminó una sección o 10 de práctica).
 * Si faltó un día y le queda protección en el periodo, se gasta sola.
 */
export async function registrarDiaEstudiado(db: Db, cuentaId: string) {
  const hoy = diaMx();
  const [r] = await db.select().from(s.racha).where(eq(s.racha.cuentaId, cuentaId));
  if (r?.ultimoDia === hoy) return r;
  const plan = (await estadoPlan(db, cuentaId)).plan;
  const lim = await limiteDe(db, plan, "protecciones");
  const periodo = lim.periodo === "mes" ? primeroDeMes(hoy) : lunesDe(hoy);
  let actual = 1;
  let proteccion = r?.proteccionUsada ?? null;
  if (r?.ultimoDia) {
    const gap = diasEntre(r.ultimoDia, hoy);
    if (gap === 1) actual = r.actual + 1;
    else if (gap === 2 && (lim.cantidad ?? 1) > 0 && proteccion !== periodo) {
      actual = r.actual + 1;
      proteccion = periodo;
    }
  }
  const dias = [...(r?.dias ? r.dias.split(",") : []), hoy].slice(-60).join(",");
  const fila = { cuentaId, actual, mejor: Math.max(actual, r?.mejor ?? 0), ultimoDia: hoy, proteccionUsada: proteccion, dias };
  await db.insert(s.racha).values(fila).onConflictDoUpdate({ target: s.racha.cuentaId, set: fila });
  if (actual >= 7) await darInsignia(db, cuentaId, "racha-7");
  return fila;
}

/** Racha vista hoy: si ya pasó más de un día sin protección, se muestra en 0 (sin borrar puntos ni insignias). */
export function rachaVigente(r: { actual: number; ultimoDia: string | null } | undefined | null) {
  if (!r?.ultimoDia) return 0;
  const gap = diasEntre(r.ultimoDia, diaMx());
  return gap <= 2 ? r.actual : 0;
}

export async function darInsignia(db: Tx, cuentaId: string, insigniaId: string) {
  const nueva = await db
    .insert(s.cuentaInsignia)
    .values({ cuentaId, insigniaId })
    .onConflictDoNothing()
    .returning({ id: s.cuentaInsignia.insigniaId });
  if (nueva.length) await otorgarPuntos(db, { cuentaId, motivo: "insignia", puntos: PUNTOS.insignia, idem: `insignia:${cuentaId}:${insigniaId}` });
  return nueva.length > 0;
}

/** Puntos por primera sesión del día. */
export async function puntosDelDia(db: Db, cuentaId: string) {
  return otorgarPuntos(db, { cuentaId, motivo: "dia", puntos: PUNTOS.dia, idem: `dia:${cuentaId}:${diaMx()}` });
}

export async function puntosTotales(db: Db, cuentaId: string) {
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${s.eventoPuntos.puntos}),0)::int` })
    .from(s.eventoPuntos)
    .where(eq(s.eventoPuntos.cuentaId, cuentaId));
  return r.total;
}

export async function puntosSemana(db: Db, cuentaId: string) {
  const desde = inicioDiaMx(lunesDe(diaMx()));
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${s.eventoPuntos.puntos}),0)::int` })
    .from(s.eventoPuntos)
    .where(and(eq(s.eventoPuntos.cuentaId, cuentaId), gte(s.eventoPuntos.fecha, desde)));
  return r.total;
}

/** Insignias que dependen de comparar dos diagnósticos (subárea que sube, error que desaparece). */
export async function insigniasPorDiagnostico(db: Db, cuentaId: string, intentoId: string) {
  await darInsignia(db, cuentaId, "primer-diagnostico");
  const previos = await db
    .select({ id: s.intento.id })
    .from(s.intento)
    .innerJoin(s.resultado, eq(s.resultado.intentoId, s.intento.id))
    .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, "diagnostico"), eq(s.intento.estado, "enviado")))
    .orderBy(desc(s.intento.enviadoEn))
    .limit(2);
  const anterior = previos.find((p) => p.id !== intentoId);
  if (!anterior) return;
  const orden = { "Área de oportunidad": 0, "En desarrollo": 1, Dominas: 2 } as Record<string, number>;
  const antes = await db.select().from(s.resultadoSubarea).where(eq(s.resultadoSubarea.intentoId, anterior.id));
  const ahora = await db.select().from(s.resultadoSubarea).where(eq(s.resultadoSubarea.intentoId, intentoId));
  const sube = ahora.some((x) => {
    const a = antes.find((y) => y.subareaId === x.subareaId);
    return a?.nivel && x.nivel && orden[x.nivel] > orden[a.nivel];
  });
  if (sube) await darInsignia(db, cuentaId, "subarea-sube");
  const errAntes = await db.select().from(s.errorFrecuente).where(eq(s.errorFrecuente.intentoId, anterior.id));
  const errAhora = new Set((await db.select().from(s.errorFrecuente).where(eq(s.errorFrecuente.intentoId, intentoId))).map((e) => e.errorId));
  if (errAntes.some((e) => !errAhora.has(e.errorId))) await darInsignia(db, cuentaId, "error-corregido");
}
