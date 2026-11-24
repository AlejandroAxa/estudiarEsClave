import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAdmin } from "@/lib/sesion";
import { pesos } from "@/lib/fechas";

export const dynamic = "force-dynamic";

async function contar<T>(q: Promise<{ n: T }[]>) {
  return Number((await q)[0]?.n ?? 0);
}

export default async function Admin() {
  await requerirAdmin();
  const [cuentas, nuevas, diags, practicas, pagadas, ingresos, reportes, activos] = await Promise.all([
    contar(db.select({ n: sql<number>`count(*)::int` }).from(s.cuenta).where(eq(s.cuenta.estado, "activa"))),
    contar(db.select({ n: sql<number>`count(*)::int` }).from(s.cuenta).where(sql`${s.cuenta.createdAt} > now() - interval '7 days'`)),
    contar(db.select({ n: sql<number>`count(*)::int` }).from(s.intento).where(and(eq(s.intento.modo, "diagnostico"), eq(s.intento.estado, "enviado")))),
    contar(db.select({ n: sql<number>`count(*)::int` }).from(s.intento).where(and(eq(s.intento.modo, "practica"), sql`${s.intento.iniciaEn} > now() - interval '7 days'`))),
    contar(db.select({ n: sql<number>`count(*)::int` }).from(s.orden).where(eq(s.orden.estado, "pagada"))),
    contar(db.select({ n: sql<number>`coalesce(sum(${s.orden.total}),0)` }).from(s.orden).where(eq(s.orden.estado, "pagada"))),
    contar(db.select({ n: sql<number>`count(*)::int` }).from(s.reporteError).where(eq(s.reporteError.estado, "abierto"))),
    contar(db.select({ n: sql<number>`count(distinct ${s.intento.cuentaId})::int` }).from(s.intento).where(sql`${s.intento.ultimaActividadEn} > now() - interval '7 days'`)),
  ]);
  const datos: [string, string | number][] = [
    ["Cuentas activas", cuentas],
    ["Nuevas en 7 días", nuevas],
    ["Estudiaron en 7 días", activos],
    ["Diagnósticos enviados", diags],
    ["Prácticas en 7 días", practicas],
    ["Órdenes pagadas", pagadas],
    ["Ingresos (IVA incluido)", pesos(ingresos)],
    ["Reportes abiertos", reportes],
  ];
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Resumen</h1>
      <div className="rejilla">
        {datos.map(([t, v]) => (
          <div key={t} className="tarjeta-dato">
            <span className="small">{t}</span>
            <span className="cifra">{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}
