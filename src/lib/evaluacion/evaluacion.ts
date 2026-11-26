/**
 * Evaluación por secciones (CU-03, CU-04, CU-05; RF-13 a RF-19, RF-37; RNF-05).
 * El navegador nunca recibe la opción correcta ni las argumentaciones durante
 * un diagnóstico: todo se califica aquí.
 */
import { and, asc, count, desc, eq, gte, inArray, isNotNull, ne, sql } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { barajar, derivar, semillaNueva } from "../aleatorio";
import { calificar, type ItemCalificable, type Taxonomia, type Umbrales } from "../diagnostico/calificar";
import { describir, VERSION_TEXTOS } from "../diagnostico/descripcion";
import { diaMx, inicioDiaMx } from "../fechas";
import { darInsignia, insigniasPorDiagnostico, otorgarPuntos, PUNTOS, puntosDelDia, registrarDiaEstudiado } from "../motivacion/motivacion";
import { releaseVigente } from "../banco/publicar";
import { cuota, estadoPlan, paseCubre, planParaArea, planParaRuta, incluido } from "../planes";

export type Letra = "A" | "B" | "C";
export const LETRAS: Letra[] = ["A", "B", "C"];
const GRACIA_MS = 2 * 60 * 1000;
const PLAZO_INTENTO_MS = 7 * 86400000;

export interface Dueno {
  cuentaId?: string | null;
  sesionAnonimaId?: string | null;
}

export class ErrorEvaluacion extends Error {
  constructor(
    message: string,
    public codigo: "no_encontrado" | "prohibido" | "cerrado" | "cuota" | "invalido" | "sin_banco",
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/* ───────────── Utilidades ───────────── */

/** Etiquetas que aplican a una ruta: la propia y sus grupos («salud», «todas»). */
export async function etiquetasRuta(db: Db, rutaId: string) {
  const [r] = await db.select().from(s.ruta).where(eq(s.ruta.id, rutaId));
  if (!r) return [rutaId];
  return [r.id, ...r.grupos.split(",").filter(Boolean)];
}

export async function taxonomiaDe(db: Db, areaIds: string[]): Promise<Taxonomia> {
  if (!areaIds.length) return [];
  const areas = await db.select().from(s.area).where(inArray(s.area.id, areaIds)).orderBy(asc(s.area.orden));
  const subs = await db.select().from(s.subarea).where(inArray(s.subarea.areaId, areaIds)).orderBy(asc(s.subarea.orden));
  const temas = subs.length
    ? await db.select().from(s.tema).where(inArray(s.tema.subareaId, subs.map((x) => x.id))).orderBy(asc(s.tema.orden))
    : [];
  return areas.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    cuentaPuntaje: a.cuentaPuntaje,
    subareas: subs
      .filter((x) => x.areaId === a.id)
      .map((x) => ({ id: x.id, nombre: x.nombre, peso: x.reactivosExamen, temas: temas.filter((t) => t.subareaId === x.id).map((t) => ({ id: t.id, nombre: t.nombre })) })),
  }));
}

function esDueno(i: typeof s.intento.$inferSelect, d: Dueno) {
  if (i.cuentaId) return !!d.cuentaId && i.cuentaId === d.cuentaId;
  return !!d.sesionAnonimaId && i.sesionAnonimaId === d.sesionAnonimaId;
}

export async function intentoDe(db: Db, intentoId: string, d: Dueno) {
  if (!/^[0-9a-f-]{36}$/i.test(intentoId)) throw new ErrorEvaluacion("Intento no encontrado", "no_encontrado");
  const [i] = await db.select().from(s.intento).where(eq(s.intento.id, intentoId));
  if (!i) throw new ErrorEvaluacion("Intento no encontrado", "no_encontrado");
  if (!esDueno(i, d)) throw new ErrorEvaluacion("Este intento no es tuyo", "prohibido");
  return i;
}

/** Ordena los ítems de una sección: los de una misma lectura quedan juntos y se barajan entre sí (RF-14). */
function ordenarBloques<T extends { textoId: string | null }>(items: T[], semilla: number) {
  const bloques: T[][] = [];
  for (const it of items) {
    const ultimo = bloques[bloques.length - 1];
    if (ultimo && it.textoId && ultimo[0].textoId === it.textoId) ultimo.push(it);
    else bloques.push([it]);
  }
  return bloques.flatMap((b, i) => (b.length > 1 ? barajar(b, derivar(semilla, 1000 + i)) : b));
}

/* ───────────── Crear intentos ───────────── */

export async function plantillaActiva(db: Db, rutaId: string, modo: string) {
  const [p] = await db
    .select()
    .from(s.plantilla)
    .where(and(eq(s.plantilla.rutaId, rutaId), eq(s.plantilla.modo, modo), eq(s.plantilla.activa, true)))
    .orderBy(desc(s.plantilla.id))
    .limit(1);
  return p ?? null;
}

