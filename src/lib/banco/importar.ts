/**
 * Importación de bancos (RF-06, RF-09, D10). Valida el archivo completo y lo
 * rechaza entero si una sola regla falla. Reimportar crea versiones nuevas
 * sin tocar las publicadas.
 */
import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/conexion";
import * as s from "@/db/schema";
import { erroresFormula } from "@/lib/formulas";
import { analizar } from "@/lib/figura";
import { bancoJson, GRUPOS_RUTA, RUTAS_CONOCIDAS, type BancoJson, type ReactivoJson } from "./formato";

export const VALIDADOR_DESARROLLO = "SIN VALIDAR (solo desarrollo)";

export interface OpcionesImportacion {
  archivo: string;
  ejecutadaPor?: string | null;
  /**
   * Acepta reactivos en `revisado_ia` y los marca como validados por
   * «SIN VALIDAR (solo desarrollo)». Nunca se permite en producción.
   */
  permitirSinValidar?: boolean;
}

export interface ResultadoImportacion {
  aceptada: boolean;
  importacionId: string;
  versionesNuevas: number;
  sinCambios: number;
  errores: string[];
  plantillas: string[];
}

export function checksum(texto: string) {
  return createHash("sha256").update(texto).digest("hex");
}

const hoy = () => new Date().toISOString().slice(0, 10);

/** Reglas RF-09 y D1 a D3, D10, D22. Devuelve la lista de errores (vacía si todo está bien). */
export function validarBanco(banco: BancoJson, permitirSinValidar: boolean): string[] {
  const errores: string[] = [];
  const areas = new Map(banco.taxonomia.map((a) => [a.id, a]));
  const subareas = new Map(banco.taxonomia.flatMap((a) => a.subareas.map((x) => [x.id, { ...x, areaId: a.id }] as const)));
  const temas = new Map(
    banco.taxonomia.flatMap((a) => a.subareas.flatMap((x) => x.temas.map((t) => [t.id, { ...t, subareaId: x.id }] as const))),
  );
  const catalogo = new Set(banco.errores.map((e) => e.id));
  const textos = new Set(banco.textos.map((t) => t.id));
  const vistos = new Set<string>();
  const examenes = new Set(banco.reactivos.map((r) => r.examen ?? banco.meta.examen).filter(Boolean));
  if (examenes.size !== 1) errores.push(`El banco debe ser de un solo examen (encontré: ${[...examenes].join(", ") || "ninguno"}).`);

  for (const r of banco.reactivos) {
    const p = `${r.id} v${r.version}`;
    if (vistos.has(r.id)) errores.push(`${p}: el id está repetido en el archivo.`);
    vistos.add(r.id);
    if (!areas.has(r.area)) errores.push(`${p}: el área ${r.area} no está en la taxonomía.`);
    const sub = subareas.get(r.subarea);
    if (!sub) errores.push(`${p}: la subárea ${r.subarea} no está en la taxonomía.`);
    else if (sub.areaId !== r.area) errores.push(`${p}: la subárea ${r.subarea} no pertenece al área ${r.area}.`);
    const t = temas.get(r.tema);
    if (!t) errores.push(`${p}: el tema ${r.tema} no está en la taxonomía.`);
    else if (t.subareaId !== r.subarea) errores.push(`${p}: el tema ${r.tema} no pertenece a la subárea ${r.subarea}.`);
    if (r.texto_id && !textos.has(r.texto_id)) errores.push(`${p}: el texto ${r.texto_id} no existe.`);

    // RF-09 / D3
    if (r.opciones.length !== 3) errores.push(`${p}: debe tener 3 opciones (tiene ${r.opciones.length}).`);
    const ids = new Set(r.opciones.map((o) => o.id));
    if (ids.size !== r.opciones.length) errores.push(`${p}: hay letras de opción repetidas.`);
    const correctas = r.opciones.filter((o) => o.correcta);
    if (correctas.length !== 1) errores.push(`${p}: debe tener exactamente una opción correcta (tiene ${correctas.length}).`);
    for (const o of r.opciones) {
      if (o.correcta && o.error_id) errores.push(`${p}: la opción correcta ${o.id} no debe tener error_id.`);
      if (!o.correcta && !o.error_id) errores.push(`${p}: el distractor ${o.id} no tiene error_id.`);
      if (!o.correcta && o.error_id && !catalogo.has(o.error_id)) errores.push(`${p}: el error ${o.error_id} no está en el catálogo.`);
      if (!o.argumentacion.trim()) errores.push(`${p}: la opción ${o.id} no tiene argumentación.`);
    }

    // Fórmulas: si KaTeX no puede componer una, se rechaza el archivo.
    const textosReactivo = [
      r.enunciado,
      r.explicacion,
      ...r.opciones.flatMap((o) => [o.texto, o.argumentacion]),
      ...(r.datos ?? []).flatMap((d) => ["$" + d.tex + "$", d.desc]),
    ];
    for (const e of textosReactivo.flatMap(erroresFormula)) errores.push(`${p}: fórmula inválida ${e}`);
    if (r.figura) {
      try {
        const f = analizar(r.figura.f);
        if (!Number.isFinite(f((r.figura.dominio[0] + r.figura.dominio[1]) / 2))) throw new Error("no da un número en el dominio");
      } catch (e) {
        errores.push(`${p}: la función de la figura no es válida (${(e as Error).message}).`);
      }
    }

    // D10
    const validado = ["validado", "publicado"].includes(r.estado) && r.validado_por && r.validado_en;
    if (!validado) {
      if (!(permitirSinValidar && ["revisado_ia", "validado", "publicado"].includes(r.estado))) {
        errores.push(`${p}: solo se importan reactivos en estado «validado» con validado_por y validado_en (está en «${r.estado}»).`);
      }
    }
  }

  for (const pl of banco.plantillas) {
    for (const rid of pl.reactivos) if (!vistos.has(rid)) errores.push(`Plantilla ${pl.id}: el reactivo ${rid} no está en el banco.`);
    if (!(pl.umbrales.en_desarrollo > 0 && pl.umbrales.en_desarrollo < pl.umbrales.domina && pl.umbrales.domina <= 1)) {
      errores.push(`Plantilla ${pl.id}: los umbrales no cumplen 0 < desarrollo < domina ≤ 1.`);
    }
  }
  return errores;
}

