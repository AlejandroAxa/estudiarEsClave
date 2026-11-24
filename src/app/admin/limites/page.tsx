import { db } from "@/db";
import * as s from "@/db/schema";
import { requerirAdmin } from "@/lib/sesion";
import { guardarLimite } from "@/app/acciones/admin";

export const dynamic = "force-dynamic";
const PLANES = ["anonimo", "gratis", "prueba", "pase"];

export default async function Limites() {
  await requerirAdmin();
  const filas = (await db.select().from(s.limitePlan)).sort((a, b) => a.recurso.localeCompare(b.recurso) || PLANES.indexOf(a.plan) - PLANES.indexOf(b.plan));
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Límites del plan</h1>
      <p className="small">Vacío = sin límite; 0 = no disponible. El texto del muro es lo que ve el alumno cuando llega al límite.</p>
      <div className="hoja desplazable">
        <table className="tabla">
          <thead>
            <tr>
              <th>Recurso</th>
              <th>Plan</th>
              <th>Cantidad</th>
              <th>Periodo</th>
              <th>Texto del muro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const id = `l-${f.plan}-${f.recurso}`;
              return (
                <tr key={id}>
                  <td>{f.recurso}</td>
                  <td>{f.plan}</td>
                  <td>
                    <input form={id} name="cantidad" type="number" min="0" defaultValue={f.cantidad ?? ""} style={{ width: 80 }} aria-label="Cantidad" />
                  </td>
                  <td>
                    <select form={id} name="periodo" defaultValue={f.periodo} aria-label="Periodo">
                      <option value="dia">día</option>
                      <option value="semana">semana</option>
                      <option value="mes">mes</option>
                      <option value="temporada">temporada</option>
                    </select>
                  </td>
                  <td>
                    <input form={id} name="muro" defaultValue={f.textoMuro ?? ""} aria-label="Texto del muro" />
                  </td>
                  <td>
                    <form id={id} action={guardarLimite}>
                      <input type="hidden" name="plan" value={f.plan} />
                      <input type="hidden" name="recurso" value={f.recurso} />
                      <button className="btn disc">Guardar</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