export async function crearIntento(db: Db, p: { plantillaId: string } & Dueno) {
  const [pl] = await db.select().from(s.plantilla).where(eq(s.plantilla.id, p.plantillaId));
  if (!pl || !pl.activa) throw new ErrorEvaluacion("Esta plantilla no está disponible", "no_encontrado");
  if (!p.cuentaId && pl.modo !== "mini") throw new ErrorEvaluacion("Crea tu cuenta para presentar este examen", "prohibido");
  const [rt] = await db.select().from(s.ruta).where(eq(s.ruta.id, pl.rutaId));
  const rel = await releaseVigente(db, rt.examenId);
  if (!rel) throw new ErrorEvaluacion("Todavía no hay un banco publicado para este examen", "sin_banco");

  if (p.cuentaId) {
    const plan = planParaRuta(await estadoPlan(db, p.cuentaId), pl.rutaId);
    const c = await cuota(db, p.cuentaId, pl.modo as "diagnostico" | "simulacro" | "muestra" | "mini", plan);
    if (!c.permitido) throw new ErrorEvaluacion(c.textoMuro ?? "Llegaste al límite de tu plan", "cuota", { recurso: pl.modo });
  }

  const filas = await db
    .select({
      orden: s.plantillaReactivo.orden,
      seccion: s.plantillaReactivo.seccion,
      reactivoId: s.plantillaReactivo.reactivoId,
      version: s.releaseItem.version,
      textoId: s.reactivoVersion.textoId,
    })
    .from(s.plantillaReactivo)
    .innerJoin(s.releaseItem, and(eq(s.releaseItem.reactivoId, s.plantillaReactivo.reactivoId), eq(s.releaseItem.releaseVersion, rel.version)))
    .innerJoin(
      s.reactivoVersion,
      and(eq(s.reactivoVersion.reactivoId, s.releaseItem.reactivoId), eq(s.reactivoVersion.version, s.releaseItem.version)),
    )
    .where(and(eq(s.plantillaReactivo.plantillaId, pl.id), eq(s.reactivoVersion.estado, "publicado")))
    .orderBy(asc(s.plantillaReactivo.orden));
  if (!filas.length) throw new ErrorEvaluacion("La plantilla no tiene reactivos publicados", "sin_banco");
  const secciones = await db.select().from(s.plantillaSeccion).where(eq(s.plantillaSeccion.plantillaId, pl.id)).orderBy(asc(s.plantillaSeccion.numero));

  const semilla = semillaNueva();
  const ahora = new Date();
  const global = pl.cronometroGlobal;
  const venceGlobal = new Date(ahora.getTime() + pl.tiempoLimiteMin * 60000);

  return db.transaction(async (tx) => {
    const [i] = await tx
      .insert(s.intento)
      .values({
        cuentaId: p.cuentaId ?? null,
        sesionAnonimaId: p.cuentaId ? null : p.sesionAnonimaId,
        plantillaId: pl.id,
        releaseVersion: rel.version,
        modo: pl.modo,
        semilla,
        venceEn: global ? venceGlobal : new Date(ahora.getTime() + PLAZO_INTENTO_MS),
      })
      .returning();
    const usadas = secciones.filter((x) => filas.some((f) => f.seccion === x.numero));
    await tx.insert(s.seccionIntento).values(
      usadas.map((x) => ({
        intentoId: i.id,
        numero: x.numero,
        areaId: x.areaId,
        tiempoLimiteMin: x.tiempoLimiteMin,
        estado: global ? "en_curso" : "pendiente",
        iniciaEn: global ? ahora : null,
        venceEn: global ? venceGlobal : null,
      })),
    );
    let orden = 0;
    const items: (typeof s.itemIntento.$inferInsert)[] = [];
    for (const sec of usadas) {
      for (const f of ordenarBloques(filas.filter((x) => x.seccion === sec.numero), derivar(semilla, sec.numero))) {
        orden++;
        items.push({
          intentoId: i.id,
          orden,
          seccion: sec.numero,
          reactivoId: f.reactivoId,
          version: f.version,
          ordenOpciones: barajar(LETRAS, derivar(semilla, orden)).join(""),
        });
      }
    }
    await tx.insert(s.itemIntento).values(items);
    return i;
  });
}

/* ───────────── Práctica ───────────── */

export interface FiltroPractica {
  subareaId?: string;
  temaId?: string;
  repaso?: boolean;
}

