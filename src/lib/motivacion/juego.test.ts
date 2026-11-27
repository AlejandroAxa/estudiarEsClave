import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import * as s from "@/db/schema";
import type { Db } from "@/db/conexion";
import { alumnoDePrueba, baseDePrueba } from "@/test/preparar";
import { crearIntento, crearPractica, guardarRespuesta, itemsVisibles, plantillaActiva, seccionesDe, terminarSeccion } from "../evaluacion/evaluacion";
import { darPrueba } from "../planes";
import { bonoRacha, nivelMedalla } from "./motivacion";

let db: Db;
beforeAll(async () => {
  db = await baseDePrueba();
});

/** Letra que se muestra para la opción correcta de un ítem de práctica. */
async function letraCorrecta(intentoId: string, orden: number) {
  const [it] = await db.select().from(s.itemIntento).where(and(eq(s.itemIntento.intentoId, intentoId), eq(s.itemIntento.orden, orden)));
  const [ok] = await db
    .select()
    .from(s.opcion)
    .where(and(eq(s.opcion.reactivoId, it.reactivoId), eq(s.opcion.version, it.version), eq(s.opcion.correcta, true)));
  const pos = it.ordenOpciones.indexOf(ok.opcionId.trim());
  return (["A", "B", "C"] as const)[pos];
}
const otra = (l: "A" | "B" | "C") => (l === "A" ? "B" : "A");

describe("racha de aciertos y medallas por materia", () => {
  it("bonos y niveles", () => {
    expect(bonoRacha(3)).toBe(5);
    expect(bonoRacha(4)).toBe(0);
    expect(bonoRacha(30)).toBe(50);
    expect(nivelMedalla(1)).toBe("bronce");
    expect(nivelMedalla(5)).toBe("diamante");
  });

  it("la racha sube con cada acierto, se reinicia con un error y cada 10 aciertos de una materia dan medalla", async () => {
    const cuentaId = await alumnoDePrueba(db);
    await darPrueba(db, cuentaId);
    const pl = (await plantillaActiva(db, "medicina", "diagnostico"))!;
    const d = await crearIntento(db, { plantillaId: pl.id, cuentaId });
    for (const x of await seccionesDe(db, d.id)) await terminarSeccion(db, d.id, x.sec.numero, { cuentaId });

    let racha = 0;
    let aciertos = 0;
    let medalla = 0;
    let fallo = false;
    for (let k = 0; k < 4 && aciertos < 10; k++) {
      const pr = await crearPractica(db, cuentaId, { subareaId: "PRE-AF" });
      const { items } = await itemsVisibles(db, pr.id);
      for (const it of items) {
        const bien = await letraCorrecta(pr.id, it.orden);
        // Una sola falla a la tercera respuesta para ver que la racha se reinicia.
        const letra = !fallo && aciertos === 2 ? otra(bien) : bien;
        const r = await guardarRespuesta(db, { intentoId: pr.id, orden: it.orden, letra, idIdempotencia: randomUUID(), cuentaId });
        const j = r.retro!.juego!;
        expect(j.materia.length).toBeGreaterThan(0);
        if (letra === bien) {
          racha++;
          aciertos++;
          expect(j.racha).toBe(racha);
          if (racha === 3) expect(j.bonoRacha).toBe(5);
          if (j.medallaNueva) medalla = j.medallaNueva;
        } else {
          fallo = true;
          racha = 0;
          expect(j.racha).toBe(0);
          expect(j.mejorRacha).toBe(2);
        }
        if (aciertos >= 10) break;
      }
    }
    expect(aciertos).toBe(10);
    expect(medalla).toBe(1);
    const [liga] = await db.select().from(s.clasificacionSemanal).where(eq(s.clasificacionSemanal.cuentaId, cuentaId));
    expect(liga.mejorRachaAciertos).toBe(racha);
    const medallas = await db.select().from(s.eventoPuntos).where(eq(s.eventoPuntos.idIdempotencia, `medalla:${cuentaId}:PRE-AF:1`));
    expect(medallas).toHaveLength(1);
  });
});