/** JSON con las llaves ordenadas: jsonb de Postgres no conserva el orden original. */
function canonico(v: unknown): string {
  return JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([p], [q]) => p.localeCompare(q))) : x,
  );
}

function mismoContenido(a: ReactivoJson, b: ReactivoJson) {
  const limpio = (r: ReactivoJson) =>
    canonico([r.tema, r.texto_id, r.enunciado, r.explicacion, r.opciones, r.referencias, r.dificultad_estimada, r.formato, r.datos ?? null, r.figura ?? null, r.smiles ?? null]);
  return limpio(a) === limpio(b);
}

/** Rutas reales del examen y sus etiquetas (la propia y sus grupos). */
function rutasDelBanco(banco: BancoJson, examenId: string) {
  const etiquetas = new Set(banco.reactivos.flatMap((r) => r.rutas));
  const definidas = new Map((banco.rutas ?? []).map((r) => [r.id, r]));
  const filas: (typeof s.ruta.$inferInsert)[] = [];
  for (const e of etiquetas) {
    if (GRUPOS_RUTA[e]) {
      filas.push({ id: e, examenId, nombre: GRUPOS_RUTA[e], grupos: "", esGrupo: true });
      continue;
    }
    const d = definidas.get(e);
    const k = RUTAS_CONOCIDAS[e];
    filas.push({
      id: e,
      examenId,
      nombre: d?.nombre ?? k?.nombre ?? e,
      grupos: (d?.grupos ?? k?.grupos ?? ["todas"]).join(","),
      carrera: d?.carrera ?? k?.carrera ?? null,
      esGrupo: false,
    });
  }
  return filas;
}

