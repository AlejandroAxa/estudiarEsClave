/**
 * Prepara una base de desarrollo o de vista previa:
 *   npm run db:sembrar            → migra, configura, importa el banco semilla y publica 1.0.0-dev
 * El banco semilla está en «revisado_ia», así que se importa en modo desarrollo
 * (marcado «SIN VALIDAR»). En producción se importa desde el panel, ya validado.
 */
import { readFileSync } from "node:fs";
import { migrar } from "./migrar";
import { sembrarConfiguracion, sembrarProductos } from "../src/lib/semilla";
import { importarBanco } from "../src/lib/banco/importar";
import { publicarRelease, releaseVigente } from "../src/lib/banco/publicar";

async function main() {
  if (process.env.VERCEL_ENV === "production") throw new Error("No siembres datos de desarrollo en producción.");
  const archivo = process.argv[2] ?? "bancos/banco-semilla-medicina.json";
  const db = await migrar();
  await sembrarConfiguracion(db, { fechaExamen: process.env.FECHA_EXAMEN_DEMO ?? null });
  const r = await importarBanco(db, readFileSync(archivo, "utf8"), { archivo, permitirSinValidar: true });
  if (!r.aceptada) {
    console.error("Importación rechazada:\n" + r.errores.join("\n"));
    process.exit(1);
  }
  console.log(`Banco importado: ${r.versionesNuevas} versiones nuevas, ${r.sinCambios} sin cambios. Plantillas: ${r.plantillas.join(", ")}`);
  await sembrarProductos(db);
  const vigente = await releaseVigente(db, "EXANI-II");
  if (!vigente || r.versionesNuevas > 0) {
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
