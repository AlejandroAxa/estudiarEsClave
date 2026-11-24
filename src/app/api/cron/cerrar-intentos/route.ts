import { db } from "@/db";
import { cronAutorizado, noAutorizado } from "@/lib/cron";
import { cerrarVencidos } from "@/lib/evaluacion/evaluacion";
import { expirarOrdenes } from "@/lib/comercio/comercio";

export const dynamic = "force-dynamic";

/** Cada 10 minutos: cierra secciones e intentos con el tiempo vencido y expira órdenes viejas. */
export async function GET(req: Request) {
  if (!cronAutorizado(req)) return noAutorizado();
  const intentos = await cerrarVencidos(db);
  const ordenes = await expirarOrdenes(db);
  return Response.json({ intentos, ordenes });
}
