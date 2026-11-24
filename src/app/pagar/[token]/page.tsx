import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { buscarEnlacePago } from "@/lib/compartir";
import { cotizar } from "@/lib/comercio/comercio";
import { formatoFecha, pesos } from "@/lib/fechas";
import { FormPagoEnlace } from "./form";

export const metadata: Metadata = { title: "Pagar un pase", robots: { index: false, follow: false } };

export default async function PagarEnlace({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const e = await buscarEnlacePago(db, token);
  if (!e || !e.productoSku)
    return (
      <div className="angosto band pila">
        <h1 style={{ fontSize: 40 }}>Este enlace ya no sirve</h1>
        <p className="lead">Los enlaces de pago vencen a los 7 días y sirven para un solo pago. Pide uno nuevo a quien te lo mandó.</p>
      </div>
    );
  const [perfil] = await db.select({ alias: s.perfilAlumno.alias, llego: s.perfilAlumno.llegoConReferido }).from(s.perfilAlumno).where(eq(s.perfilAlumno.cuentaId, e.cuentaId));
  const [cuenta] = await db.select({ nombre: s.cuenta.name }).from(s.cuenta).where(eq(s.cuenta.id, e.cuentaId));
  const c = await cotizar(db, e.productoSku, { referido: perfil?.llego, beneficiarioId: e.cuentaId });
  const quien = cuenta?.nombre || perfil?.alias || "un aspirante";
  return (
    <div className="angosto band pila" style={{ maxWidth: 560 }}>
      <span className="pastilla">Enlace de pago</span>
      <h1 style={{ fontSize: "clamp(30px,5vw,44px)" }}>{quien} te pide ayuda con su pase</h1>
      <p className="lead">
        Es para prepararse para su examen de admisión con Estudiar es Clave. El pase queda en su cuenta hasta el día del examen; no se renueva solo.
      </p>
      <div className="hoja pila">
        <div className="fila entre">
          <b>{c.nombre}</b>
          <b className="cifra" style={{ fontSize: 28 }}>
            {pesos(c.total)}
          </b>
        </div>
        {c.descuento && <p className="small">Incluye {c.descuento.etiqueta}.</p>}
        <p className="xs">IVA incluido. Este enlace vence el {formatoFecha(e.venceEn)}.</p>
      </div>
      <FormPagoEnlace token={token} />
    </div>
  );
}
