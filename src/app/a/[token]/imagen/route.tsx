import { db } from "@/db";
import { buscarEnlaceAvance, type DatosAvance } from "@/lib/compartir";
import { imagenAvance } from "@/lib/imagen-avance";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const e = await buscarEnlaceAvance(db, token);
  if (!e) return new Response("No disponible", { status: 404 });
  const r = imagenAvance(e.datos as DatosAvance);
  r.headers.set("Cache-Control", "private, max-age=3600");
  return r;
}
