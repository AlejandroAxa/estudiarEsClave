import type { Metadata } from "next";
import { db } from "@/db";
import { requerirAlumno } from "@/lib/sesion";
import { cuota, estadoPlan, incluido, planParaArea } from "@/lib/planes";
import { pendientesRepaso, poolPractica, taxonomiaDe } from "@/lib/evaluacion/evaluacion";
import { formatoHora } from "@/lib/fechas";
import { temaDeRuta } from "@/lib/tema-area";
import { FormPractica } from "./form";
import { eq } from "drizzle-orm";
import * as s from "@/db/schema";

export const metadata: Metadata = { title: "Práctica diaria" };

export default async function Practica({ searchParams }: { searchParams: Promise<{ subarea?: string; repaso?: string }> }) {
  const ses = await requerirAlumno("/practica");
  const { subarea, repaso } = await searchParams;
  const tema = temaDeRuta(ses.perfil.rutaId);
  const plan = await estadoPlan(db, ses.cuenta.id);
  const c = await cuota(db, ses.cuenta.id, "practica", plan.plan);
  const rep = await pendientesRepaso(db, ses.cuenta.id);
  const repasoIncluido = await incluido(db, plan.plan, "repaso");
  const { items } = await poolPractica(db, ses.cuenta.id, ses.perfil.rutaId, {});
  const areaIds = (await db.select({ id: s.area.id }).from(s.area).where(eq(s.area.examenId, ses.perfil.examenId))).map((a) => a.id);
  const tax = await taxonomiaDe(db, areaIds);
  const disponibles = new Map<string, number>();
  for (const i of items) disponibles.set(i.subareaId, (disponibles.get(i.subareaId) ?? 0) + 1);

  return (
    <div className="wrap band pila">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>{tema.practicaTitulo}</h1>
      <p className="lead">{tema.practica}: 10 preguntas. Al responder ves la correcta, el procedimiento y por qué cada opción es o no es.</p>
      {c.restante != null && (
        <p className="aviso">
          Plan gratis: te quedan {c.restante} de {c.cantidad} preguntas hoy.{c.recargaEn ? ` Se recargan a las ${formatoHora(c.recargaEn)} (hora del centro).` : ""}
        </p>
      )}
      {items.length === 0 && (
        <p className="aviso">
          Para cuidar tu diagnóstico, las preguntas del banco se abren a la práctica cuando las ves en tu revisión. Presenta tu diagnóstico completo y aquí
          aparecerán.
        </p>
      )}
      <div className="rejilla-2">
        <div className="hoja pila">
          <h2 style={{ fontSize: 24 }}>{tema.bloqueGeneral}</h2>
          <p className="small">Mezcla de todo, empezando por lo que nunca has practicado.</p>
          <FormPractica etiqueta={tema.tomar} deshabilitado={!c.permitido || !items.length} muro={c.permitido ? null : c.textoMuro} />
        </div>
        <div className="hoja pila">
          <h2 style={{ fontSize: 24 }}>Repaso espaciado</h2>
          <p className="small">
            Lo que fallaste vuelve a los 1, 3 y 7 días. Hoy tienes {rep.pendientes.length} pendientes{rep.enEspera ? ` y ${rep.enEspera} en espera` : ""}.
          </p>
          <FormPractica
            etiqueta="Repasar ahora"
            repaso
            deshabilitado={!repasoIncluido || rep.pendientes.length === 0 || !ses.perfil.repasoEspaciado}
            muro={!repasoIncluido ? "El repaso espaciado viene con el pase." : !ses.perfil.repasoEspaciado ? "Lo apagaste en tu cuenta." : null}
            autoIniciar={repaso === "1"}
          />
        </div>
      </div>
      <section className="hoja pila">
        <h2 style={{ fontSize: 24 }}>Por subárea</h2>
        {tax.map((a) => {
          const abierta = planParaArea(plan, a.id) !== "gratis" || plan.plan === "gratis";
          return (
            <div key={a.id}>
              <h3>{a.nombre}</h3>
              <div className="rejilla">
                {a.subareas.map((x) => (
                  <div key={x.id} className="fila entre" style={{ borderBottom: "1px solid var(--linea)", paddingBottom: 8 }}>
                    <span>
                      {x.nombre}
                      <span className="xs"> · {disponibles.get(x.id) ?? 0} disponibles</span>
                    </span>
                    <FormPractica
                      etiqueta="Practicar"
                      subarea={x.id}
                      chico
                      deshabilitado={!c.permitido || !(disponibles.get(x.id) ?? 0) || !abierta}
                      autoIniciar={subarea === x.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
