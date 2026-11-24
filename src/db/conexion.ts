/**
 * Elige el controlador según DATABASE_URL:
 * - Neon (producción y vistas previas): pool por WebSocket, admite transacciones.
 * - postgres:// local: node-postgres.
 * - pglite:<carpeta> o pglite:memoria: Postgres embebido para desarrollo y pruebas.
 */
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool as NeonPool } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

export function crearDb(url: string | undefined): Db {
  if (!url) throw new Error("Falta DATABASE_URL. Copia .env.example a .env.local y llénalo.");
  if (url.startsWith("pglite:")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
    const ruta = url.slice("pglite:".length);
    const cliente = ruta === "memoria" || ruta === "" ? new PGlite() : new PGlite(ruta);
    return drizzle(cliente, { schema }) as unknown as Db;
  }
  if (/neon\.tech|neon\.build/.test(url)) {
    return drizzleNeon(new NeonPool({ connectionString: url }), { schema }) as unknown as Db;
  }
  return drizzlePg(new pg.Pool({ connectionString: url, max: 10 }), { schema });
}