/** Reactivos de práctica (R9): fuera de las plantillas vigentes, o ya vistos por el alumno en su revisión. */
export async function poolPractica(db: Db, cuentaId: string, rutaId: string, f: FiltroPractica) {
  const [rt] = await db.select().from(s.ruta).where(eq(s.ruta.id, rutaId));
  const rel = await releaseVigente(db, rt.examenId);
  if (!rel) return { rel: null, items: [] as { reactivoId: string; version: number; temaId: string; subareaId: string; areaId: string }[] };
  const etiquetas = await etiquetasRuta(db, rutaId);
  const base = await db
    .selectDistinct({
      reactivoId: s.releaseItem.reactivoId,
      version: s.releaseItem.version,
      temaId: s.reactivoVersion.temaId,
      subareaId: s.tema.subareaId,
      areaId: s.subarea.areaId,
    })
    .from(s.releaseItem)
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.releaseItem.reactivoId), eq(s.reactivoVersion.version, s.releaseItem.version)))
    .innerJoin(s.reactivoRuta, and(eq(s.reactivoRuta.reactivoId, s.releaseItem.reactivoId), eq(s.reactivoRuta.version, s.releaseItem.version)))
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .where(
      and(
        eq(s.releaseItem.releaseVersion, rel.version),
        eq(s.reactivoVersion.estado, "publicado"),
        inArray(s.reactivoRuta.rutaId, etiquetas),
        f.temaId ? eq(s.reactivoVersion.temaId, f.temaId) : undefined,
        f.subareaId ? eq(s.tema.subareaId, f.subareaId) : undefined,
      ),
    );
  const enPlantillas = new Set(
    (
      await db
        .selectDistinct({ id: s.plantillaReactivo.reactivoId })
        .from(s.plantillaReactivo)
        .innerJoin(s.plantilla, eq(s.plantilla.id, s.plantillaReactivo.plantillaId))
        .where(and(eq(s.plantilla.activa, true), eq(s.plantilla.rutaId, rutaId)))
    ).map((x) => x.id),
  );
  const vistos = new Set(
    (
      await db
        .selectDistinct({ id: s.itemIntento.reactivoId })
        .from(s.itemIntento)
        .innerJoin(s.intento, eq(s.intento.id, s.itemIntento.intentoId))
        .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.estado, "enviado"), ne(s.intento.modo, "practica")))
    ).map((x) => x.id),
  );
  return { rel, items: base.filter((b) => !enPlantillas.has(b.reactivoId) || vistos.has(b.reactivoId)) };
}

/** Historial de práctica por reactivo, para el repaso espaciado (RF-51) sin tabla nueva. */
export async function pendientesRepaso(db: Db, cuentaId: string) {
  const filas = await db
    .select({ reactivoId: s.respuesta.reactivoId, correcta: s.respuesta.correcta, en: s.respuesta.respondidaEn })
    .from(s.respuesta)
    .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
    .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, "practica"), isNotNull(s.respuesta.opcionId)))
    .orderBy(asc(s.respuesta.respondidaEn));
  const porReactivo = new Map<string, { ultimaFalla: Date | null; aciertosDespues: number }>();
  for (const f of filas) {
    const h = porReactivo.get(f.reactivoId) ?? { ultimaFalla: null, aciertosDespues: 0 };
    if (!f.correcta) {
      h.ultimaFalla = f.en;
      h.aciertosDespues = 0;
    } else if (h.ultimaFalla) h.aciertosDespues++;
    porReactivo.set(f.reactivoId, h);
  }
  const hoy = inicioDiaMx(diaMx()).getTime();
  const intervalos = [1, 3, 7];
  const pendientes: string[] = [];
  let enEspera = 0;
  for (const [id, h] of porReactivo) {
    if (!h.ultimaFalla || h.aciertosDespues >= 3) continue;
    const dias = Math.floor((hoy - inicioDiaMx(diaMx(h.ultimaFalla)).getTime()) / 86400000);
    if (dias >= intervalos[h.aciertosDespues]) pendientes.push(id);
    else enEspera++;
  }
  return { pendientes, enEspera };
}

export async function crearPractica(db: Db, cuentaId: string, f: FiltroPractica, cuantas = 10) {
  const [perfil] = await db.select().from(s.perfilAlumno).where(eq(s.perfilAlumno.cuentaId, cuentaId));
  if (!perfil) throw new ErrorEvaluacion("Completa tu perfil primero", "invalido");
  const plan = await estadoPlan(db, cuentaId);
  const recurso = f.repaso ? "repaso" : "practica";
  if (f.repaso && !(await incluido(db, plan.plan, "repaso"))) throw new ErrorEvaluacion("El repaso espaciado viene con el pase", "cuota", { recurso });
  const { rel, items } = await poolPractica(db, cuentaId, perfil.rutaId, f);
  if (!rel) throw new ErrorEvaluacion("Todavía no hay un banco publicado", "sin_banco");
  let candidatos = items;
  // Con un pase que abre solo algunas áreas, la práctica sin límite es de esas
  // áreas; lo demás se practica con la cuota que quede (prueba o gratis).
  let planUso = plan.plan;
  if (plan.plan === "pase" && plan.areas && !f.repaso) {
    const cubiertos = items.filter((i) => paseCubre(plan, i.areaId));
    if (cubiertos.length) candidatos = cubiertos;
    else planUso = planParaArea(plan, items[0]?.areaId ?? null);
  }
  const c = await cuota(db, cuentaId, recurso, planUso);
  if (!c.permitido) throw new ErrorEvaluacion(c.textoMuro ?? "Llegaste a tu límite de hoy", "cuota", { recurso, recargaEn: c.recargaEn });
  if (f.repaso) {
    const { pendientes } = await pendientesRepaso(db, cuentaId);
    const set = new Set(pendientes);
    candidatos = items.filter((i) => set.has(i.reactivoId));
  }
  if (!candidatos.length) {
    throw new ErrorEvaluacion(
      f.repaso
        ? "No tienes preguntas pendientes de repaso hoy. Vuelve mañana."
        : "Aún no hay preguntas de práctica aquí. Presenta tu diagnóstico: al revisarlo, sus preguntas se abren para practicar.",
      "sin_banco",
    );
  }
  // Primero lo que nunca ha practicado, luego lo que ha fallado; dentro de cada grupo, al azar.
  const historial = await db
    .select({ reactivoId: s.respuesta.reactivoId, correcta: s.respuesta.correcta })
    .from(s.respuesta)
    .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
    .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, "practica")));
  const visto = new Map<string, boolean>();
  for (const h of historial) visto.set(h.reactivoId, (visto.get(h.reactivoId) ?? true) && h.correcta);
  const semilla = semillaNueva();
  const mezcla = barajar(candidatos, semilla);
  const rango = (id: string) => (!visto.has(id) ? 0 : visto.get(id) ? 2 : 1);
  const elegidos = (f.repaso ? mezcla : [...mezcla].sort((a, b) => rango(a.reactivoId) - rango(b.reactivoId)))
    .slice(0, Math.min(cuantas, c.restante ?? cuantas));

  const ahora = new Date();
  return db.transaction(async (tx) => {
    const [i] = await tx
      .insert(s.intento)
      .values({
        cuentaId,
        releaseVersion: rel.version,
        modo: "practica",
        semilla,
        filtro: f.repaso ? "repaso" : (f.temaId ?? f.subareaId ?? null),
        venceEn: new Date(ahora.getTime() + 86400000),
      })
      .returning();
    await tx.insert(s.seccionIntento).values({ intentoId: i.id, numero: 1, tiempoLimiteMin: 0, estado: "en_curso", iniciaEn: ahora });
    await tx.insert(s.itemIntento).values(
      elegidos.map((e, k) => ({
        intentoId: i.id,
        orden: k + 1,
        seccion: 1,
        reactivoId: e.reactivoId,
        version: e.version,
        ordenOpciones: barajar(LETRAS, derivar(semilla, k + 1)).join(""),
      })),
    );
    return i;
  });
}

