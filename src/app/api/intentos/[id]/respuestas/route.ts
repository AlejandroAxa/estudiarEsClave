/**
 * Guardado de respuestas (RF-17, RNF-04): idempotente por id_idempotencia, así
 * que el navegador puede reenviar sin duplicar. En diagnóstico responde 204 sin
 * revelar nada; en práctica devuelve la retroalimentación.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { duenoActual } from "@/lib/dueno";
import { ErrorEvaluacion, guardarRespuesta } from "@/lib/evaluacion/evaluacion";
import { ipDe, limitar } from "@/lib/limites";
import { componer, componerExplicacion } from "@/lib/formulas";

const cuerpo = z.object({
  orden: z.number().int().positive(),
  letra: z.enum(["A", "B", "C"]).nullable(),
  marcada: z.boolean().optional(),
  tiempoMs: z.number().int().nonnegative().max(3_600_000).optional(),
  idIdempotencia: z.string().uuid(),
});

const estados: Record<ErrorEvaluacion["codigo"], number> = { no_encontrado: 404, prohibido: 403, cerrado: 409, cuota: 402, invalido: 400, sin_banco: 409 };

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const d = await duenoActual();
  const lim = await limitar("respuesta", d.cuentaId ?? d.sesionAnonimaId ?? ipDe(req.headers));
  if (!lim.ok) return NextResponse.json({ error: "Vas muy rápido. Espera unos segundos." }, { status: 429 });
  const p = cuerpo.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  try {
    const r = await guardarRespuesta(db, { intentoId: id, ...p.data, ...d });
    if (!r.retro) return new NextResponse(null, { status: 204 });
    // La retroalimentación sale como HTML compuesto (fórmulas con KaTeX, resto escapado).
    const retro = {
      ...r.retro,
      explicacion: componerExplicacion(r.retro.explicacion),
      argumentaciones: Object.fromEntries(Object.entries(r.retro.argumentaciones).map(([k, v]) => [k, v == null ? null : componer(v)])),
    };
    return NextResponse.json({ retro });
  } catch (e) {
    if (e instanceof ErrorEvaluacion) return NextResponse.json({ error: e.message, codigo: e.codigo, ...e.extra }, { status: estados[e.codigo] });
    console.error("guardar_respuesta_fallo", { intento: id, error: (e as Error).message });
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
