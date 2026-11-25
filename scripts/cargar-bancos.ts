/**
 * Producción: importa los bancos validados del repositorio en modo estricto y, si
 * trajeron versiones nuevas, publica un release. Seguro de repetir.
 *   npx tsx scripts/cargar-bancos.ts 1.0.0              → todos los bancos/banco-semilla-*.json
 *   npx tsx scripts/cargar-bancos.ts 1.0.1 a.json b.json → solo esos archivos
 * En el VPS:  docker compose -f compose.produccion.yml exec web npx tsx scripts/cargar-bancos.ts 1.0.0
 */
import { readdirSync, readFileSync } from "node:fs";
import { migrar } from "./migrar";
import { sembrarProductos } from "../src/lib/semilla";
import { importarBanco } from "../src/lib/banco/importar";
import { publicarRelease, releaseVigente } from "../src/lib/banco/publicar";

async function main() {
  const [version, ...dados] = process.argv.slice(2);
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error("Indica la versión del release, por ejemplo: npx tsx scripts/cargar-bancos.ts 1.0.0");
    process.exit(1);
  }
  const archivos = dados.length
    ? dados
    : readdirSync("bancos")
        .filter((f) => /^banco-semilla-.+\.json$/.test(f))
        .sort((a, b) => Number(!a.includes("medicina")) - Number(!b.includes("medicina")) || a.localeCompare(b))
        .map((f) => `bancos/${f}`);
  const db = await migrar();
  let nuevas = 0;
  for (const archivo of archivos) {
    const r = await importarBanco(db, readFileSync(archivo, "utf8"), { archivo, permitirSinValidar: false });
    if (!r.aceptada) {
      console.error(`Importación de ${archivo} rechazada:\n` + r.errores.join("\n"));
      process.exit(1);
    }
    nuevas += r.versionesNuevas;
    console.log(`${archivo}: ${r.versionesNuevas} versiones nuevas, ${r.sinCambios} sin cambios.`);
  }
  await sembrarProductos(db);
  if (!(await releaseVigente(db, "EXANI-II")) || nuevas > 0) {
    const rel = await publicarRelease(db, { examenId: "EXANI-II", version, notas: "Bancos validados del repositorio" });
    console.log(`Release ${rel.version} publicado con ${rel.reactivos} reactivos.`);
  } else {
    console.log("Sin preguntas nuevas: el release vigente se queda igual.");
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
