import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { duenoActual } from "@/lib/dueno";
import { intentoDe, itemsVisibles, seccionesDe } from "@/lib/evaluacion/evaluacion";
import { Examen } from "./examen";

export const metadata: Metadata = { title: "Consulta en curso", robots: { index: false } };

export default async function PaginaExamen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await duenoActual();
  const i = await intentoDe(db, id, d).catch(() => null);
  if (!i) notFound();
  if (i.estado === "enviado") redirect(i.modo === "practica" ? `/examen/${id}/resumen` : `/examen/${id}/resultado`);
  if (i.estado === "abandonado") redirect(i.modo === "practica" ? "/practica" : "/diagnostico");
  const secciones = await seccionesDe(db, id);
  const { items, textos } = await itemsVisibles(db, id);
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
      items={items}
      textos={textos}
      ahoraServidor={new Date().toISOString()}
    />
  );
}
