import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAdmin } from "@/lib/sesion";
import { formatoFecha } from "@/lib/fechas";
import { resolverReporte } from "@/app/acciones/admin";

export const dynamic = "force-dynamic";

export default async function Reportes({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requerirAdmin();
  const estado = (await searchParams).estado ?? "abierto";
  const filas = await db
    .select({ r: s.reporteError, enunciado: s.reactivoVersion.enunciado })
    .from(s.reporteError)
    .innerJoin(s.reactivoVersion, and(eq(s.reactivoVersion.reactivoId, s.reporteError.reactivoId), eq(s.reactivoVersion.version, s.reporteError.version)))
    .where(eq(s.reporteError.estado, estado))
    .orderBy(desc(s.reporteError.creadoEn))
    .limit(100);
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Reportes de error</h1>
      <nav className="fila">
        {["abierto", "confirmado", "descartado"].map((e) => (
          <a key={e} href={`?estado=${e}`} className="pastilla" aria-current={e === estado ? "page" : undefined}>
            {e}
          </a>
        ))}
      </nav>
      {filas.length === 0 && <p>No hay reportes {estado}s.</p>}
      {filas.map(({ r, enunciado }) => (
        <article key={r.id} className="hoja pila">
          <span className="membrete">
            {r.reactivoId} v{r.version} · {formatoFecha(r.creadoEn, { day: "numeric", month: "short" })}
          </span>
          <p className="small">{enunciado.slice(0, 240)}</p>
          <p>
            <b>Reporte:</b> {r.motivo}
          </p>
          <div className="fila">
            {(["confirmado", "descartado", "abierto"] as const)
              .filter((e) => e !== r.estado)
              .map((e) => (
                <form key={e} action={resolverReporte}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="estado" value={e} />
                  <button className="btn disc">{e === "abierto" ? "Reabrir" : e === "confirmado" ? "Confirmar" : "Descartar"}</button>
                </form>
              ))}
          </div>
        </article>
      ))}
      <p className="small">Un reporte confirmado se corrige en el archivo del banco, que se vuelve a validar e importar; luego se publica un release nuevo.</p>
    </>
  );
}
