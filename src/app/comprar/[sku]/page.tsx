import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requerirAlumno } from "@/lib/sesion";
import { cotizar } from "@/lib/comercio/comercio";
import { pesos } from "@/lib/fechas";
import { FormCompra } from "./form";

export const metadata: Metadata = { title: "Comprar", robots: { index: false } };

export default async function Comprar({ params, searchParams }: { params: Promise<{ sku: string }>; searchParams: Promise<{ cupon?: string }> }) {
  const { sku } = await params;
  const { cupon } = await searchParams;
  const ses = await requerirAlumno(`/comprar/${sku}`);
  const c = await cotizar(db, sku, { cupon, referido: ses.perfil.llegoConReferido, beneficiarioId: ses.cuenta.id, pagadorId: ses.cuenta.id }).catch(() => null);
  if (!c) notFound();
  return (
    <div className="angosto band pila" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: "clamp(30px,5vw,44px)" }}>{c.nombre}</h1>
      <div className="hoja pila">
        <div className="fila entre">
          <span>Precio</span>
          <span>{pesos(c.precioLista)}</span>
        </div>
        {c.descuento && (
          <div className="fila entre">
            <span>{c.descuento.etiqueta}</span>
            <span>−{pesos(c.precioLista - c.total)}</span>
          </div>
        )}
        <div className="fila entre" style={{ borderTop: "1px solid var(--linea)", paddingTop: 10 }}>
          <b>Total con IVA</b>
          <b className="cifra" style={{ fontSize: 28 }}>
            {pesos(c.total)}
          </b>
        </div>
        <p className="xs">Los descuentos no se acumulan: aplicamos el mayor que te corresponda.</p>
      </div>
      <FormCompra sku={sku} cupon={cupon ?? ""} />
    </div>
  );
}
