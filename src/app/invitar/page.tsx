import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/db";
import { requerirAlumno } from "@/lib/sesion";
import { asegurarCodigoReferido, estadisticasReferido } from "@/lib/comercio/comercio";
import { CopiarEnlace } from "./copiar";
import { CabeceraApp } from "@/components/cabecera-app";

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
    <>
      <CabeceraApp
        ceja="Invitar amigos"
        titulo={
          <>
            Estudia <em>acompañado</em>
          </>
        }
        sub={`Quien llegue con tu enlace tiene ${cod.descuentoPct} % de descuento en su primera compra. Estudiar acompañado ayuda a no soltar la racha.`}
        cifras={[
          { valor: est.invitados, etiqueta: "Se registraron con tu enlace" },
          { valor: est.compras, etiqueta: "Compraron su pase" },
        ]}
      />
      <div className="wrap app-cuerpo angosto" style={{ marginInline: "auto" }}>
        <section className="tarjeta">
          <span className="app-ojo">Tu código</span>
          <span className="cifra" style={{ fontSize: 34, letterSpacing: ".08em" }}>
            {cod.codigo}
          </span>
          <CopiarEnlace url={url} mensaje={msg} />
        </section>
        <p className="small">
          El descuento no se suma a cupones ni a la promoción del último mes: siempre se aplica el mejor de los tres. Solo contamos cuántas personas
          llegaron; nunca te mostramos quiénes son.
        </p>
      </div>
    </>
  );
}