/** Arma el tiempo de cada sección en proporción al tiempo estimado de sus reactivos. */
function tiemposPorSeccion(reactivos: ReactivoJson[], areasOrden: string[], totalMin: number) {
  const est = new Map<string, number>();
  for (const r of reactivos) est.set(r.area, (est.get(r.area) ?? 0) + r.tiempo_estimado_seg);
  const total = [...est.values()].reduce((a, b) => a + b, 0) || 1;
  return areasOrden
    .filter((a) => est.has(a))
    .map((a) => ({ area: a, min: Math.max(5, Math.ceil((totalMin * est.get(a)!) / total)) }));
}

/** Plantillas derivadas: mini (3 por área), muestra de 20 min (2 por área) y simulacro completo. */
export function plantillasDerivadas(banco: BancoJson, base: BancoJson["plantillas"][number]) {
  const porId = new Map(banco.reactivos.map((r) => [r.id, r]));
  const items = base.reactivos.map((id) => porId.get(id)!).filter(Boolean);
  const porArea = new Map<string, ReactivoJson[]>();
  for (const r of items) (porArea.get(r.area) ?? porArea.set(r.area, []).get(r.area)!).push(r);
  // Elección determinista y equilibrada: un reactivo de cada dificultad si existe, luego por orden.
  const tomar = (lista: ReactivoJson[], n: number) => {
    const elegidos: ReactivoJson[] = [];
    for (const d of [1, 2, 3]) {
      const r = lista.find((x) => x.dificultad_estimada === d && !elegidos.includes(x) && !x.texto_id);
      if (r && elegidos.length < n) elegidos.push(r);
    }
    for (const r of lista) if (elegidos.length < n && !elegidos.includes(r)) elegidos.push(r);
    return elegidos;
  };
  const raiz = base.id.replace(/^diagnostico-/, "").replace(/-v\d+$/, "");
  const sufijo = base.id.match(/-v\d+$/)?.[0] ?? "-v1";
  const mini = [...porArea.values()].flatMap((l) => tomar(l, 3)).map((r) => r.id);
  const muestra = [...porArea.values()].flatMap((l) => tomar(l, 2)).map((r) => r.id);
  return [
    { ...base, id: `mini-${raiz}${sufijo}`, nombre: `Mini diagnóstico — ${raiz}`, modo: "mini" as const, reactivos: mini, tiempo_limite_min: 20 },
    {
      ...base,
      id: `muestra-${raiz}${sufijo}`,
      nombre: `Simulacro de muestra (20 min) — ${raiz}`,
      modo: "muestra" as const,
      reactivos: muestra,
      tiempo_limite_min: 20,
    },
    { ...base, id: `simulacro-${raiz}${sufijo}`, nombre: `Simulacro completo — ${raiz}`, modo: "simulacro" as const },
  ];
}

