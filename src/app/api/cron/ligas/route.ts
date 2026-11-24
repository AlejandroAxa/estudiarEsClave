import { db } from "@/db";
import { cronAutorizado, noAutorizado } from "@/lib/cron";
import { cerrarLigas } from "@/lib/motivacion/motivacion";

export const dynamic = "force-dynamic";

/** Lunes 00:00 de la Ciudad de México (06:00 UTC): cierra la semana anterior. */
export async function GET(req: Request) {
  if (!cronAutorizado(req)) return noAutorizado();
  return Response.json(await cerrarLigas(db));
}
