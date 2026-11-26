/**
 * Webhook de la pasarela (RF-29, ADR-05): verifica la firma, consulta el pago
 * en la pasarela y lo procesa una sola vez. Los repetidos responden 200 sin efecto.
 *   401: firma ausente o inválida (revisa MERCADOPAGO_WEBHOOK_SECRET; el log dice el motivo).
 *   200: pago procesado, aviso repetido, aviso que no es de pagos o pago inexistente
 *        (como la simulación del panel con un id de prueba).
 *   500: falla nuestra o de Mercado Pago; la pasarela reintenta.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { pasarela } from "@/lib/comercio/pasarela";
import { procesarPago } from "@/lib/comercio/comercio";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const pg = pasarela();
  const cuerpo = await req.text();
  const v = await pg.verificarWebhook(req, cuerpo);
  if (!v) return NextResponse.json({ ok: false }, { status: 401 });
  if ("ignorar" in v) return NextResponse.json({ ok: true, efecto: "ignorado", tipo: v.ignorar });
  try {
    const pago = await pg.consultarPago(v.id);
    if (!pago) {
      console.warn("webhook_pago_no_encontrado", { proveedor: pg.nombre, id: v.id });
      return NextResponse.json({ ok: true, efecto: "pago_no_encontrado" });
    }
    const r = await procesarPago(db, pago, pg.nombre);
    console.info("webhook_procesado", { proveedor: pg.nombre, id: v.id, estado: pago.estado, efecto: r.efecto });
    return NextResponse.json({ ok: true, efecto: r.efecto });
  } catch (e) {
    console.error("webhook_fallo", { proveedor: pg.nombre, id: v.id, error: (e as Error).message });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/** Para comprobar desde el navegador que la ruta existe y está desplegada. */
export function GET() {
  return NextResponse.json({ ok: true, webhook: "pagos", metodo: "POST" });
}
