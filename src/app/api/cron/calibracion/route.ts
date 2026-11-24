import { db } from "@/db";
import { cronAutorizado, noAutorizado } from "@/lib/cron";
import { calibrar } from "@/lib/banco/calibrar";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!cronAutorizado(req)) return noAutorizado();
  return Response.json(await calibrar(db));
}
