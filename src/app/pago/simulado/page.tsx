import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { procesarPago } from "@/lib/comercio/comercio";
import { pesos } from "@/lib/fechas";
import { enProduccion } from "@/lib/entorno";

/** Pasarela simulada (solo desarrollo y vistas previas). */
export default async function PagoSimulado({ searchParams }: { searchParams: Promise<{ orden?: string }> }) {
  if (enProduccion() || process.env.PASARELA === "mercadopago") notFound();
  const { orden } = await searchParams;
  const [o] = orden && /^[0-9a-f-]{36}$/i.test(orden) ? await db.select().from(s.orden).where(eq(s.orden.id, orden)) : [];
  if (!o) notFound();
  async function resolver(form: FormData) {
    "use server";
    if (enProduccion()) return;
    const estado = form.get("estado") === "aprobado" ? "aprobado" : "rechazado";
    const metodo = (form.get("metodo") as "tarjeta" | "oxxo" | "transferencia") ?? "tarjeta";
    await procesarPago(db, { referenciaExterna: `sim-${o.id}-${estado}`, ordenId: o.id, estado, metodo, montoMxn: Number(o.total) }, "simulada");
    redirect(`/pago/estado?orden=${o.id}`);
  }
  return (
    <div className="angosto band pila">
      <span className="pastilla">Pasarela simulada · desarrollo</span>
      <h1 style={{ fontSize: 40 }}>Cobro de {pesos(o.total)}</h1>
      <p className="lead">Esta página reemplaza a Mercado Pago mientras no configures MERCADOPAGO_ACCESS_TOKEN. Nadie paga nada real.</p>
      <form action={resolver} className="hoja pila">
        <select name="metodo" aria-label="Método">
          <option value="tarjeta">Tarjeta</option>
          <option value="oxxo">OXXO</option>
          <option value="transferencia">SPEI</option>
        </select>
        <div className="fila">
          <button className="btn" name="estado" value="aprobado">
            Aprobar pago
          </button>
          <button className="btn sec" name="estado" value="rechazado">
            Rechazar
          </button>
        </div>
      </form>
    </div>
  );
}
