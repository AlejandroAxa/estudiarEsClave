import { readFileSync } from "node:fs";
import { describe, expect, it, beforeAll } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { migrar } from "../../../scripts/migrar";
import { importarBanco, VALIDADOR_DESARROLLO } from "./importar";
import { publicarRelease } from "./publicar";
import { sembrarConfiguracion } from "../semilla";
import { etiquetasRuta, plantillaActiva } from "../evaluacion/evaluacion";
import * as s from "@/db/schema";
import type { Db } from "@/db/conexion";

const medicina = readFileSync("bancos/banco-semilla-medicina.json", "utf8");
const exactas = readFileSync("bancos/banco-semilla-exactas.json", "utf8");
const psicologia = readFileSync("bancos/banco-semilla-psicologia.json", "utf8");
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

describe("bancos de Medicina, Ciencias Exactas y Psicología", () => {
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

  it("publica un solo release con los tres bancos", async () => {
    const rel = await publicarRelease(db, { examenId: "EXANI-II", version: "1.0.0-dev" });
    expect(rel.reactivos).toBe(338 + 51 + 100);
  });

  it("cada ruta tiene su diagnóstico y solo ve sus módulos", async () => {
    const fis = (await plantillaActiva(db, "exactas-fis", "diagnostico"))!;
    const pye = (await plantillaActiva(db, "exactas-pye", "diagnostico"))!;
    const psi = (await plantillaActiva(db, "psicologia", "diagnostico"))!;
    expect(await cuantos(fis.id)).toBe(99);
    expect(await cuantos(pye.id)).toBe(92);
    expect(await cuantos(psi.id)).toBe(163);
    expect(await areasVisibles("exactas-fis")).toEqual(["CAL", "CL", "FIS", "PM", "RI"]);
    expect(await areasVisibles("psicologia")).toEqual(["CL", "PM", "PSI", "RI"]);
    expect(await areasVisibles("medicina")).toEqual(["BIO", "CL", "PM", "PRE", "QUI", "RI"]);
    const [ruta] = await db.select().from(s.ruta).where(eq(s.ruta.id, "psicologia"));
    expect(ruta.nombre).toBe("Psicología");
  });
});
