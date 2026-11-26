/**
 * Mercado Pago Checkout Pro por su API REST (sin SDK): tarjeta, OXXO y SPEI.
 * Variables: MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_WEBHOOK_SECRET.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Pasarela, PagoExterno } from "./tipos";

type Verificacion =
  | { ok: true; id: string }
  | { ok: false; motivo: "sin_secreto" | "sin_id" | "sin_firma" | "firma_invalida" | "otro_tipo"; id?: string; tipo?: string };

/**
 * Firma de los avisos de Mercado Pago (encabezado x-signature: «ts=…,v1=…»).
 * Plantilla oficial: «id:[data.id de la URL];request-id:[x-request-id];ts:[ts];», con el id
 * en minúsculas, quitando cualquier parte que no venga en el aviso. HMAC-SHA256 en hex
 * con la clave secreta de la sección Webhooks del panel.
 */
export function verificarFirmaMercadoPago(p: { url: string; cuerpo: string; firma: string | null; requestId: string | null; secreto: string | undefined }): Verificacion {
  const secreto = p.secreto?.trim().replace(/^["']|["']$/g, "");
  const url = new URL(p.url);
  const idUrl = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let tipo = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let idCuerpo: string | null = null;
  try {
    const j = JSON.parse(p.cuerpo || "{}");
    tipo = tipo ?? j.type ?? j.topic ?? null;
    idCuerpo = j.data?.id != null ? String(j.data.id) : null;
  } catch {
    /* el aviso puede venir sin cuerpo */
  }
  const id = idUrl ?? idCuerpo;
  // Solo nos importan los pagos; los demás avisos (merchant_order, etc.) se contestan 200 sin efecto.
  if (tipo && tipo !== "payment") return { ok: false, motivo: "otro_tipo", tipo };
  if (!id) return { ok: false, motivo: "sin_id" };
  if (!secreto) return { ok: false, motivo: "sin_secreto", id };
  const partes = Object.fromEntries(
    (p.firma ?? "").split(",").map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i).trim(), x.slice(i + 1).trim()];
    }),
  );
  if (!partes.ts || !partes.v1) return { ok: false, motivo: "sin_firma", id };
  const manifiesto =
    (idUrl ? `id:${/^[a-z0-9]+$/i.test(idUrl) ? idUrl.toLowerCase() : idUrl};` : "") +
    (p.requestId ? `request-id:${p.requestId};` : "") +
    `ts:${partes.ts};`;
  const esperado = Buffer.from(createHmac("sha256", secreto).update(manifiesto).digest("hex"));
  const recibido = Buffer.from(String(partes.v1).toLowerCase());
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido) ? { ok: true, id } : { ok: false, motivo: "firma_invalida", id };
}

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
    const r = verificarFirmaMercadoPago({
      url: req.url,
      cuerpo,
      firma: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      secreto: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    });
    if (r.ok) return { id: r.id };
    if (r.motivo === "otro_tipo") return { ignorar: r.tipo ?? "otro" };
    console.warn("webhook_rechazado", { proveedor: "mercadopago", motivo: r.motivo, id: r.id ?? null });
    return null;
  },

  async consultarPago(id) {
    const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` } });
    // 404: el pago no existe (p. ej. la simulación del panel con un id de prueba).
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status} al consultar el pago ${id}`);
    const p = (await res.json()) as { id: number; status: string; payment_type_id: string; external_reference: string; transaction_amount: number };
    const estado: PagoExterno["estado"] =
      p.status === "approved" ? "aprobado" : ["refunded", "charged_back"].includes(p.status) ? "reembolsado" : ["rejected", "cancelled"].includes(p.status) ? "rechazado" : "pendiente";
    const metodo: PagoExterno["metodo"] =
      p.payment_type_id === "ticket" ? "oxxo" : p.payment_type_id === "bank_transfer" ? "transferencia" : /card/.test(p.payment_type_id) ? "tarjeta" : "otro";
    return { referenciaExterna: `mp-${p.id}`, ordenId: p.external_reference, estado, metodo, montoMxn: p.transaction_amount };
  },
};
