import { sql } from "drizzle-orm";
import { db } from "@/db";
import { cronAutorizado, noAutorizado } from "@/lib/cron";

export const dynamic = "force-dynamic";

/** Diario: borra lo que ya no sirve (sesiones y enlaces vencidos, minis anónimos viejos). */
export async function GET(req: Request) {
  if (!cronAutorizado(req)) return noAutorizado();
  const n = async (q: ReturnType<typeof sql>) => ((await db.execute(q)) as unknown as { rowCount?: number; affectedRows?: number }).rowCount ?? 0;
  const r = {
    sesiones: await n(sql`delete from sesion where vence_en < now()`),
    verificaciones: await n(sql`delete from verificacion where vence_en < now()`),
    enlaces: await n(sql`delete from enlace_compartido where vence_en < now() - interval '90 days' and id not in (select enlace_id from orden where enlace_id is not null)`),
    minisAnonimos: await n(sql`delete from intento where sesion_anonima_id is not null and inicia_en < now() - interval '30 days'`),
  };
  return Response.json(r);
}
