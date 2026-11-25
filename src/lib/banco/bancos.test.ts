import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it, beforeAll } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { migrar } from "../../../scripts/migrar";
import { importarBanco, VALIDADOR_DESARROLLO } from "./importar";
import { publicarRelease } from "./publicar";
import { sembrarConfiguracion } from "../semilla";
import { etiquetasRuta, plantillaActiva, poolPractica } from "../evaluacion/evaluacion";
import * as s from "@/db/schema";
import type { Db } from "@/db/conexion";

const medicina = readFileSync("bancos/banco-semilla-medicina.json", "utf8");
const exactas = readFileSync("bancos/banco-semilla-exactas.json", "utf8");
const psicologia = readFileSync("bancos/banco-semilla-psicologia.json", "utf8");
const leer = (n: string) => readFileSync(`bancos/banco-semilla-${n}.json`, "utf8");
/** Bancos EPIU de la BUAP en el orden en que se importan: el segundo de cada par reusa el módulo general del primero. */
const EPIU = [
  ["epiu-economico-administrativas", 200, 63],
  ["epiu-sociales-humanidades", 100, 163],
  ["epiu-naturales-salud", 200, 63],
  ["epiu-ingenierias-exactas", 100, 163],
] as const;
let db: Db;

/** Áreas que una ruta puede ver (la práctica y los simulacros filtran con estas etiquetas). */
async function areasVisibles(rutaId: string) {
  const filas = await db
    .selectDistinct({ areaId: s.subarea.areaId })
    .from(s.reactivoRuta)
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.reactivoRuta.reactivoId), eq(s.reactivoVersion.version, s.reactivoRuta.version)))
    .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
    .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
    .where(inArray(s.reactivoRuta.rutaId, await etiquetasRuta(db, rutaId)));
  return filas.map((f) => f.areaId).sort();
}

const cuantos = async (plantillaId: string) => (await db.select().from(s.plantillaReactivo).where(eq(s.plantillaReactivo.plantillaId, plantillaId))).length;

beforeAll(async () => {
  db = await migrar("pglite:memoria");
  await sembrarConfiguracion(db);
  // Una base que ya tenía una parte del banco de Medicina importada «SIN VALIDAR».
  const viejo = JSON.parse(medicina);
  viejo.reactivos = viejo.reactivos.slice(0, 40);
  viejo.plantillas = [];
  for (const r of viejo.reactivos) {
    r.estado = "revisado_ia";
    delete r.validado_por;
    delete r.validado_en;
  }
  const r = await importarBanco(db, JSON.stringify(viejo), { archivo: "viejo.json", permitirSinValidar: true });
  expect(r.errores).toEqual([]);
});

