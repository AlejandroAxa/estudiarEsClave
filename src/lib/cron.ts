import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Vercel Cron manda `Authorization: Bearer $CRON_SECRET`. */
export function cronAutorizado(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return process.env.NODE_ENV !== "production";
  const a = Buffer.from(req.headers.get("authorization") ?? "");
  const b = Buffer.from(`Bearer ${secreto}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function noAutorizado() {
  return new Response("No autorizado", { status: 401 });
}
