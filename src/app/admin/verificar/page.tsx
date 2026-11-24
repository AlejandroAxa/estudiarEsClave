import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/sesion";
import { FormularioMfa } from "./formulario";

export const metadata = { title: "Verificar" };

export default async function Verificar() {
  const ses = await requerirSesion("/admin");
  if (!ses.roles.includes("admin")) redirect("/inicio");
  return (
    <div className="angosto pila">
      <h1 style={{ fontSize: 36 }}>Segundo factor</h1>
      <p>Escribe el código de 6 dígitos de tu app autenticadora. La verificación dura 12 horas en este dispositivo.</p>
      {!process.env.ADMIN_TOTP_SECRET && <p className="aviso error">Falta configurar ADMIN_TOTP_SECRET en las variables de entorno.</p>}
      <FormularioMfa />
    </div>
  );
}
