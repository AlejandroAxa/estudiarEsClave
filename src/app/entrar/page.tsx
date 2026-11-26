import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/sesion";
import { FormularioEntrar } from "./formulario";
import { buzonLocalActivo } from "@/lib/correo";
import { Brillos, Incluye } from "@/components/estilos/producto";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string; error?: string }>;
}) {
  const { siguiente, error } = await searchParams;
  const destino =
    siguiente?.startsWith("/") && !siguiente.startsWith("//")
      ? siguiente
      : "/inicio";
  const ses = await sesionActual();
  if (ses)
    redirect(
      ses.perfil
        ? destino
        : `/bienvenida?siguiente=${encodeURIComponent(destino)}`,
    );
  return (
    <div className="producto">
      <Brillos />
      <div className="wrap band kp-dos">
        <div className="pila">
          <span className="kp-chip">
            <i aria-hidden /> Sin contraseñas
          </span>
          <h1 className="kp-h1">
            Entra a <span className="kp-grad">estudiar.</span>
          </h1>
          <p className="lead">
            Te mandamos un enlace a tu correo. Si es tu primera vez, se crea tu
            cuenta.
          </p>
          <Incluye
            items={[
              "3 días del pase completo, sin tarjeta",
              "Un diagnóstico por temporada",
              "15 preguntas de práctica al día",
            ]}
          />
        </div>
        <div className="pila">
          {error && (
            <p className="aviso error">
              El enlace ya no sirve (vence en 15 minutos y es de un solo uso).
              Pide otro.
            </p>
          )}
          <FormularioEntrar
            destino={destino}
            google={
              !!(
                process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
              )
            }
            buzon={buzonLocalActivo()}
          />
          <p className="xs">
            Al continuar aceptas el{" "}
            <a href="/privacidad">aviso de privacidad</a> y los{" "}
            <a href="/terminos">términos</a>. Solo pedimos tu correo; nunca tu
            nombre completo, CURP ni teléfono.
          </p>
        </div>
      </div>
    </div>
  );
}
