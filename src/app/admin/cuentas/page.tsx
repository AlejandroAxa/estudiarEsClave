import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAdmin } from "@/lib/sesion";
import { accesosVigentes } from "@/lib/planes";
import { ordenesDe, productosActivos } from "@/lib/comercio/comercio";
import { formatoFecha, pesos } from "@/lib/fechas";
import { borrarPorArco, darCortesia, suspender } from "@/app/acciones/admin";

export const dynamic = "force-dynamic";

export default async function Cuentas({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ses = await requerirAdmin();
  const q = ((await searchParams).q ?? "").trim().toLowerCase();
  const [c] = q
    ? await db
        .select({ cuenta: s.cuenta, perfil: s.perfilAlumno })
        .from(s.cuenta)
        .leftJoin(s.perfilAlumno, eq(s.perfilAlumno.cuentaId, s.cuenta.id))
        .where(q.includes("@") ? sql`lower(${s.cuenta.email}) = ${q}` : sql`lower(${s.perfilAlumno.alias}) = ${q}`)
    : [];
  const [accesos, ordenes, productos, auditoria] = c
    ? await Promise.all([
        accesosVigentes(db, c.cuenta.id),
        ordenesDe(db, c.cuenta.id),
        productosActivos(db),
        db.select().from(s.auditoria).where(eq(s.auditoria.entidadId, c.cuenta.id)).orderBy(desc(s.auditoria.fecha)).limit(20),
      ])
    : [[], [], [], []];

  return (
    <>
      <h1 style={{ fontSize: 40 }}>Cuentas</h1>
      <form className="fila">
        <input name="q" defaultValue={q} placeholder="Correo exacto o alias" aria-label="Buscar cuenta" style={{ flex: 1 }} />
        <button className="btn">Buscar</button>
      </form>
      <p className="small">Solo se busca por correo o alias exactos, para atender solicitudes ARCO y soporte. Cada consulta de datos queda en la auditoría.</p>
      {q && !c && <p>No hay ninguna cuenta con ese dato.</p>}
      {c && (
        <>
          <section className="hoja pila">
            <h2 style={{ fontSize: 24 }}>{c.perfil?.alias ?? "(sin perfil)"}</h2>
            <p className="small">
              {c.cuenta.email} · creada el {formatoFecha(c.cuenta.createdAt)} · estado {c.cuenta.estado} · {c.perfil?.carreraObjetivo ?? ""}
            </p>
            <ul>
              {accesos.map(({ acceso, producto }) => (
                <li key={acceso.id}>
                  {acceso.origen}: {producto?.nombre ?? "prueba"} hasta {formatoFecha(acceso.hasta)}
                </li>
              ))}
              {ordenes.map(({ orden, producto }) => (
                <li key={orden.id}>
                  Orden {producto} · {pesos(Number(orden.total))} · {orden.estado} · {formatoFecha(orden.creadaEn, { day: "numeric", month: "short" })}
                </li>
              ))}
            </ul>
          </section>
          <section className="hoja pila">
            <h3>Dar acceso de cortesía</h3>
            <form action={darCortesia} className="fila" style={{ flexWrap: "wrap", alignItems: "end" }}>
              <input type="hidden" name="cuentaId" value={c.cuenta.id} />
              <select name="sku" aria-label="Producto">
                {productos.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <label className="campo">
                Días
                <input type="number" name="dias" min="1" max="400" defaultValue={30} />
              </label>
              <button className="btn sec">Dar acceso</button>
            </form>
            <form action={suspender}>
              <input type="hidden" name="cuentaId" value={c.cuenta.id} />
              <input type="hidden" name="estado" value={c.cuenta.estado === "activa" ? "suspendida" : "activa"} />
              <button className="btn disc">{c.cuenta.estado === "activa" ? "Suspender cuenta" : "Reactivar cuenta"}</button>
            </form>
            {c.cuenta.id !== ses.cuenta.id && (
              <details>
                <summary>Borrar por solicitud ARCO</summary>
                <form action={borrarPorArco} className="fila" style={{ marginTop: 12 }}>
                  <input type="hidden" name="cuentaId" value={c.cuenta.id} />
                  <input name="confirmar" placeholder="Escribe BORRAR" required aria-label="Confirmación" />
                  <button className="btn disc">Borrar cuenta</button>
                </form>
              </details>
            )}
          </section>
          {auditoria.length > 0 && (
            <section className="hoja">
              <h3>Historial</h3>
              <ul className="small">
                {auditoria.map((a) => (
                  <li key={a.id}>
                    {formatoFecha(a.fecha, { day: "numeric", month: "short", year: "numeric" })}: {a.accion}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
