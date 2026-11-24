import { NextResponse } from "next/server";
import { COOKIE_REF } from "@/lib/sesion";

/** Enlace de invitación: guarda el código 30 días y lleva a la portada (RF-44). */
export async function GET(req: Request, ctx: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await ctx.params;
  const res = NextResponse.redirect(new URL("/?invitado=1", req.url));
  if (/^[A-Z0-9]{4,16}$/i.test(codigo)) {
    res.cookies.set(COOKIE_REF, codigo.toUpperCase(), { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  return res;
}