/* ───────────── Presentar ───────────── */

export interface OpcionVisible {
  letra: Letra;
  texto: string;
}
export interface ItemVisible {
  orden: number;
  seccion: number;
  reactivoId: string;
  formato: string;
  enunciado: string;
  /** Ficha de datos opcional (símbolo y descripción, en notación del banco). */
  datos: { tex: string; desc: string }[] | null;
  textoId: string | null;
  areaId: string;
  opciones: OpcionVisible[];
  respuesta: Letra | null;
  marcada: boolean;
}

/** Ítems de un intento sin la respuesta correcta ni argumentaciones. */
export async function itemsVisibles(db: Db, intentoId: string): Promise<{ items: ItemVisible[]; textos: Record<string, { titulo: string; cuerpo: string; esVerso: boolean; autoria: string | null }> }> {
  const filas = await db
    .select({ it: s.itemIntento, rv: s.reactivoVersion, areaId: s.subarea.areaId })
    .from(s.itemIntento)
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.itemIntento.reactivoId), eq(s.reactivoVersion.version, s.itemIntento.version)))
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .where(eq(s.itemIntento.intentoId, intentoId))
    .orderBy(asc(s.itemIntento.orden));
  const ids = [...new Set(filas.map((f) => f.it.reactivoId))];
  const ops = ids.length
    ? await db
        .select({ reactivoId: s.opcion.reactivoId, version: s.opcion.version, opcionId: s.opcion.opcionId, texto: s.opcion.texto })
        .from(s.opcion)
        .where(inArray(s.opcion.reactivoId, ids))
    : [];
  const resp = await db.select().from(s.respuesta).where(eq(s.respuesta.intentoId, intentoId));
  const textoIds = [...new Set(filas.map((f) => f.rv.textoId).filter(Boolean))] as string[];
  const txt = textoIds.length ? await db.select().from(s.texto).where(inArray(s.texto.id, textoIds)) : [];
  const items = filas.map(({ it, rv, areaId }) => {
    const r = resp.find((x) => x.orden === it.orden);
    const perm = it.ordenOpciones.split("") as Letra[];
    const opciones = perm.map((orig, pos) => ({
      letra: LETRAS[pos],
      texto: ops.find((o) => o.reactivoId === it.reactivoId && o.version === it.version && o.opcionId.trim() === orig)?.texto ?? "",
    }));
    const letraResp = r?.opcionId ? LETRAS[perm.indexOf(r.opcionId.trim() as Letra)] : null;
    return {
      orden: it.orden,
      seccion: it.seccion,
      reactivoId: it.reactivoId,
      formato: rv.formato,
      enunciado: rv.enunciado,
      datos: rv.datos ?? null,
      textoId: rv.textoId,
      areaId,
      opciones,
      respuesta: letraResp,
      marcada: r?.marcadaRevisar ?? false,
    };
  });
  return { items, textos: Object.fromEntries(txt.map((t) => [t.id, { titulo: t.titulo, cuerpo: t.cuerpo, esVerso: t.esVerso, autoria: t.autoria }])) };
}

export async function seccionesDe(db: Db, intentoId: string) {
  return db
    .select({ sec: s.seccionIntento, area: s.area.nombre })
    .from(s.seccionIntento)
    .leftJoin(s.area, eq(s.area.id, s.seccionIntento.areaId))
    .where(eq(s.seccionIntento.intentoId, intentoId))
    .orderBy(asc(s.seccionIntento.numero));
}

