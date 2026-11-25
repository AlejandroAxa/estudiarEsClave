/**
 * ¿Corre en producción real? En Vercel lo dice VERCEL_ENV; en un VPS se marca
 * con ENTORNO=produccion (compose.produccion.yml ya lo pone). No basta con
 * NODE_ENV, porque la vista local con Docker también compila en modo producción.
 */
export function enProduccion() {
  return process.env.VERCEL_ENV === "production" || process.env.ENTORNO === "produccion";
}
