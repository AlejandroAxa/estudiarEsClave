/**
 * Configuración base, segura para producción: exámenes, ciclos, límites del
 * plan, insignias y promoción. No importa preguntas (eso se hace desde el panel).
 *   npm run db:configurar
 */
import { migrar } from "./migrar";
import { sembrarConfiguracion } from "../src/lib/semilla";

migrar()
  .then((db) => sembrarConfiguracion(db, { fechaExamen: null }))
  .then(() => {
    console.log("Configuración base lista.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
