/** Aplica las migraciones de ./drizzle a DATABASE_URL. Uso: npm run db:migrar */
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { crearDb } from "../src/db/conexion";

export async function migrar(url = process.env.DATABASE_URL) {
  const db = crearDb(url);
  if (url?.startsWith("pglite:")) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder: "./drizzle" });
  } else if (url && /neon\.tech|neon\.build/.test(url)) {
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder: "./drizzle" });
  } else {
    await migratePg(db, { migrationsFolder: "./drizzle" });
  }
  return db;
}

if (process.argv[1]?.endsWith("migrar.ts")) {
  if (!process.env.DATABASE_URL) {
    console.log("Sin DATABASE_URL: no se aplican migraciones.");
    process.exit(0);
  }
  migrar()
    .then(() => {
      console.log("Migraciones aplicadas.");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
