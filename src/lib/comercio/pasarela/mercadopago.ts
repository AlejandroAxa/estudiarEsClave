/**
 * Mercado Pago Checkout Pro por su API REST (sin SDK): tarjeta, OXXO y SPEI.
 * Variables: MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_WEBHOOK_SECRET.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Pasarela, PagoExterno } from "./tipos";

const API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN");
  return t;
}

export const mercadoPago: Pasarela = {
  nombre: "mercadopago",

  async crearCheckout(d) {
    const res = await fetch(`${API}/checkout/preferences`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "X-Idempotency-Key": d.ordenId },
      body: JSON.stringify({
        items: [{ id: d.ordenId, title: d.titulo, quantity: 1, unit_price: d.totalMxn, currency_id: "MXN" }],
        external_reference: d.ordenId,
        notification_url: d.urlWebhook,
        back_urls: { success: d.urlRetorno, pending: d.urlRetorno, failure: d.urlRetorno },
        auto_return: "approved",
        statement_descriptor: "ESTUDIARESCLAVE",
        payer: d.correoPagador ? { email: d.correoPagador } : undefined,
        payment_methods: { installments: 1 },
        // La ficha de OXXO o SPEI vence a los 3 días; después la orden pasa a «expirada».
        date_of_expiration: new Date(Date.now() + 3 * 86400000).toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { id: string; init_point: string };
    return { url: j.init_point, referencia: j.id };
  },

  async verificarWebhook(req, cuerpo) {
    const secreto = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const url = new URL(req.url);
    let dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
    try {
      const j = JSON.parse(cuerpo || "{}");
      if (j.type && j.type !== "payment") return null;
      dataId = dataId ?? j.data?.id?.toString() ?? null;
    } catch {
      /* el aviso puede venir sin cuerpo */
    }
    if (!dataId || !secreto) return null;
    const firma = req.headers.get("x-signature") ?? "";
    const requestId = req.headers.get("x-request-id") ?? "";
    const partes = Object.fromEntries(firma.split(",").map((p) => p.trim().split("=") as [string, string]));
    if (!partes.ts || !partes.v1) return null;
    const manifiesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
    const esperado = createHmac("sha256", secreto).update(manifiesto).digest("hex");
    const a = Buffer.from(esperado);
    const b = Buffer.from(partes.v1);
    return a.length === b.length && timingSafeEqual(a, b) ? dataId : null;
  },

  async consultarPago(id) {
    const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) return null;
    const p = (await res.json()) as { id: number; status: string; payment_type_id: string; external_reference: string; transaction_amount: number };
    const estado: PagoExterno["estado"] =
      p.status === "approved" ? "aprobado" : ["refunded", "charged_back"].includes(p.status) ? "reembolsado" : ["rejected", "cancelled"].includes(p.status) ? "rechazado" : "pendiente";
    const metodo: PagoExterno["metodo"] =
      p.payment_type_id === "ticket" ? "oxxo" : p.payment_type_id === "bank_transfer" ? "transferencia" : /card/.test(p.payment_type_id) ? "tarjeta" : "otro";
    return { referenciaExterna: `mp-${p.id}`, ordenId: p.external_reference, estado, metodo, montoMxn: p.transaction_amount };
  },
};
