import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/sesion";
import { FormularioEntrar } from "./formulario";
import { buzonLocalActivo } from "@/lib/correo";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ siguiente?: string; error?: string }> }) {
  const { siguiente, error } = await searchParams;
  const destino = siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/inicio";
  const ses = await sesionActual();
  if (ses) redirect(ses.perfil ? destino : `/bienvenida?siguiente=${encodeURIComponent(destino)}`);
  return (
    <div className="angosto band pila" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>Entra a tu consultorio</h1>
      <p className="lead">Sin contraseñas: te mandamos un enlace a tu correo. Si es tu primera vez, se crea tu cuenta con 3 días del pase completo, sin tarjeta.</p>
      {error && <p className="aviso error">El enlace ya no sirve (vence en 15 minutos y es de un solo uso). Pide otro.</p>}
      <FormularioEntrar destino={destino} google={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} buzon={buzonLocalActivo()} />
      <p className="xs">
        Al continuar aceptas el <a href="/privacidad">aviso de privacidad</a> y los <a href="/terminos">términos</a>. Solo pedimos tu correo; nunca tu nombre
        completo, CURP ni teléfono.
      </p>
    </div>
  );
}