export async function iniciarSeccion(db: Db, intentoId: string, numero: number, d: Dueno) {
  const i = await intentoDe(db, intentoId, d);
  if (i.estado !== "en_curso") throw new ErrorEvaluacion("Este intento ya terminó", "cerrado");
  const secs = await db.select().from(s.seccionIntento).where(eq(s.seccionIntento.intentoId, intentoId));
  const sec = secs.find((x) => x.numero === numero);
  if (!sec) throw new ErrorEvaluacion("Sección no encontrada", "no_encontrado");
  if (sec.estado === "terminada") throw new ErrorEvaluacion("Esta sección ya está cerrada", "cerrado");
  if (sec.estado === "en_curso") return sec;
  const otra = secs.find((x) => x.estado === "en_curso");
  if (otra) throw new ErrorEvaluacion(`Termina primero la sección ${otra.numero}`, "invalido");
  const ahora = new Date();
  const [act] = await db
    .update(s.seccionIntento)
    .set({ estado: "en_curso", iniciaEn: ahora, venceEn: new Date(ahora.getTime() + sec.tiempoLimiteMin * 60000) })
    .where(and(eq(s.seccionIntento.intentoId, intentoId), eq(s.seccionIntento.numero, numero)))
    .returning();
  await db.update(s.intento).set({ ultimaActividadEn: ahora }).where(eq(s.intento.id, intentoId));
  return act;
}

/* ───────────── Responder ───────────── */

export interface Retroalimentacion {
  correcta: boolean;
  letraCorrecta: Letra;
  explicacion: string;
  /** Argumentación por letra; las bloqueadas por el plan vienen nulas. */
  argumentaciones: Record<Letra, string | null>;
  bloqueadas: boolean;
  recomendacion: string | null;
  referencias: { fuente: string; ubicacion: string }[];
  puntos: number;
}

export async function guardarRespuesta(
  db: Db,
  p: { intentoId: string; orden: number; letra: Letra | null; marcada?: boolean; tiempoMs?: number; idIdempotencia: string } & Dueno,
): Promise<{ ok: true; retro?: Retroalimentacion; duplicada?: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(p.idIdempotencia)) throw new ErrorEvaluacion("id de idempotencia inválido", "invalido");
  const i = await intentoDe(db, p.intentoId, p);
  const [ya] = await db.select().from(s.respuesta).where(eq(s.respuesta.idIdempotencia, p.idIdempotencia));
  if (ya) {
    if (ya.intentoId !== i.id) throw new ErrorEvaluacion("Reenvío inválido", "invalido");
    return { ok: true, duplicada: true, retro: i.modo === "practica" ? await retroalimentacion(db, i, ya.orden) : undefined };
  }
  if (i.estado !== "en_curso") throw new ErrorEvaluacion("Este intento ya se envió", "cerrado");
  const [it] = await db
    .select()
    .from(s.itemIntento)
    .where(and(eq(s.itemIntento.intentoId, i.id), eq(s.itemIntento.orden, p.orden)));
  if (!it) throw new ErrorEvaluacion("Pregunta no encontrada", "no_encontrado");
  const [sec] = await db
    .select()
    .from(s.seccionIntento)
    .where(and(eq(s.seccionIntento.intentoId, i.id), eq(s.seccionIntento.numero, it.seccion)));
  const ahora = new Date();
  if (sec.estado !== "en_curso") throw new ErrorEvaluacion("La sección no está abierta", "cerrado");
  if (i.modo !== "practica" && sec.venceEn && ahora.getTime() > sec.venceEn.getTime() + GRACIA_MS) {
    await terminarSeccion(db, i.id, sec.numero, p, { porTiempo: true });
    throw new ErrorEvaluacion("Se acabó el tiempo de esta sección", "cerrado");
  }

  const perm = it.ordenOpciones.split("") as Letra[];
  const original = p.letra ? perm[LETRAS.indexOf(p.letra)] : null;
  if (p.letra && !original) throw new ErrorEvaluacion("Opción inválida", "invalido");
  const [op] = original
    ? await db
        .select()
        .from(s.opcion)
        .where(and(eq(s.opcion.reactivoId, it.reactivoId), eq(s.opcion.version, it.version), eq(s.opcion.opcionId, original)))
    : [];

  if (i.modo === "practica") {
    const [previa] = await db.select().from(s.respuesta).where(and(eq(s.respuesta.intentoId, i.id), eq(s.respuesta.orden, p.orden)));
    if (previa) return { ok: true, duplicada: true, retro: await retroalimentacion(db, i, p.orden) };
    if (!original) throw new ErrorEvaluacion("Elige una opción", "invalido");
    const recurso = i.filtro === "repaso" ? "repaso" : "practica";
    const c = await cuota(db, i.cuentaId, recurso);
    if (!c.permitido) throw new ErrorEvaluacion(c.textoMuro ?? "Llegaste a tu límite de hoy", "cuota", { recurso, recargaEn: c.recargaEn });
  }

  const valores = {
    opcionId: original,
    correcta: op?.correcta ?? false,
    errorId: op && !op.correcta ? op.errorId : null,
    marcadaRevisar: p.marcada ?? false,
    tiempoMs: p.tiempoMs ?? null,
    idIdempotencia: p.idIdempotencia,
    respondidaEn: ahora,
  };
  await db
    .insert(s.respuesta)
    .values({ intentoId: i.id, orden: p.orden, reactivoId: it.reactivoId, version: it.version, ...valores })
    .onConflictDoUpdate({ target: [s.respuesta.intentoId, s.respuesta.orden], set: valores });
  await db.update(s.intento).set({ ultimaActividadEn: ahora }).where(eq(s.intento.id, i.id));

  if (i.modo !== "practica" || !i.cuentaId) return { ok: true };

  // Práctica: puntos, racha, insignias y retroalimentación inmediata.
  const cuentaId = i.cuentaId;
  await puntosDelDia(db, cuentaId);
  if (valores.correcta) await otorgarPuntos(db, { cuentaId, motivo: "acierto", puntos: PUNTOS.acierto, idem: `acierto:${i.id}:${p.orden}`, intentoId: i.id });
  const [{ hoy }] = await db
    .select({ hoy: count() })
    .from(s.respuesta)
    .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
    .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, "practica"), gte(s.respuesta.respondidaEn, inicioDiaMx(diaMx()))));
  if (hoy >= 10) {
    await registrarDiaEstudiado(db, cuentaId);
    await darInsignia(db, cuentaId, "dosis-completa");
  }
  if (valores.correcta) await revisarTemaDominado(db, cuentaId, it.reactivoId, it.version);
  return { ok: true, retro: await retroalimentacion(db, i, p.orden) };
}

