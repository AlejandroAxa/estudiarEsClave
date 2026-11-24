/**
 * Prepara una base de desarrollo o de vista previa:
 *   npm run db:sembrar            → migra, configura, importa los bancos semilla y publica 1.0.0-dev
 *   npm run db:sembrar -- a.json  → lo mismo, pero solo con los archivos indicados
 * Por omisión importa bancos/banco-semilla-*.json, Medicina primero.
 * El banco semilla está en «revisado_ia», así que se importa en modo desarrollo
 * (marcado «SIN VALIDAR»). En producción se importa desde el panel, ya validado.
 */
import { readdirSync, readFileSync } from "node:fs";
import { migrar } from "./migrar";
import { sembrarConfiguracion, sembrarProductos } from "../src/lib/semilla";
import { importarBanco } from "../src/lib/banco/importar";
import { publicarRelease, releaseVigente } from "../src/lib/banco/publicar";

/** Bancos semilla del repositorio; Medicina va primero porque los productos dependen de su ruta. */
function bancosSemilla(dir = "bancos") {
  return readdirSync(dir)
    .filter((f) => /^banco-semilla-.+\.json$/.test(f))
    .sort((a, b) => Number(!a.includes("medicina")) - Number(!b.includes("medicina")) || a.localeCompare(b))
    .map((f) => `${dir}/${f}`);
}

async function main() {
  if (process.env.VERCEL_ENV === "production") throw new Error("No siembres datos de desarrollo en producción.");
  const archivos = process.argv.length > 2 ? process.argv.slice(2) : bancosSemilla();
  const db = await migrar();
  await sembrarConfiguracion(db, { fechaExamen: process.env.FECHA_EXAMEN_DEMO ?? null });
  let versionesNuevas = 0;
  for (const archivo of archivos) {
    const r = await importarBanco(db, readFileSync(archivo, "utf8"), { archivo, permitirSinValidar: true });
    if (!r.aceptada) {
      console.error(`Importación de ${archivo} rechazada:\n` + r.errores.join("\n"));
      process.exit(1);
    }
    versionesNuevas += r.versionesNuevas;
    console.log(`${archivo}: ${r.versionesNuevas} versiones nuevas, ${r.sinCambios} sin cambios. Plantillas: ${r.plantillas.join(", ") || "sin cambios"}`);
  }
  await sembrarProductos(db);
  const vigente = await releaseVigente(db, "EXANI-II");
  if (!vigente || versionesNuevas > 0) {
    // Si el banco trae versiones nuevas (p. ej. una corrección de notación), se publica otro release de desarrollo.
    const version = vigente ? `1.0.0-dev.${Date.now().toString(36)}` : "1.0.0-dev";
    const rel = await publicarRelease(db, { examenId: "EXANI-II", version, notas: "Banco semilla sin validar (desarrollo)" });
    console.log(`Release ${rel.version} publicado con ${rel.reactivos} reactivos.`);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