describe("bancos de Medicina, Ciencias Exactas, Psicología, EPIU e Inglés", () => {
  it("Medicina validada pone el visto bueno docente a lo que estaba sin validar", async () => {
    const r = await importarBanco(db, medicina, { archivo: "medicina.json" });
    expect(r.errores).toEqual([]);
    expect(r.versionesNuevas).toBe(298);
    expect(r.validadasAhora).toBe(40);
    const sinValidar = await db.select().from(s.reactivoVersion).where(eq(s.reactivoVersion.validadoPor, VALIDADOR_DESARROLLO));
    expect(sinValidar).toHaveLength(0);
  });

  it("Exactas y Psicología se importan encima sin duplicar los reactivos compartidos", async () => {
    const e = await importarBanco(db, exactas, { archivo: "exactas.json" });
    expect(e.errores).toEqual([]);
    expect([e.versionesNuevas, e.sinCambios]).toEqual([51, 63]);
    const p = await importarBanco(db, psicologia, { archivo: "psicologia.json" });
    expect(p.errores).toEqual([]);
    expect([p.versionesNuevas, p.sinCambios]).toEqual([100, 63]);
    expect(p.plantillas).toContain("mini-psicologia-v1");
  });

  it("los cuatro bancos EPIU e Inglés se importan validados y sin duplicar lo compartido", async () => {
    for (const [banco, nuevas, iguales] of EPIU) {
      const r = await importarBanco(db, leer(banco), { archivo: `${banco}.json` });
      expect(r.errores).toEqual([]);
      expect([r.versionesNuevas, r.sinCambios]).toEqual([nuevas, iguales]);
      expect(r.plantillas).toContain(`mini-${banco}-v1`);
    }
    const i = await importarBanco(db, leer("ingles"), { archivo: "ingles.json" });
    expect(i.errores).toEqual([]);
    expect(i.versionesNuevas).toBe(100);
    const [ing] = await db.select().from(s.area).where(eq(s.area.id, "ING"));
    expect(ing.cuentaPuntaje).toBe(false);
  });

  it("publica un solo release con todos los bancos", async () => {
    const rel = await publicarRelease(db, { examenId: "EXANI-II", version: "1.0.0-dev" });
    expect(rel.reactivos).toBe(338 + 51 + 100 + 600 + 100);
  });

  it("cada ruta tiene su diagnóstico y solo ve sus módulos", async () => {
    const fis = (await plantillaActiva(db, "exactas-fis", "diagnostico"))!;
    const pye = (await plantillaActiva(db, "exactas-pye", "diagnostico"))!;
    const psi = (await plantillaActiva(db, "psicologia", "diagnostico"))!;
    expect(await cuantos(fis.id)).toBe(49);
    expect(await cuantos(pye.id)).toBe(45);
    expect(await cuantos(psi.id)).toBe(43);
    // Inglés (diagnóstico, no cuenta) es común a todas las rutas y va a Práctica.
    expect(await areasVisibles("exactas-fis")).toEqual(["CAL", "CL", "FIS", "ING", "PM", "RI"]);
    expect(await areasVisibles("psicologia")).toEqual(["CL", "ING", "PM", "PSI", "RI"]);
    expect(await areasVisibles("medicina")).toEqual(["BIO", "CL", "ING", "PM", "PRE", "QUI", "RI"]);
    // Cada área EPIU ve su módulo general (Sociales o Experimentales) y su módulo de área, nada más.
    expect(await areasVisibles("epiu-economico-administrativas")).toEqual(["CEA", "CL", "CSO", "ING", "PM", "RI"]);
    expect(await areasVisibles("epiu-sociales-humanidades")).toEqual(["CL", "CSH", "CSO", "ING", "PM", "RI"]);
    expect(await areasVisibles("epiu-naturales-salud")).toEqual(["CEX", "CL", "CNS", "ING", "PM", "RI"]);
    expect(await areasVisibles("epiu-ingenierias-exactas")).toEqual(["CEX", "CL", "ICE", "ING", "PM", "RI"]);
    for (const [banco] of EPIU) {
      const d = (await plantillaActiva(db, banco, "diagnostico"))!;
      expect(await cuantos(d.id)).toBeGreaterThanOrEqual(55);
      expect(await cuantos(d.id)).toBeLessThanOrEqual(56);
    }
    // El diagnóstico es una muestra: el resto del banco queda para Práctica desde el primer día.
    await db.insert(s.cuenta).values({ id: "c-nueva", email: "nueva@ejemplo.mx", name: "nueva" });
    for (const [rutaId, minimo] of [["medicina", 300], ["exactas-fis", 140], ["exactas-pye", 140], ["psicologia", 200], ...EPIU.map(([b]) => [b, 300] as const)] as const) {
      const { items } = await poolPractica(db, "c-nueva", rutaId, {});
      expect(items.length).toBeGreaterThanOrEqual(minimo);
    }
    const [ruta] = await db.select().from(s.ruta).where(eq(s.ruta.id, "psicologia"));
    expect(ruta.nombre).toBe("Psicología");
  });
});

/** JSON con las llaves ordenadas: dos bancos pueden escribir los campos en distinto orden. */
const canonico = (v: unknown) =>
  JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([p], [q]) => p.localeCompare(q))) : x));

describe("contenido de los bancos", () => {
  const archivos = readdirSync("bancos").filter((f) => /^banco-semilla-.+\.json$/.test(f));
  const bancos = archivos.map((f) => [f, JSON.parse(readFileSync(`bancos/${f}`, "utf8"))] as const);

  it("todos los reactivos tienen el visto bueno docente", () => {
    for (const [, b] of bancos)
      for (const r of b.reactivos) expect([r.id, r.estado, !!r.validado_por, !!r.validado_en]).toEqual([r.id, "validado", true, true]);
  });

  it("un id compartido entre bancos tiene el mismo contenido, y no hay enunciados repetidos nuevos", () => {
    const porId = new Map<string, string>();
    const porEnunciado = new Map<string, Set<string>>();
    for (const [f, b] of bancos)
      for (const r of b.reactivos) {
        const k = canonico(r);
        if (porId.has(r.id)) expect([f, r.id, porId.get(r.id) === k]).toEqual([f, r.id, true]);
        porId.set(r.id, k);
        const e = r.enunciado.trim().toLowerCase();
        porEnunciado.set(e, (porEnunciado.get(e) ?? new Set()).add(r.id));
      }
    const repetidos = [...porEnunciado.values()].filter((x) => x.size > 1).map((x) => [...x].sort().join("="));
    // Preguntas genéricas con opciones distintas («Elige la oración correcta») o sobre textos distintos.
    expect(repetidos.sort()).toEqual(["ING-036=ING-046", "PRE-068=PSI-001", "RI-011=RI-018"]);
  });
});
