import { db } from "@/db";
import { exportarRelease } from "@/lib/banco/publicar";
import { requerirAdmin } from "@/lib/sesion";

export async function GET(_req: Request, ctx: { params: Promise<{ version: string }> }) {
  await requerirAdmin();
  const { version } = await ctx.params;
  const datos = await exportarRelease(db, version);
  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="release-${version.replace(/[^0-9a-z.-]/gi, "")}.json"`,
      "cache-control": "no-store",
    },
  });
}