export async function importarBanco(db: Db, contenido: string, op: OpcionesImportacion): Promise<ResultadoImportacion> {
  const suma = checksum(contenido);
  const registrar = async (estado: "aceptada" | "rechazada", errores: string[], versiones = 0, banco = "desconocido") => {
    const [fila] = await db
      .insert(s.importacion)
      .values({
        ejecutadaPor: op.ejecutadaPor ?? null,
        banco,
        archivo: op.archivo.slice(0, 200),
        checksum: suma,
        estado,
        versionesNuevas: versiones,
        errores: errores.length ? errores.join("\n") : null,
      })
      .returning({ id: s.importacion.id });
    return fila.id;
  };

  if (op.permitirSinValidar && process.env.VERCEL_ENV === "production") {
    throw new Error("La importación sin validar solo existe en desarrollo y vistas previas.");
  }

  let banco: BancoJson;
  try {
    const parsed = bancoJson.safeParse(JSON.parse(contenido));
    if (!parsed.success) {
      const errores = parsed.error.issues.slice(0, 50).map((i) => `${i.path.join(".")}: ${i.message}`);
      const id = await registrar("rechazada", errores);
      return { aceptada: false, importacionId: id, versionesNuevas: 0, sinCambios: 0, errores, plantillas: [] };
    }
    banco = parsed.data;
  } catch (e) {
    const errores = [`El archivo no es JSON válido: ${(e as Error).message}`];
    const id = await registrar("rechazada", errores);
    return { aceptada: false, importacionId: id, versionesNuevas: 0, sinCambios: 0, errores, plantillas: [] };
  }

  const ya = await db
    .select({ id: s.importacion.id })
    .from(s.importacion)
    .where(and(eq(s.importacion.checksum, suma), eq(s.importacion.estado, "aceptada")));
  if (ya.length) {
    return { aceptada: true, importacionId: ya[0].id, versionesNuevas: 0, sinCambios: banco.reactivos.length, errores: [], plantillas: [] };
  }

  const errores = validarBanco(banco, !!op.permitirSinValidar);
  const examenId = (banco.reactivos[0].examen ?? banco.meta.examen)!;

  // Contra la base: una versión que ya existe debe ser idéntica; si cambió, debe subir de versión.
  const existentes = await db
    .select()
    .from(s.reactivoVersion)
    .where(
      inArray(
        s.reactivoVersion.reactivoId,
        banco.reactivos.map((r) => r.id),
      ),
    );
  const opcionesExistentes = existentes.length
    ? await db
        .select()
        .from(s.opcion)
        .where(
          inArray(
            s.opcion.reactivoId,
            existentes.map((e) => e.reactivoId),
          ),
        )
    : [];
  const nuevas: ReactivoJson[] = [];
  let sinCambios = 0;
  for (const r of banco.reactivos) {
    const mismas = existentes.filter((e) => e.reactivoId === r.id);
    const igual = mismas.find((e) => e.version === r.version);
    const maxima = Math.max(0, ...mismas.map((e) => e.version));
    if (igual) {
      const ops = opcionesExistentes
        .filter((o) => o.reactivoId === r.id && o.version === r.version)
        .sort((a, b) => a.opcionId.localeCompare(b.opcionId))
        .map((o) => ({ id: o.opcionId.trim(), texto: o.texto, correcta: o.correcta, argumentacion: o.argumentacion, error_id: o.errorId }));
      const previo = { ...r, tema: igual.temaId, texto_id: igual.textoId, enunciado: igual.enunciado, explicacion: igual.explicacion, opciones: ops, datos: igual.datos ?? undefined, figura: igual.figura ?? undefined, smiles: igual.smiles ?? undefined };
      const actual = { ...r, opciones: [...r.opciones].sort((a, b) => a.id.localeCompare(b.id)) };
      if (!mismoContenido(previo as ReactivoJson, { ...actual, referencias: previo.referencias } as ReactivoJson)) {
        errores.push(`${r.id} v${r.version}: ya existe con otro contenido; sube «version» para publicar el cambio.`);
      } else sinCambios++;
    } else if (r.version < maxima) {
      errores.push(`${r.id}: la versión ${r.version} es menor que la ya importada (${maxima}).`);
    } else nuevas.push(r);
  }

  if (errores.length) {
    const id = await registrar("rechazada", errores, 0, banco.meta.nombre);
    return { aceptada: false, importacionId: id, versionesNuevas: 0, sinCambios: 0, errores, plantillas: [] };
  }

  const plantillasCreadas: string[] = [];
  const importacionId = await db.transaction(async (tx) => {
    const [imp] = await tx
      .insert(s.importacion)
      .values({
        ejecutadaPor: op.ejecutadaPor ?? null,
        banco: banco.meta.nombre,
        archivo: op.archivo.slice(0, 200),
        checksum: suma,
        estado: "aceptada",
        versionesNuevas: nuevas.length,
      })
      .returning({ id: s.importacion.id });

    await tx
      .insert(s.examen)
      .values({ id: examenId, nombre: banco.meta.examen_nombre ?? examenId, nivel: banco.meta.nivel ?? (examenId === "EXANI-I" ? "prepa" : "licenciatura") })
      .onConflictDoNothing();

    for (const [ia, a] of banco.taxonomia.entries()) {
      await tx
        .insert(s.area)
        .values({ id: a.id, examenId, nombre: a.nombre, tipo: a.tipo, cuentaPuntaje: a.cuenta_puntaje, orden: ia })
        .onConflictDoUpdate({ target: s.area.id, set: { nombre: a.nombre, tipo: a.tipo, cuentaPuntaje: a.cuenta_puntaje, orden: ia } });
      for (const [is, sa] of a.subareas.entries()) {
        await tx
          .insert(s.subarea)
          .values({ id: sa.id, areaId: a.id, nombre: sa.nombre, reactivosExamen: sa.reactivos_examen, orden: is })
          .onConflictDoUpdate({ target: s.subarea.id, set: { nombre: sa.nombre, reactivosExamen: sa.reactivos_examen, orden: is } });
        for (const [it, t] of sa.temas.entries()) {
          await tx
            .insert(s.tema)
            .values({ id: t.id, subareaId: sa.id, nombre: t.nombre, orden: it })
            .onConflictDoUpdate({ target: s.tema.id, set: { nombre: t.nombre, orden: it } });
        }
      }
    }
    const areaIds = new Set(banco.taxonomia.map((a) => a.id));
    for (const e of banco.errores) {
      const areaId = e.area && areaIds.has(e.area) ? e.area : null;
      await tx
        .insert(s.errorCatalogo)
        .values({ id: e.id, areaId, descripcion: e.descripcion, recomendacion: e.recomendacion })
        .onConflictDoUpdate({ target: s.errorCatalogo.id, set: { areaId, descripcion: e.descripcion, recomendacion: e.recomendacion } });
    }
    for (const t of banco.textos) {
      const esVerso = !!t.versos?.length;
      const cuerpo = (esVerso ? t.versos! : t.parrafos!).join("\n\n");
      const v = { ambito: t.ambito, tipoTexto: t.tipo_texto, titulo: t.titulo, cuerpo, esVerso, autoria: t.autoria ?? null };
      await tx.insert(s.texto).values({ id: t.id, ...v }).onConflictDoUpdate({ target: s.texto.id, set: v });
    }
    for (const r of rutasDelBanco(banco, examenId)) {
      await tx.insert(s.ruta).values(r).onConflictDoNothing();
    }

    for (const r of nuevas) {
      await tx.insert(s.reactivo).values({ id: r.id }).onConflictDoNothing();
      const sinValidar = !(r.validado_por && r.validado_en);
      await tx.insert(s.reactivoVersion).values({
        reactivoId: r.id,
        version: r.version,
        temaId: r.tema,
        textoId: r.texto_id,
        importacionId: imp.id,
        origen: r.origen ?? (r.estado === "revisado_ia" ? "ia" : "humano"),
        validadoPor: sinValidar ? VALIDADOR_DESARROLLO : r.validado_por!,
        validadoEn: sinValidar ? hoy() : r.validado_en!,
        habilidad: r.habilidad,
        dificultadEstimada: r.dificultad_estimada,
        formato: r.formato,
        enunciado: r.enunciado,
        explicacion: r.explicacion,
        tiempoEstimadoSeg: r.tiempo_estimado_seg,
        estado: "validado",
        revision: r.revision ?? null,
        datos: r.datos ?? null,
        figura: r.figura ?? null,
        smiles: r.smiles ?? null,
      });
      await tx.insert(s.opcion).values(
        r.opciones.map((o) => ({
          reactivoId: r.id,
          version: r.version,
          opcionId: o.id,
          texto: o.texto,
          correcta: o.correcta,
          argumentacion: o.argumentacion,
          errorId: o.correcta ? null : o.error_id,
        })),
      );
      if (r.referencias.length) {
        await tx
          .insert(s.referencia)
          .values(r.referencias.map((x, i) => ({ reactivoId: r.id, version: r.version, orden: i + 1, fuente: x.fuente, ubicacion: x.ubicacion })));
      }
      await tx.insert(s.reactivoRuta).values(r.rutas.map((rutaId) => ({ reactivoId: r.id, version: r.version, rutaId })));
    }

    // Plantillas: las del archivo y sus derivadas (mini, muestra y simulacro).
    const porId = new Map(banco.reactivos.map((r) => [r.id, r]));
    const ordenAreas = banco.taxonomia.map((a) => a.id);
    const todas = banco.plantillas.flatMap((p) => [{ ...p, modo: p.modo ?? ("diagnostico" as const) }, ...((p.modo ?? "diagnostico") === "diagnostico" ? plantillasDerivadas(banco, p) : [])]);
    for (const p of todas) {
      const items = p.reactivos.map((id) => porId.get(id)!);
      const rutaReal =
        p.ruta ?? [...new Set(items.flatMap((r) => r.rutas))].find((x) => !GRUPOS_RUTA[x]) ?? Object.keys(RUTAS_CONOCIDAS)[0];
      const modo = p.modo ?? "diagnostico";
      const v = {
        rutaId: rutaReal,
        nombre: p.nombre,
        modo,
        tiempoLimiteMin: p.tiempo_limite_min,
        umbralDomina: String(p.umbrales.domina),
        umbralDesarrollo: String(p.umbrales.en_desarrollo),
        minimoReportar: p.minimo_reactivos_para_reportar,
        familiaEquivalencia: p.familia_equivalencia ?? p.id.replace(/-v\d+$/, ""),
        cronometroGlobal: modo === "simulacro" || modo === "muestra" || modo === "mini",
        notas: p.notas ?? null,
        activa: true,
      };
      await tx.insert(s.plantilla).values({ id: p.id, ...v }).onConflictDoUpdate({ target: s.plantilla.id, set: v });
      await tx.delete(s.plantillaReactivo).where(eq(s.plantillaReactivo.plantillaId, p.id));
      await tx.delete(s.plantillaSeccion).where(eq(s.plantillaSeccion.plantillaId, p.id));
      const secciones = tiemposPorSeccion(items, ordenAreas, p.tiempo_limite_min);
      await tx
        .insert(s.plantillaSeccion)
        .values(secciones.map((x, i) => ({ plantillaId: p.id, numero: i + 1, areaId: x.area, tiempoLimiteMin: x.min })));
      const numSeccion = new Map(secciones.map((x, i) => [x.area, i + 1]));
      // D15: cada ítem cae en la sección de su área; el orden sigue la sección.
      const ordenados = [...items].sort((a, b) => numSeccion.get(a.area)! - numSeccion.get(b.area)!);
      await tx.insert(s.plantillaReactivo).values(
        ordenados.map((r, i) => ({ plantillaId: p.id, reactivoId: r.id, seccion: numSeccion.get(r.area)!, orden: i + 1 })),
      );
      plantillasCreadas.push(p.id);
    }

    await tx.insert(s.auditoria).values({ actorId: op.ejecutadaPor ?? null, accion: "importar_banco", entidad: "importacion", entidadId: imp.id });
    return imp.id;
  });

  return { aceptada: true, importacionId, versionesNuevas: nuevas.length, sinCambios, errores: [], plantillas: plantillasCreadas };
}
