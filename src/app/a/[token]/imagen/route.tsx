import { db } from "@/db";
import { buscarEnlaceAvance, type DatosAvance } from "@/lib/compartir";
import { imagenAvance } from "@/lib/imagen-avance";
import { guardarArchivo, leerArchivo } from "@/lib/almacen";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const e = await buscarEnlaceAvance(db, token);
  if (!e) return new Response("No disponible", { status: 404 });
  // En el VPS la gráfica se guarda en disco la primera vez (los datos del enlace están congelados).
  const nombre = `avance/${e.id}.png`;
  let png = await leerArchivo(nombre);
  if (!png) {
    png = Buffer.from(await imagenAvance(e.datos as DatosAvance).arrayBuffer());
    await guardarArchivo(nombre, png);
  }
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" } });
}
