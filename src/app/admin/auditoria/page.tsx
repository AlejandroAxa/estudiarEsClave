import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAdmin } from "@/lib/sesion";
import { formatoFecha, formatoHora } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function Auditoria() {
  await requerirAdmin();
  const filas = await db
    .select({ a: s.auditoria, alias: s.perfilAlumno.alias, correo: s.cuenta.email })
    .from(s.auditoria)
    .leftJoin(s.cuenta, eq(s.cuenta.id, s.auditoria.actorId))
    .leftJoin(s.perfilAlumno, eq(s.perfilAlumno.cuentaId, s.auditoria.actorId))
    .orderBy(desc(s.auditoria.fecha))
    .limit(200);
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Auditoría</h1>
      <div className="hoja desplazable">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Quién</th>
              <th>Acción</th>
              <th>Entidad</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ a, alias, correo }) => (
              <tr key={a.id}>
                <td>
                  {formatoFecha(a.fecha, { day: "numeric", month: "short" })} {formatoHora(a.fecha)}
                </td>
                <td>{alias ?? correo ?? "sistema"}</td>
                <td>{a.accion}</td>
                <td className="xs">
                  {a.entidad} {a.entidadId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
