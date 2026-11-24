import { readFileSync } from "node:fs";
import { describe, expect, it, beforeAll } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { migrar } from "../../../scripts/migrar";
import { importarBanco } from "./importar";
import { publicarRelease } from "./publicar";
import { sembrarConfiguracion } from "../semilla";
import { etiquetasRuta, plantillaActiva } from "../evaluacion/evaluacion";
import * as s from "@/db/schema";
import type { Db } from "@/db/conexion";

const medicina = readFileSync("bancos/banco-semilla-medicina.json", "utf8");
const exactas = readFileSync("bancos/banco-semilla-exactas.json", "utf8");
let db: Db;

beforeAll(async () => {
  db = await migrar("pglite:memoria");
  await sembrarConfiguracion(db);
  const r = await importarBanco(db, medicina, { archivo: "medicina.json", permitirSinValidar: true });
  expect(r.errores).toEqual([]);
});

describe("banco de Ciencias Exactas junto al de Medicina", () => {
  it("se importa encima sin duplicar los reactivos que comparten", async () => {
    const r = await importarBanco(db, exactas, { archivo: "exactas.json", permitirSinValidar: true });
    expect(r.errores).toEqual([]);
    expect(r.versionesNuevas).toBe(51);
    expect(r.sinCambios).toBe(63);
    expect(r.plantillas).toContain("mini-exactas-cal-fis-v1");
    expect(r.plantillas).toContain("diagnostico-exactas-cal-pye-v1");
  });

  it("publica un solo release con los dos bancos", async () => {
    const rel = await publicarRelease(db, { examenId: "EXANI-II", version: "1.0.0-dev" });
    expect(rel.reactivos).toBe(138 + 51);
  });

  it("cada ruta de Exactas tiene su diagnóstico y solo ve su módulo", async () => {
    const fis = (await plantillaActiva(db, "exactas-fis", "diagnostico"))!;
    const pye = (await plantillaActiva(db, "exactas-pye", "diagnostico"))!;
    const cuantos = async (id: string) => (await db.select().from(s.plantillaReactivo).where(eq(s.plantillaReactivo.plantillaId, id))).length;
    expect(await cuantos(fis.id)).toBe(99);
    expect(await cuantos(pye.id)).toBe(92);
    expect(await etiquetasRuta(db, "exactas-fis")).toEqual(["exactas-fis", "exactas", "todas"]);
    // Reactivos que la ruta puede ver (la práctica y el simulacro filtran con estas etiquetas).
    const visibles = await db
      .selectDistinct({ areaId: s.subarea.areaId })
      .from(s.reactivoRuta)
      .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.reactivoRuta.reactivoId), eq(s.reactivoVersion.version, s.reactivoRuta.version)))
      .innerJoin(s.tema, eq(s.tema.id, s.reactivoVersion.temaId))
      .innerJoin(s.subarea, eq(s.subarea.id, s.tema.subareaId))
      .where(inArray(s.reactivoRuta.rutaId, await etiquetasRuta(db, "exactas-fis")));
    expect(visibles.map((v) => v.areaId).sort()).toEqual(["CAL", "CL", "FIS", "PM", "RI"]);
    const med = await db.select().from(s.plantilla).where(and(eq(s.plantilla.rutaId, "medicina"), eq(s.plantilla.modo, "diagnostico")));
    expect(med).toHaveLength(1);
  });
});
