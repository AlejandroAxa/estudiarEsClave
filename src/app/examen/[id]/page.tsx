import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { duenoActual } from "@/lib/dueno";
import { intentoDe, itemsVisibles, seccionesDe } from "@/lib/evaluacion/evaluacion";
import { componer, componerDatos } from "@/lib/formulas";
import { Examen } from "./examen";
import { temaActual } from "@/lib/tema-sesion";
import { eq } from "drizzle-orm";
import * as s from "@/db/schema";

export const metadata: Metadata = { title: "Examen en curso", robots: { index: false } };

export default async function PaginaExamen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await duenoActual();
  const i = await intentoDe(db, id, d).catch(() => null);
  if (!i) notFound();
  if (i.estado === "enviado") redirect(i.modo === "practica" ? `/examen/${id}/resumen` : `/examen/${id}/resultado`);
  if (i.estado === "abandonado") redirect(i.modo === "practica" ? "/practica" : "/diagnostico");
  const secciones = await seccionesDe(db, id);
  const { items, textos } = await itemsVisibles(db, id);
  const tema = await temaActual();
  const [racha] = i.cuentaId && i.modo === "practica"
    ? await db.select({ a: s.racha.aciertosSeguidos, m: s.racha.mejorAciertos }).from(s.racha).where(eq(s.racha.cuentaId, i.cuentaId))
    : [];
  return (
    <Examen
      intento={{ id: i.id, modo: i.modo, venceEn: i.venceEn.toISOString(), global: i.modo !== "diagnostico" }}
      secciones={secciones.map((x) => ({
        numero: x.sec.numero,
        area: x.area ?? "Práctica",
        estado: x.sec.estado as "pendiente" | "en_curso" | "terminada",
        venceEn: x.sec.venceEn?.toISOString() ?? null,
        minutos: x.sec.tiempoLimiteMin,
      }))}
      // Las fórmulas se componen aquí, en el servidor: al navegador llega HTML ya escapado.
      items={items.map((it) => ({
        ...it,
        enunciado: componer(it.enunciado),
        datos: it.datos ? componerDatos(it.datos) : null,
        opciones: it.opciones.map((o) => ({ ...o, texto: componer(o.texto) })),
      }))}
      textos={textos}
      vocabulario={{ practica: tema.practica, aciertos: tema.aciertos }}
      ahoraServidor={new Date().toISOString()}
      rachaInicial={i.cuentaId && i.modo === "practica" ? { actual: racha?.a ?? 0, mejor: racha?.m ?? 0 } : null}
    />
  );
}