async function revisarTemaDominado(db: Db, cuentaId: string, reactivoId: string, version: number) {
  const [rv] = await db
    .select({ temaId: s.reactivoVersion.temaId })
    .from(s.reactivoVersion)
    .where(and(eq(s.reactivoVersion.reactivoId, reactivoId), eq(s.reactivoVersion.version, version)));
  const ultimas = await db
    .select({ correcta: s.respuesta.correcta })
    .from(s.respuesta)
    .innerJoin(s.intento, eq(s.intento.id, s.respuesta.intentoId))
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.respuesta.reactivoId), eq(s.reactivoVersion.version, s.respuesta.version)))
    .where(and(eq(s.intento.cuentaId, cuentaId), eq(s.intento.modo, "practica"), eq(s.reactivoVersion.temaId, rv.temaId)))
    .orderBy(desc(s.respuesta.respondidaEn))
    .limit(5);
  if (ultimas.length === 5 && ultimas.every((u) => u.correcta)) await darInsignia(db, cuentaId, "tema-dominado");
}

async function retroalimentacion(db: Db, i: typeof s.intento.$inferSelect, orden: number): Promise<Retroalimentacion> {
  const [it] = await db.select().from(s.itemIntento).where(and(eq(s.itemIntento.intentoId, i.id), eq(s.itemIntento.orden, orden)));
  const [r] = await db.select().from(s.respuesta).where(and(eq(s.respuesta.intentoId, i.id), eq(s.respuesta.orden, orden)));
  const det = await detalleReactivo(db, it.reactivoId, it.version);
  const plan = await estadoPlan(db, i.cuentaId);
  const completo = await incluido(db, planParaArea(plan, det.areaId), "argumentaciones");
  const perm = it.ordenOpciones.split("") as Letra[];
  const letraDe = (orig: string) => LETRAS[perm.indexOf(orig.trim() as Letra)];
  const correcta = det.opciones.find((o) => o.correcta)!;
  const elegida = r?.opcionId?.trim();
  const argumentaciones = Object.fromEntries(
    det.opciones.map((o) => [letraDe(o.opcionId), completo || o.correcta || o.opcionId.trim() === elegida ? o.argumentacion : null]),
  ) as Record<Letra, string | null>;
  const [ev] = r?.correcta
    ? await db.select({ p: s.eventoPuntos.puntos }).from(s.eventoPuntos).where(eq(s.eventoPuntos.idIdempotencia, `acierto:${i.id}:${orden}`))
    : [];
  return {
    correcta: !!r?.correcta,
    letraCorrecta: letraDe(correcta.opcionId),
    explicacion: det.explicacion,
    argumentaciones,
    bloqueadas: !completo,
    recomendacion: r?.errorId ? (det.errores[r.errorId] ?? null) : null,
    referencias: completo ? det.referencias : [],
    puntos: ev?.p ?? 0,
  };
}

export async function detalleReactivo(db: Db, reactivoId: string, version: number) {
  const [rv] = await db
    .select({ rv: s.reactivoVersion, subareaId: s.tema.subareaId, areaId: s.subarea.areaId, tema: s.tema.nombre, subarea: s.subarea.nombre })
    .from(s.reactivoVersion)
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .where(and(eq(s.reactivoVersion.reactivoId, reactivoId), eq(s.reactivoVersion.version, version)));
  const opciones = await db.select().from(s.opcion).where(and(eq(s.opcion.reactivoId, reactivoId), eq(s.opcion.version, version)));
  const referencias = await db
    .select({ fuente: s.referencia.fuente, ubicacion: s.referencia.ubicacion })
    .from(s.referencia)
    .where(and(eq(s.referencia.reactivoId, reactivoId), eq(s.referencia.version, version)))
    .orderBy(asc(s.referencia.orden));
  const errIds = opciones.map((o) => o.errorId).filter(Boolean) as string[];
  const errs = errIds.length ? await db.select().from(s.errorCatalogo).where(inArray(s.errorCatalogo.id, errIds)) : [];
  return {
    ...rv.rv,
    subareaId: rv.subareaId,
    areaId: rv.areaId,
    temaNombre: rv.tema,
    subareaNombre: rv.subarea,
    opciones,
    referencias,
    errores: Object.fromEntries(errs.map((e) => [e.id, e.recomendacion])),
  };
}

