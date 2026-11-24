import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/db";
import { requerirAlumno } from "@/lib/sesion";
import { asegurarCodigoReferido, estadisticasReferido } from "@/lib/comercio/comercio";
import { CopiarEnlace } from "./copiar";

export const metadata: Metadata = { title: "Invitar amigos" };

export default async function Invitar() {
  const ses = await requerirAlumno("/invitar");
  const cod = await asegurarCodigoReferido(db, ses.cuenta.id, ses.perfil.alias);
  const est = await estadisticasReferido(db, cod.codigo);
  const h = await headers();
  const base = process.env.BETTER_AUTH_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const url = `${base}/r/${cod.codigo}`;
  const msg = `Estoy usando Estudiar es Clave para preparar el EXANI-II. Con mi enlace tienes ${cod.descuentoPct} % de descuento en tu pase: ${url}`;

  return (
    <div className="wrap band pila angosto">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Invita a tus amigos</h1>
      <p className="lead">
        Quien llegue con tu enlace tiene {cod.descuentoPct} % de descuento en su primera compra. Estudiar acompañado ayuda a no soltar la racha.
      </p>
      <section className="hoja pila">
        <span className="small">Tu código</span>
        <span className="cifra" style={{ letterSpacing: ".08em" }}>{cod.codigo}</span>
        <CopiarEnlace url={url} mensaje={msg} />
      </section>
      <div className="rejilla-2">
        <div className="tarjeta-dato">
          <span className="small">Se registraron con tu enlace</span>
          <span className="cifra">{est.invitados}</span>
        </div>
        <div className="tarjeta-dato">
          <span className="small">Compraron su pase</span>
          <span className="cifra">{est.compras}</span>
        </div>
      </div>
      <p className="small">
        El descuento no se suma a cupones ni a la promoción del último mes: siempre se aplica el mejor de los tres. Solo contamos cuántas personas
        llegaron; nunca te mostramos quiénes son.
      </p>
    </div>
  );
}
