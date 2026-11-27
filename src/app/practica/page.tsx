import type { Metadata } from "next";
import { db } from "@/db";
import { requerirAlumno } from "@/lib/sesion";
import { cuota, estadoPlan, incluido, planParaArea } from "@/lib/planes";
import { pendientesRepaso, poolPractica, taxonomiaDe } from "@/lib/evaluacion/evaluacion";
import { formatoHora } from "@/lib/fechas";
import { temaDeRuta } from "@/lib/tema-area";
import { FormPractica } from "./form";
import Link from "next/link";
import { Lock, RotateCcw, Shuffle } from "lucide-react";
import { CabeceraApp, TituloBloque } from "@/components/cabecera-app";
import { AvisoPlanArea } from "@/components/aviso-plan-area";
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

  const conPreguntas = tax
    .map((a) => ({ ...a, total: a.subareas.reduce((n, x) => n + (disponibles.get(x.id) ?? 0), 0) }))
    .filter((a) => a.total > 0)
    // Lo que no cuenta para el puntaje (Inglés) va al final.
    .sort((a, b) => Number(b.cuentaPuntaje) - Number(a.cuentaPuntaje));
  const sinPreguntas = tax.length - conPreguntas.length;

  return (
    <>
      <CabeceraApp
        tema={tema.tema}
        acento={tema.acento}
        ceja={tema.area}
        titulo={tema.practicaTitulo}
        sub="Diez preguntas a la vez. Al responder ves la correcta, el procedimiento y por qué cada opción es o no es."
        cifras={[
          { valor: items.length.toLocaleString("es-MX"), etiqueta: "Preguntas disponibles" },
          { valor: rep.pendientes.length, etiqueta: "Errores por repasar hoy", nota: rep.enEspera ? `${rep.enEspera} en espera` : undefined },
          {
            valor: c.restante != null ? <>{c.restante}<small>/{c.cantidad}</small></> : "Sin límite",
            etiqueta: c.restante != null ? "Te quedan hoy" : "Tu plan",
            nota: c.recargaEn ? `Se recargan a las ${formatoHora(c.recargaEn)}` : undefined,
          },
        ]}
      />
      <div className="wrap app-cuerpo">
        <AvisoPlanArea plan={plan} rutaId={ses.perfil.rutaId} />
        {items.length === 0 && (
          <p className="aviso">
            Para cuidar tu diagnóstico, las preguntas del banco se abren a la práctica cuando las ves en tu revisión. Presenta tu diagnóstico completo y
            aquí aparecerán.
          </p>
        )}
        <div className="app-rejilla">
          <section className="tarjeta destacada c-7" aria-labelledby="mezcla">
            <div className="tarjeta-cabeza">
              <span className="icono-chip">
                <Shuffle size={20} aria-hidden />
              </span>
              <h2 id="mezcla">{tema.bloqueGeneral}</h2>
              <span className="insignia-recomendada">Recomendado</span>
            </div>
            <p className="small">Mezcla de todo tu examen, empezando por lo que nunca has practicado y por tus prioridades.</p>
            <div className="pie-tarjeta">
              <FormPractica etiqueta={tema.tomar} deshabilitado={!c.permitido || !items.length} muro={c.permitido ? null : c.textoMuro} />
            </div>
          </section>
          <section className="tarjeta c-5" aria-labelledby="repaso">
            <div className="tarjeta-cabeza">
              <span className="icono-chip">
                <RotateCcw size={20} aria-hidden />
              </span>
              <h2 id="repaso">Repaso espaciado</h2>
              <span className="dato-meta">{rep.pendientes.length} hoy</span>
            </div>
            <p className="small">Lo que fallaste vuelve a los 1, 3 y 7 días, justo cuando estás por olvidarlo.</p>
            <div className="pie-tarjeta">
              <FormPractica
                etiqueta="Repasar ahora"
                repaso
                deshabilitado={!repasoIncluido || rep.pendientes.length === 0 || !ses.perfil.repasoEspaciado}
                muro={!repasoIncluido ? "El repaso espaciado viene con el pase." : !ses.perfil.repasoEspaciado ? "Lo apagaste en tu cuenta." : null}
                autoIniciar={repaso === "1"}
              />
            </div>
          </section>
        </div>

        <section aria-labelledby="temas">
          <TituloBloque ojo="O elige un tema" titulo="Por subárea" id="temas">
            Solo las materias de tu examen con preguntas abiertas.
          </TituloBloque>
          <div className="tarjeta">
            {conPreguntas.map((a) => {
              // Con un pase que no abre esta área se practica con la cuota de prueba o gratis.
              const abierta = planParaArea(plan, a.id) === plan.plan;
              return (
                <div key={a.id} className="grupo-temas">
                  <h3>
                    {a.nombre}
                    {!a.cuentaPuntaje && <span className="dato-meta">No cuenta para tu puntaje</span>}
                    {!abierta && (
                      <span className="dato-meta">
                        <Lock size={12} aria-hidden /> Fuera de tu plan: cuenta en tu límite diario
                      </span>
                    )}
                  </h3>
                  <ul className="lista-temas">
                    {a.subareas
                      .filter((x) => (disponibles.get(x.id) ?? 0) > 0)
                      .map((x) => (
                        <li key={x.id}>
                          <span>
                            <b>{x.nombre}</b>
                            <span className="xs">{disponibles.get(x.id)} preguntas</span>
                          </span>
                          <FormPractica etiqueta="Practicar" subarea={x.id} chico deshabilitado={abierta && !c.permitido} autoIniciar={subarea === x.id} />
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
            {conPreguntas.length === 0 && <p className="small">Todavía no hay temas abiertos para practicar.</p>}
            {sinPreguntas > 0 && conPreguntas.length > 0 && (
              <p className="xs" style={{ marginTop: 18 }}>
                Las demás materias del banco no son de tu área. Si cambiaste de carrera, actualízala en <Link href="/diagnostico">Diagnóstico</Link>.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
