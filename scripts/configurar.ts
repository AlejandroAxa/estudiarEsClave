/**
 * Configuración base, segura para producción: exámenes, ciclos, límites del
 * plan, insignias, promoción y productos (solo los que faltan; los que ya
 * existen no se tocan). No importa preguntas (eso se hace desde el panel).
 *   npm run db:configurar
 */
import { migrar } from "./migrar";
import { sembrarConfiguracion, sembrarProductos } from "../src/lib/semilla";

migrar()
  .then(async (db) => {
    await sembrarConfiguracion(db, { fechaExamen: null });
    await sembrarProductos(db);
  })
  .then(() => {
    console.log("Configuración base lista.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
