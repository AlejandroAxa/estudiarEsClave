import { desc } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAdmin } from "@/lib/sesion";
import { guardarCiclo, guardarProducto, guardarPromocion } from "@/app/acciones/admin";
import { FormularioCupon } from "./cupon";

export const dynamic = "force-dynamic";

export default async function Comercio() {
  await requerirAdmin();
  const [productos, cupones, promos, ciclos] = await Promise.all([
    db.select().from(s.producto).orderBy(s.producto.orden),
    db.select().from(s.cupon).orderBy(desc(s.cupon.vigenteHasta)),
    db.select().from(s.promocion),
    db.select().from(s.cicloAdmision).orderBy(s.cicloAdmision.examenId),
  ]);
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Precios y promociones</h1>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Fecha del examen</h2>
        <p className="small">Con la fecha se calculan la cuenta regresiva, la promoción del último mes y el fin de los pases. Déjala vacía si aún no es oficial.</p>
        {ciclos.map((c) => (
          <form key={`${c.examenId}-${c.anio}`} action={guardarCiclo} className="fila" style={{ flexWrap: "wrap", alignItems: "end" }}>
            <input type="hidden" name="examenId" value={c.examenId} />
            <input type="hidden" name="anio" value={c.anio} />
            <b style={{ minWidth: 140 }}>
              {c.examenId} {c.anio}
            </b>
            <label className="campo">
              Examen
              <input type="date" name="fecha" defaultValue={c.fechaExamen ?? ""} />
            </label>
            <label className="campo">
              Convocatoria
              <input type="date" name="convocatoria" defaultValue={c.convocatoriaEn ?? ""} />
            </label>
            <button className="btn sec">Guardar</button>
          </form>
        ))}
      </section>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Productos</h2>
        {productos.map((p) => (
          <form key={p.sku} action={guardarProducto} className="fila" style={{ flexWrap: "wrap", alignItems: "end" }}>
            <input type="hidden" name="sku" value={p.sku} />
            <span style={{ minWidth: 220 }}>
              <b>{p.nombre}</b>
              <br />
              <span className="xs">
                {p.sku} · áreas: {p.areas ?? "todas"}
              </span>
            </span>
            <label className="campo">
              Precio MXN (IVA incluido)
              <input type="number" name="precio" step="1" min="1" defaultValue={Number(p.precioMxn)} required />
            </label>
            <label className="casilla">
              <input type="checkbox" name="activo" defaultChecked={p.activo} />
              <span>A la venta</span>
            </label>
            <button className="btn sec">Guardar</button>
          </form>
        ))}
      </section>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Promoción del último mes</h2>
        {promos.map((p) => (
          <form key={p.id} action={guardarPromocion} className="fila" style={{ flexWrap: "wrap", alignItems: "end" }}>
            <input type="hidden" name="id" value={p.id} />
            <b style={{ minWidth: 160 }}>{p.id}</b>
            <label className="campo">
              Descuento %
              <input type="number" name="pct" min="1" max="100" defaultValue={p.descuentoPct} />
            </label>
            <label className="campo">
              Días antes del examen
              <input type="number" name="dias" min="1" max="365" defaultValue={p.diasAntesExamen} />
            </label>
            <label className="casilla">
              <input type="checkbox" name="activa" defaultChecked={p.activa} />
              <span>Activa</span>
            </label>
            <button className="btn sec">Guardar</button>
          </form>
        ))}
      </section>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Cupones</h2>
        <FormularioCupon />
        <table className="tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th className="num">%</th>
              <th>Vence</th>
              <th className="num">Usos</th>
            </tr>
          </thead>
          <tbody>
            {cupones.map((c) => (
              <tr key={c.codigo}>
                <td>{c.codigo}</td>
                <td className="num">{c.descuentoPct}</td>
                <td>{c.vigenteHasta}</td>
                <td className="num">
                  {c.usos} / {c.usosMax}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
