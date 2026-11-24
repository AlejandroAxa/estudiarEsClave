import { db } from "@/db";
import { exportarDatos } from "@/lib/arco";
import { auditar, sesionActual } from "@/lib/sesion";

/** Derecho de acceso: descarga de todos los datos de la cuenta en JSON. */
export async function GET() {
  const ses = await sesionActual();
  if (!ses) return new Response("Inicia sesión", { status: 401 });
  const datos = await exportarDatos(db, ses.cuenta.id);
  await auditar(ses.cuenta.id, "arco_acceso", "cuenta", ses.cuenta.id);
  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="mis-datos-estudiar-es-clave.json"`,
      "cache-control": "no-store",
    },
  });
}
