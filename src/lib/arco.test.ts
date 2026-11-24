import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as s from "@/db/schema";
import { baseDePrueba, alumnoDePrueba } from "@/test/preparar";
import { darInsignia, otorgarPuntos } from "@/lib/motivacion/motivacion";
import { borrarCuenta, exportarDatos } from "./arco";
import { calibrar } from "./banco/calibrar";

describe("ARCO", () => {
  it("exporta y luego borra la cuenta aunque los puntos sean de solo inserción", async () => {
    const db = await baseDePrueba();
    const id = await alumnoDePrueba(db, "arco1");
    await darInsignia(db, id, "racha-7");
    await otorgarPuntos(db, { cuentaId: id, motivo: "dia", puntos: 20, idem: "dia:x" });
    const datos = await exportarDatos(db, id);
    expect(datos.cuenta?.correo).toBe("arco1@ejemplo.mx");
    expect(datos.puntos.length).toBe(2);
    await borrarCuenta(db, id);
    expect(await db.select().from(s.cuenta).where(eq(s.cuenta.id, id))).toHaveLength(0);
    expect(await db.select().from(s.eventoPuntos).where(eq(s.eventoPuntos.cuentaId, id))).toHaveLength(0);
  }, 60000);

  it("la calibración corre sin datos", async () => {
    const db = await baseDePrueba();
    expect(await calibrar(db)).toEqual({ calibradas: 0, aRevision: 0 });
  }, 60000);
});
