import { mercadoPago } from "./mercadopago";
import { pasarelaSimulada } from "./simulada";
import type { Pasarela } from "./tipos";

/** PASARELA=mercadopago en producción; «simulada» por defecto fuera de producción. */
export function pasarela(): Pasarela {
  const elegida = process.env.PASARELA ?? (process.env.MERCADOPAGO_ACCESS_TOKEN ? "mercadopago" : "simulada");
  if (elegida === "simulada") {
    if (process.env.VERCEL_ENV === "production") throw new Error("La pasarela simulada no se permite en producción. Configura MERCADOPAGO_ACCESS_TOKEN.");
    return pasarelaSimulada;
  }
  return mercadoPago;
}
export type { Pasarela, PagoExterno } from "./tipos";
