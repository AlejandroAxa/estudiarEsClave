/**
 * Webhook de la pasarela (RF-29, ADR-05): verifica la firma, consulta el pago
 * en la pasarela y lo procesa una sola vez. Los repetidos responden 200 sin efecto.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { pasarela } from "@/lib/comercio/pasarela";
import { procesarPago } from "@/lib/comercio/comercio";

export async function POST(req: Request) {
  const pg = pasarela();
  const cuerpo = await req.text();
  const id = await pg.verificarWebhook(req, cuerpo);
  if (!id) return NextResponse.json({ ok: false }, { status: 401 });
  const pago = await pg.consultarPago(id);
  if (!pago) {
    console.error("webhook_pago_no_encontrado", { proveedor: pg.nombre, id });
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const r = await procesarPago(db, pago, pg.nombre);
    return NextResponse.json({ ok: true, efecto: r.efecto });
  } catch (e) {
    console.error("webhook_fallo", { proveedor: pg.nombre, id, error: (e as Error).message });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
