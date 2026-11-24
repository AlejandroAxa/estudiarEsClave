import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/sesion";
import { rutasElegibles } from "@/lib/consultas";
import { FormularioBienvenida } from "./formulario";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function Bienvenida({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const ses = await requerirSesion();
  const { siguiente } = await searchParams;
  if (ses.perfil) redirect(siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/inicio");
  const rutas = await rutasElegibles();
  return (
    <div className="angosto band pila" style={{ maxWidth: 560 }}>
      <span className="pastilla">Paso único</span>
      <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>Abramos tu expediente</h1>
      <p className="lead">Tres datos y listo. Tu alias es lo único que otros ven en la liga; nunca tu nombre ni tu correo.</p>
      <FormularioBienvenida rutas={rutas} siguiente={siguiente ?? "/inicio"} />
    </div>
  );
}
