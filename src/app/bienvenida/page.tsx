import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/sesion";
import { rutasElegibles } from "@/lib/consultas";
import { FormularioBienvenida } from "./formulario";
import { areaGeneralPorSlug } from "@/lib/areas-generales";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function Bienvenida({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const ses = await requerirSesion();
  const { siguiente } = await searchParams;
  if (ses.perfil) redirect(siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/inicio");
  const rutas = await rutasElegibles();
  // Si viene de la página de un área (/diagnostico?area=…), esa área queda elegida.
  const area = siguiente?.match(/[?&]area=([a-z-]+)/)?.[1];
  const preferida = (area && areaGeneralPorSlug(area)?.rutaId) || (area === "medicina" ? "medicina" : undefined);
  return (
    <div className="angosto band pila" style={{ maxWidth: 560 }}>
      <span className="pastilla">Paso único</span>
      <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>Abramos tu expediente</h1>
      <p className="lead">Tres datos y listo. Tu alias es lo único que otros ven en la liga; nunca tu nombre ni tu correo.</p>
      <FormularioBienvenida rutas={rutas} siguiente={siguiente ?? "/inicio"} preferida={preferida} />
    </div>
  );
}
