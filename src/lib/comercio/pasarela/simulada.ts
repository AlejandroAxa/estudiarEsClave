/**
 * Pasarela simulada para desarrollo y vistas previas: lleva a una página del
 * propio sitio con botones para aprobar o rechazar. Nunca en producción.
 */
import { createHmac } from "node:crypto";
import type { Pasarela } from "./tipos";

const secreto = () => process.env.BETTER_AUTH_SECRET ?? "desarrollo";
export const firmaSimulada = (id: string) => createHmac("sha256", secreto()).update(`simulada:${id}`).digest("hex");

/** Pagos simulados en memoria del proceso (solo desarrollo). */
const pagos = new Map<string, { ordenId: string; estado: "aprobado" | "rechazado" | "pendiente"; metodo: "tarjeta" | "oxxo" | "transferencia"; monto: number }>();
export function registrarPagoSimulado(id: string, v: { ordenId: string; estado: "aprobado" | "rechazado" | "pendiente"; metodo: "tarjeta" | "oxxo" | "transferencia"; monto: number }) {
  pagos.set(id, v);
}

export const pasarelaSimulada: Pasarela = {
  nombre: "simulada",
  async crearCheckout(d) {
    const u = new URL(d.urlRetorno);
    return { url: `${u.origin}/pago/simulado?orden=${d.ordenId}&total=${d.totalMxn}`, referencia: `sim-${d.ordenId}` };
  },
  async verificarWebhook(req) {
    const id = req.headers.get("x-simulada-id");
    const firma = req.headers.get("x-simulada-firma");
    return id && firma === firmaSimulada(id) ? id : null;
  },
  async consultarPago(id) {
    const p = pagos.get(id);
    if (!p) return null;
    return { referenciaExterna: id, ordenId: p.ordenId, estado: p.estado, metodo: p.metodo, montoMxn: p.monto };
  },
};
