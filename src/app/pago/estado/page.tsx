import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { pesos } from "@/lib/fechas";

export const metadata: Metadata = { title: "Estado del pago", robots: { index: false } };

/** El regreso de la pasarela solo muestra el estado; el acceso nace del webhook. */
export default async function EstadoPago({ searchParams }: { searchParams: Promise<{ orden?: string }> }) {
  const { orden } = await searchParams;
  const [o] = orden && /^[0-9a-f-]{36}$/i.test(orden) ? await db.select().from(s.orden).where(eq(s.orden.id, orden)) : [];
  if (!o) return <div className="angosto band"><h1 style={{ fontSize: 36 }}>No encontramos esa orden</h1></div>;
  const textos: Record<string, [string, string]> = {
    pagada: ["¡Pago confirmado!", "El pase ya está activo en la cuenta del aspirante."],
    pendiente: ["Estamos esperando la confirmación", "Si pagaste en OXXO o por SPEI, la confirmación puede tardar unas horas. El pase se activa solo en cuanto llegue."],
    expirada: ["La orden venció", "No se cobró nada. Puedes generar una nueva desde la página de planes."],
    reembolsada: ["Pago reembolsado", "El acceso de esta orden ya no está activo."],
  };
  const [t1, t2] = textos[o.estado];
  return (
    <div className="angosto band pila">
      <span className="pastilla">Orden de {pesos(o.total)}</span>
      <h1 style={{ fontSize: "clamp(30px,5vw,48px)" }}>{t1}</h1>
      <p className="lead">{t2}</p>
      <div className="fila">
        <Link href="/inicio" className="btn">
          Ir al inicio
        </Link>
        {o.estado === "pendiente" && (
          <Link href={`/pago/estado?orden=${o.id}`} className="btn sec">
            Actualizar
          </Link>
        )}
      </div>
    </div>
  );
}