/* ───────────── Cerrar y calificar ───────────── */

export async function terminarSeccion(db: Db, intentoId: string, numero: number, d: Dueno, o: { porTiempo?: boolean } = {}) {
  const i = await intentoDe(db, intentoId, d);
  return cerrarSeccionInterna(db, i, numero, o);
}

async function cerrarSeccionInterna(db: Db, i: typeof s.intento.$inferSelect, numero: number, _o: { porTiempo?: boolean } = {}) {
  if (i.estado !== "en_curso") return { enviado: i.estado === "enviado", intentoId: i.id };
  const ahora = new Date();
  const cerradas = await db
    .update(s.seccionIntento)
    .set({ estado: "terminada", terminadaEn: ahora })
    .where(and(eq(s.seccionIntento.intentoId, i.id), eq(s.seccionIntento.numero, numero), ne(s.seccionIntento.estado, "terminada")))
    .returning();
  if (cerradas.length && i.cuentaId && i.modo === "diagnostico") {
    await otorgarPuntos(db, { cuentaId: i.cuentaId, motivo: "seccion", puntos: PUNTOS.seccion, idem: `seccion:${i.id}:${numero}`, intentoId: i.id });
    await puntosDelDia(db, i.cuentaId);
    await registrarDiaEstudiado(db, i.cuentaId);
    await darInsignia(db, i.cuentaId, "primera-seccion");
  }
  const pendientes = await db
    .select({ n: count() })
    .from(s.seccionIntento)
    .where(and(eq(s.seccionIntento.intentoId, i.id), ne(s.seccionIntento.estado, "terminada")));
  if (pendientes[0].n === 0) {
    await enviarInterno(db, i);
    return { enviado: true, intentoId: i.id };
  }
  return { enviado: false, intentoId: i.id };
}

export async function enviarIntento(db: Db, intentoId: string, d: Dueno) {
  const i = await intentoDe(db, intentoId, d);
  if (i.estado === "enviado") return i;
  return enviarInterno(db, i);
}

async function enviarInterno(db: Db, i: typeof s.intento.$inferSelect) {
  const ahora = new Date();
  const act = await db
    .update(s.intento)
    .set({ estado: "enviado", enviadoEn: ahora })
    .where(and(eq(s.intento.id, i.id), eq(s.intento.estado, "en_curso")))
    .returning();
  await db
    .update(s.seccionIntento)
    .set({ estado: "terminada", terminadaEn: ahora })
    .where(and(eq(s.seccionIntento.intentoId, i.id), ne(s.seccionIntento.estado, "terminada")));
  if (!act.length) return i; // Otro proceso ya lo envió.
  if (i.modo !== "practica") await guardarResultado(db, act[0]);
  if (i.cuentaId && i.modo === "diagnostico") await insigniasPorDiagnostico(db, i.cuentaId, i.id);
  return act[0];
}

