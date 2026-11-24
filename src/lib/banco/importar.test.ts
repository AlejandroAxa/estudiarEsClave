import { readFileSync } from "node:fs";
import { describe, expect, it, beforeAll } from "vitest";
import { migrar } from "../../../scripts/migrar";
import { importarBanco } from "./importar";
import { exportarRelease, publicarRelease } from "./publicar";
import { sembrarConfiguracion, sembrarProductos } from "../semilla";
import type { Db } from "@/db/conexion";

const banco = readFileSync("bancos/banco-semilla-medicina.json", "utf8");
let db: Db;

beforeAll(async () => {
  db = await migrar("pglite:memoria");
  await sembrarConfiguracion(db);
});

describe("importador", () => {
  it("en modo estricto rechaza el archivo si un reactivo no está validado", async () => {
    const b = JSON.parse(banco);
    b.reactivos[0].estado = "revisado_ia";
    delete b.reactivos[0].validado_por;
    const r = await importarBanco(db, JSON.stringify(b), { archivo: "sin-validar.json" });
    expect(r.aceptada).toBe(false);
    expect(r.errores[0]).toMatch(/CL-001.*validado/);
  });

  it("rechaza el archivo completo si un reactivo tiene dos correctas", async () => {
    const b = JSON.parse(banco);
    b.reactivos[0].opciones[0].correcta = true;
    const r = await importarBanco(db, JSON.stringify(b), { archivo: "malo.json", permitirSinValidar: true });
    expect(r.aceptada).toBe(false);
    expect(r.errores.join(" ")).toMatch(/CL-001.*correcta/);
  });

  it("importa en modo estricto (todo validado por docente), crea plantillas y publica un release", async () => {
    const r = await importarBanco(db, banco, { archivo: "semilla.json" });
    expect(r.errores).toEqual([]);
    expect(r.versionesNuevas).toBe(338);
    expect(r.plantillas).toContain("mini-medicina-v1");
    await sembrarProductos(db);
    const rel = await publicarRelease(db, { examenId: "EXANI-II", version: "1.0.0-dev" });
    expect(rel.reactivos).toBe(338);
  });

  it("reimportar el mismo archivo no duplica nada", async () => {
    const r = await importarBanco(db, banco, { archivo: "semilla.json", permitirSinValidar: true });
    expect(r.aceptada).toBe(true);
    expect(r.versionesNuevas).toBe(0);
  });

  it("pide subir la versión si el contenido cambió", async () => {
    const b = JSON.parse(banco);
    b.reactivos[0].enunciado += " (editado)";
    const r = await importarBanco(db, JSON.stringify(b), { archivo: "editado.json", permitirSinValidar: true });
    expect(r.aceptada).toBe(false);
    expect(r.errores.join(" ")).toMatch(/sube «version»/);
    b.reactivos[0].version = 2;
    const r2 = await importarBanco(db, JSON.stringify(b), { archivo: "editado.json", permitirSinValidar: true });
    expect(r2.versionesNuevas).toBe(1);
  });

  it("exporta el release al mismo formato y se puede volver a importar", async () => {
    const json = await exportarRelease(db, "1.0.0-dev");
    expect(json.reactivos).toHaveLength(338);
    const original = JSON.parse(banco).reactivos[5];
    const exportado = json.reactivos.find((r) => r.id === original.id)!;
    expect(exportado.opciones).toEqual(original.opciones);
    expect(exportado.rutas).toEqual(original.rutas);
    expect(exportado.referencias).toEqual(original.referencias);
    expect(json.plantillas[0].reactivos).toHaveLength(338);
  });
});
