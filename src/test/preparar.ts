import { readFileSync } from "node:fs";
import { migrar } from "../../scripts/migrar";
import { importarBanco } from "@/lib/banco/importar";
import { publicarRelease } from "@/lib/banco/publicar";
import { sembrarConfiguracion, sembrarProductos } from "@/lib/semilla";
import * as s from "@/db/schema";
import type { Db } from "@/db/conexion";

export async function baseDePrueba(fechaExamen: string | null = null): Promise<Db> {
  const db = await migrar("pglite:memoria");
  await sembrarConfiguracion(db, { fechaExamen });
  const r = await importarBanco(db, readFileSync("bancos/banco-semilla-medicina.json", "utf8"), { archivo: "semilla", permitirSinValidar: true });
  if (!r.aceptada) throw new Error(r.errores.join("\n"));
  await sembrarProductos(db);
  await publicarRelease(db, { examenId: "EXANI-II", version: "1.0.0-dev" });
  return db;
}

let n = 0;
export async function alumnoDePrueba(db: Db, alias = `alumno${++n}`) {
  const id = `cuenta-${alias}`;
  await db.insert(s.cuenta).values({ id, email: `${alias}@ejemplo.mx`, name: alias });
  await db.insert(s.cuentaRol).values({ cuentaId: id, rol: "alumno" });
  await db.insert(s.perfilAlumno).values({ cuentaId: id, nivel: "licenciatura", carreraObjetivo: "Medicina", rutaId: "medicina", examenId: "EXANI-II", cicloAnio: 2027, alias });
  return id;
}
