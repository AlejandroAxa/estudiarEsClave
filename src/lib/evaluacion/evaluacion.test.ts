import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as s from "@/db/schema";
import type { Db } from "@/db/conexion";
import { alumnoDePrueba, baseDePrueba } from "@/test/preparar";
import {
  crearIntento,
  crearPractica,
  ErrorEvaluacion,
  guardarRespuesta,
  iniciarSeccion,
  itemsVisibles,
  plantillaActiva,
  seccionesDe,
  terminarSeccion,
  cerrarVencidos,
  pendientesRepaso,
} from "./evaluacion";
import { cuota, darPrueba, estadoPlan } from "../planes";
import { puntosTotales } from "../motivacion/motivacion";

let db: Db;
beforeAll(async () => {
  db = await baseDePrueba();
});

describe("mini diagnóstico anónimo", () => {
  it("arma 18 preguntas, 3 por área, sin revelar la correcta y califica por área", async () => {
    const pl = (await plantillaActiva(db, "medicina", "mini"))!;
    const anon = randomUUID();
    const i = await crearIntento(db, { plantillaId: pl.id, sesionAnonimaId: anon });
    const { items } = await itemsVisibles(db, i.id);
    expect(items).toHaveLength(18);
    expect(JSON.stringify(items)).not.toMatch(/"correcta"|"argumentacion"|"errorId"/);
    for (const it of items) await guardarRespuesta(db, { intentoId: i.id, orden: it.orden, letra: "A", idIdempotencia: randomUUID(), sesionAnonimaId: anon });
    // Otro visitante no puede responder.
    await expect(guardarRespuesta(db, { intentoId: i.id, orden: 1, letra: "B", idIdempotencia: randomUUID(), sesionAnonimaId: randomUUID() })).rejects.toBeInstanceOf(ErrorEvaluacion);
    const secs = await seccionesDe(db, i.id);
    for (const x of secs) await terminarSeccion(db, i.id, x.sec.numero, { sesionAnonimaId: anon });
    const [r] = await db.select().from(s.resultadoArea).where(eq(s.resultadoArea.intentoId, i.id));
    expect(r.presentados).toBe(3);
    const [it] = await db.select().from(s.intento).where(eq(s.intento.id, i.id));
    expect(it.estado).toBe("enviado");
  });
});

describe("diagnóstico por secciones", () => {
  it("abre una sección a la vez, guarda sin duplicar y califica al cerrar la última", async () => {
    const cuentaId = await alumnoDePrueba(db);
    const pl = (await plantillaActiva(db, "medicina", "diagnostico"))!;
    const i = await crearIntento(db, { plantillaId: pl.id, cuentaId });
    const secs = await seccionesDe(db, i.id);
    expect(secs).toHaveLength(6);
    await iniciarSeccion(db, i.id, 1, { cuentaId });
    await expect(iniciarSeccion(db, i.id, 2, { cuentaId })).rejects.toThrow(/Termina primero/);
    const { items } = await itemsVisibles(db, i.id);
    expect(items).toHaveLength(338);
    const idem = randomUUID();
    await guardarRespuesta(db, { intentoId: i.id, orden: 1, letra: "B", idIdempotencia: idem, cuentaId });
    const dup = await guardarRespuesta(db, { intentoId: i.id, orden: 1, letra: "B", idIdempotencia: idem, cuentaId });
    expect(dup.duplicada).toBe(true);
    for (const x of secs) {
      await iniciarSeccion(db, i.id, x.sec.numero, { cuentaId });
      for (const it of items.filter((y) => y.seccion === x.sec.numero)) {
        await guardarRespuesta(db, { intentoId: i.id, orden: it.orden, letra: "A", idIdempotencia: randomUUID(), cuentaId });
      }
      await terminarSeccion(db, i.id, x.sec.numero, { cuentaId });
    }
    const [res] = await db.select().from(s.resultado).where(eq(s.resultado.intentoId, i.id));
    expect(res.versionAlgoritmo).toBe("diag-1");
    expect(Number(res.cobertura)).toBe(1);
    expect(res.descripcion.length).toBeGreaterThan(20);
    const subs = await db.select().from(s.resultadoSubarea).where(eq(s.resultadoSubarea.intentoId, i.id));
    expect(subs.filter((x) => x.lugarPrioridad).length).toBeGreaterThan(0);
    expect(await puntosTotales(db, cuentaId)).toBeGreaterThanOrEqual(6 * 50);
    // El plan gratis solo tiene 1 diagnóstico en la temporada.
    await expect(crearIntento(db, { plantillaId: pl.id, cuentaId })).rejects.toThrow(/diagnóstico gratis/);
    // Después del diagnóstico, sus preguntas se abren para practicar (R9).
    const pr = await crearPractica(db, cuentaId, { subareaId: "PRE-AF" });
    const vis = await itemsVisibles(db, pr.id);
    expect(vis.items.length).toBeGreaterThan(0);
    const r = await guardarRespuesta(db, { intentoId: pr.id, orden: 1, letra: "A", idIdempotencia: randomUUID(), cuentaId });
    expect(r.retro?.letraCorrecta).toMatch(/[ABC]/);
    // Plan gratis: solo la argumentación de la elegida y la correcta.
    expect(r.retro?.bloqueadas).toBe(true);
  });

  it("la práctica está vacía antes del diagnóstico y la prueba de 3 días abre todo", async () => {
    const cuentaId = await alumnoDePrueba(db);
    await expect(crearPractica(db, cuentaId, {})).rejects.toThrow(/diagnóstico/);
    await darPrueba(db, cuentaId);
    expect((await estadoPlan(db, cuentaId)).plan).toBe("prueba");
    expect((await cuota(db, cuentaId, "practica")).cantidad).toBeNull();
  });

  it("el plan gratis corta en 15 prácticas al día", async () => {
    const cuentaId = await alumnoDePrueba(db);
    const pl = (await plantillaActiva(db, "medicina", "diagnostico"))!;
    const i = await crearIntento(db, { plantillaId: pl.id, cuentaId });
    for (const x of await seccionesDe(db, i.id)) await terminarSeccion(db, i.id, x.sec.numero, { cuentaId });
    let respondidas = 0;
    for (let k = 0; k < 3 && respondidas < 15; k++) {
      const pr = await crearPractica(db, cuentaId, {});
      const { items } = await itemsVisibles(db, pr.id);
      for (const it of items) {
        await guardarRespuesta(db, { intentoId: pr.id, orden: it.orden, letra: "C", idIdempotencia: randomUUID(), cuentaId });
        respondidas++;
      }
    }
    expect(respondidas).toBe(15);
    await expect(crearPractica(db, cuentaId, {})).rejects.toThrow(/dosis de hoy/);
    const rep = await pendientesRepaso(db, cuentaId);
    expect(rep.enEspera + rep.pendientes.length).toBeGreaterThan(0);
  });

  it("la tarea programada cierra lo vencido", async () => {
    const r = await cerrarVencidos(db);
    expect(r).toHaveProperty("cerradas");
  });
});