/** Califica con diag-1 y guarda el resultado con su desglose (RF-20, RNF-06). */
export async function guardarResultado(db: Db, i: typeof s.intento.$inferSelect) {
  const filas = await db
    .select({
      reactivoId: s.itemIntento.reactivoId,
      temaId: s.reactivoVersion.temaId,
      subareaId: s.tema.subareaId,
      areaId: s.subarea.areaId,
      correcta: s.respuesta.correcta,
      errorId: s.respuesta.errorId,
    })
    .from(s.itemIntento)
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.itemIntento.reactivoId), eq(s.reactivoVersion.version, s.itemIntento.version)))
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .leftJoin(s.respuesta, and(eq(s.respuesta.intentoId, s.itemIntento.intentoId), eq(s.respuesta.orden, s.itemIntento.orden)))
    .where(eq(s.itemIntento.intentoId, i.id));
  const items: ItemCalificable[] = filas.map((f) => ({ ...f, correcta: !!f.correcta, errorId: f.correcta ? null : (f.errorId ?? null) }));
  const [pl] = i.plantillaId ? await db.select().from(s.plantilla).where(eq(s.plantilla.id, i.plantillaId)) : [];
  const u: Umbrales = pl
    ? { domina: Number(pl.umbralDomina), desarrollo: Number(pl.umbralDesarrollo), minimo: pl.minimoReportar }
    : { domina: 0.8, desarrollo: 0.5, minimo: 3 };
  const areaIds = [...new Set(items.map((x) => x.areaId))];
  const tax = await taxonomiaDe(db, areaIds);
  const r = calificar(items, tax, u);
  const nombresSub = new Map(tax.flatMap((a) => a.subareas.map((x) => [x.id, x.nombre])));
  const errIds = r.errores.map((e) => e.errorId);
  const errs = errIds.length ? await db.select().from(s.errorCatalogo).where(inArray(s.errorCatalogo.id, errIds)) : [];
  const descripcion =
    i.modo === "mini"
      ? ""
      : describir(r, i.semilla, { subarea: (id) => nombresSub.get(id) ?? id, error: (id) => errs.find((e) => e.id === id)?.descripcion ?? id });

  await db.transaction(async (tx) => {
    await tx.delete(s.resultado).where(eq(s.resultado.intentoId, i.id));
    await tx.insert(s.resultado).values({
      intentoId: i.id,
      global: r.global == null ? null : String(r.global),
      nivel: r.nivel,
      cobertura: String(r.cobertura),
      descripcion,
      versionAlgoritmo: r.versionAlgoritmo,
      versionTextos: VERSION_TEXTOS,
    });
    await tx.insert(s.resultadoArea).values(
      r.areas.map((a) => ({
        intentoId: i.id,
        areaId: a.id,
        presentados: a.presentados,
        aciertos: a.aciertos,
        dominio: (i.modo === "mini" ? a.dominioSimple : a.dominio)?.toString() ?? null,
        nivel: i.modo === "mini" ? (a.dominioSimple == null ? null : nivelSimple(a.dominioSimple, u)) : a.nivel,
      })),
    );
    await tx.insert(s.resultadoSubarea).values(
      r.subareas.map((x) => ({
        intentoId: i.id,
        subareaId: x.id,
        presentados: x.presentados,
        aciertos: x.aciertos,
        dominio: x.dominio?.toString() ?? null,
        nivel: x.nivel,
        prioridad: x.prioridad?.toString() ?? null,
        lugarPrioridad: x.lugarPrioridad,
      })),
    );
    const temas = r.temas.filter((t) => t.presentados > 0);
    if (temas.length)
      await tx.insert(s.resultadoTema).values(
        temas.map((t) => ({ intentoId: i.id, temaId: t.id, presentados: t.presentados, aciertos: t.aciertos, dominio: t.dominio?.toString() ?? null, nivel: t.nivel })),
      );
    if (r.errores.length) await tx.insert(s.errorFrecuente).values(r.errores.map((e) => ({ intentoId: i.id, errorId: e.errorId, veces: e.veces, lugar: e.lugar })));
  });
  return r;
}

function nivelSimple(d: number, u: Umbrales) {
  return d >= u.domina ? "Dominas" : d >= u.desarrollo ? "En desarrollo" : "Área de oportunidad";
}

/** Tarea programada: cierra secciones e intentos vencidos y los califica (flujos 3b y 4a). */
export async function cerrarVencidos(db: Db) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() - GRACIA_MS);
  const secciones = await db
    .select({ sec: s.seccionIntento, i: s.intento })
    .from(s.seccionIntento)
    .innerJoin(s.intento, eq(s.intento.id, s.seccionIntento.intentoId))
    .where(and(eq(s.seccionIntento.estado, "en_curso"), eq(s.intento.estado, "en_curso"), ne(s.intento.modo, "practica"), sql`${s.seccionIntento.venceEn} < ${limite}`));
  let cerradas = 0;
  for (const x of secciones) {
    await cerrarSeccionInterna(db, x.i, x.sec.numero, { porTiempo: true });
    cerradas++;
  }
  // Abandonados: 7 días sin actividad (diagnóstico) o plazo vencido.
  const viejos = await db
    .select()
    .from(s.intento)
    .where(and(eq(s.intento.estado, "en_curso"), sql`(${s.intento.venceEn} < ${limite} or ${s.intento.ultimaActividadEn} < ${new Date(ahora.getTime() - PLAZO_INTENTO_MS)})`));
  let abandonados = 0;
  for (const v of viejos) {
    const respondidas = await db.select({ n: count() }).from(s.respuesta).where(eq(s.respuesta.intentoId, v.id));
    if (v.modo === "practica" || respondidas[0].n === 0) {
      await db.update(s.intento).set({ estado: "abandonado" }).where(eq(s.intento.id, v.id));
      abandonados++;
    } else {
      await enviarInterno(db, v);
      cerradas++;
    }
  }
  // Mini diagnósticos anónimos de más de 30 días: se borran (no tienen valor aparte).
  const borrados = await db
    .delete(s.intento)
    .where(and(eq(s.intento.modo, "mini"), sql`${s.intento.cuentaId} is null`, sql`${s.intento.iniciaEn} < ${new Date(ahora.getTime() - 30 * 86400000)}`))
    .returning({ id: s.intento.id });
  return { cerradas, abandonados, anonimosBorrados: borrados.length };
}

/** Asigna a la cuenta los mini diagnósticos anónimos de las últimas 24 horas. */
export async function adoptarAnonimos(db: Db, sesionAnonimaId: string, cuentaId: string) {
  const desde = new Date(Date.now() - 86400000);
  await db
    .update(s.intento)
    .set({ cuentaId, sesionAnonimaId: null })
    .where(and(eq(s.intento.sesionAnonimaId, sesionAnonimaId), sql`${s.intento.cuentaId} is null`, gte(s.intento.iniciaEn, desde)));
}
