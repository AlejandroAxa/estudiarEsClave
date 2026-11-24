import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAdmin } from "@/lib/sesion";
import { conteoPorEstado } from "@/lib/banco/publicar";
import { formatoFecha, formatoHora } from "@/lib/fechas";
import { alternarPlantilla } from "@/app/acciones/admin";
import { FormularioImportar, FormularioPublicar } from "./formularios";

export const dynamic = "force-dynamic";

export default async function Banco() {
  await requerirAdmin();
  const [conteo, importaciones, releases, plantillas] = await Promise.all([
    conteoPorEstado(db),
    db.select().from(s.importacion).orderBy(desc(s.importacion.fecha)).limit(15),
    db
      .select({ r: s.release, items: sql<number>`(select count(*)::int from release_item ri where ri.release_version = ${s.release.version})` })
      .from(s.release)
      .orderBy(desc(s.release.publicadoEn)),
    db
      .select({ p: s.plantilla, n: sql<number>`(select count(*)::int from plantilla_reactivo pr where pr.plantilla_id = ${s.plantilla.id})` })
      .from(s.plantilla)
      .orderBy(s.plantilla.id),
  ]);
  const ultimo = releases[0]?.r.version ?? "0.0.0";
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Banco y releases</h1>
      <p className="small">
        Reactivos por estado: {conteo.map((c) => `${c.estado} ${c.n}`).join(" · ") || "sin reactivos"}. Solo los «validado» entran a un release.
      </p>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Importar banco</h2>
        <p className="small">El archivo debe seguir el formato del LEEME. Si una sola pregunta tiene un error, se rechaza el archivo entero y no cambia nada.</p>
        <FormularioImportar desarrollo={process.env.NODE_ENV !== "production"} />
      </section>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Publicar release</h2>
        <p className="small">Un release congela las versiones validadas vigentes. Es inmutable: para corregir, se publica uno nuevo. Último: {ultimo}.</p>
        <FormularioPublicar />
        <table className="tabla">
          <thead>
            <tr>
              <th>Versión</th>
              <th>Publicado</th>
              <th className="num">Reactivos</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {releases.map(({ r, items }) => (
              <tr key={r.version}>
                <td>{r.version}</td>
                <td>{formatoFecha(r.publicadoEn, { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="num">{items}</td>
                <td>{r.vigente ? <span className="sem ok">Vigente</span> : "Anterior"}</td>
                <td>
                  <Link href={`/admin/banco/exportar/${encodeURIComponent(r.version)}`} prefetch={false}>
                    Exportar JSON
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Plantillas</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>Plantilla</th>
              <th>Modo</th>
              <th className="num">Reactivos</th>
              <th className="num">Minutos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plantillas.map(({ p, n }) => (
              <tr key={p.id}>
                <td>
                  <b>{p.nombre}</b>
                  <br />
                  <span className="xs">{p.id}</span>
                </td>
                <td>{p.modo}</td>
                <td className="num">{n}</td>
                <td className="num">{p.tiempoLimiteMin}</td>
                <td>
                  <form action={alternarPlantilla}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn disc">{p.activa ? "Desactivar" : "Activar"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Importaciones recientes</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Archivo</th>
              <th>Estado</th>
              <th className="num">Nuevas</th>
            </tr>
          </thead>
          <tbody>
            {importaciones.map((i) => (
              <tr key={i.id}>
                <td>
                  {formatoFecha(i.fecha, { day: "numeric", month: "short" })} {formatoHora(i.fecha)}
                </td>
                <td>{i.archivo}</td>
                <td>{i.estado === "aceptada" ? <span className="sem ok">Aceptada</span> : <span className="sem bad" title={i.errores ?? ""}>Rechazada</span>}</td>
                <td className="num">{i.versionesNuevas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
