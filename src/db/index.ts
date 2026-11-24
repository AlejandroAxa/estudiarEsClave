import "server-only";
import { crearDb, type Db } from "./conexion";

declare global {
  var __db: Db | undefined;
}

function real(): Db {
  return globalThis.__db ?? (globalThis.__db = crearDb(process.env.DATABASE_URL));
}

/**
 * Conexión única por instancia (Fluid Compute reutiliza la instancia entre
 * peticiones). Se abre al primer uso, no al importar, para que la compilación
 * no necesite base de datos.
 */
export const db: Db = new Proxy({} as Db, {
  get(_t, prop) {
    const d = real();
    const v = Reflect.get(d, prop, d);
    return typeof v === "function" ? v.bind(d) : v;
  },
  has: (_t, prop) => Reflect.has(real(), prop),
});
export type { Db } from "./conexion";
