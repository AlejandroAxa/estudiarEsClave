import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Enunciado, Explicacion, FichaDatos, FiguraRevision, Formula } from "@/components/formula";
import { Estructura } from "@/components/estructura";
import { Lock } from "lucide-react";
import { db } from "@/db";
import { duenoActual } from "@/lib/dueno";
import { intentoDe } from "@/lib/evaluacion/evaluacion";
import { cargarRevision } from "@/lib/evaluacion/resultados";
import { estadoPlan, incluido, planParaArea } from "@/lib/planes";
import { Reportar } from "@/components/reportar";
import { t } from "@/textos/es-MX";

export const metadata: Metadata = { title: "Revisión", robots: { index: false } };

export default async function Revision({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await duenoActual();
  const i = await intentoDe(db, id, d).catch(() => null);
  if (!i) notFound();
  if (i.estado !== "enviado") redirect(`/examen/${id}`);
  if (!i.cuentaId) redirect(`/entrar?siguiente=/examen/${id}/revision`);
  const plan = await estadoPlan(db, i.cuentaId);
  const items = await cargarRevision(db, id);
  const abiertas = new Map<string, boolean>();
  for (const a of new Set(items.map((x) => x.areaId))) abiertas.set(a, await incluido(db, planParaArea(plan, a), "argumentaciones"));
  const aciertos = items.filter((x) => x.correcta).length;

  return (
    <div className="angosto band pila">
      <Link href={i.modo === "practica" ? "/practica" : `/examen/${id}/resultado`} className="btn disc">
        ← Volver
      </Link>
      <h1 style={{ fontSize: "clamp(30px,5vw,48px)" }}>Revisión pregunta por pregunta</h1>
      <p className="lead">
        Acertaste {aciertos} de {items.length}. Lee el porqué de cada opción: ahí está lo que más se aprende.
      </p>
      {items.map((x, k) => {
        const abierto = abiertas.get(x.areaId);
        return (
          <article key={x.orden} className="hoja pila" id={`p${k + 1}`}>
            <div className="fila entre">
              <span className="small">
                {k + 1}. {x.subarea} · {x.tema}
              </span>
              <span className={`sem ${x.correcta ? "ok" : x.elegida ? "bad" : "na"}`}>{x.correcta ? "Acertada" : x.elegida ? "Fallada" : "Sin responder"}</span>
            </div>
            {x.texto && (
              <details>
                <summary className="btn disc">Ver lectura: {x.texto.titulo}</summary>
                <div className="lectura">
                  {x.texto.cuerpo.split("\n\n").map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </details>
            )}
            <FichaDatos datos={x.datos} />
            <Enunciado texto={x.enunciado} />
            <ul className="opciones">
              {x.opciones.map((o) => (
                <li key={o.letra}>
                  <div className={`opcion ${o.correcta ? "correcta" : x.elegida === o.letra ? "incorrecta" : ""}`} style={{ cursor: "default" }}>
                    <span className="burbuja">{o.letra}</span>
                    <span>
                      <Formula texto={o.texto} />
                      {x.elegida === o.letra && <span className="xs"> · tu respuesta</span>}
                      <span className="porque">
                        {abierto || o.correcta ? (
                          <>
                            <span className="etiqueta">{o.correcta ? "Por qué sí: " : "Por qué no: "}</span>
                            <Formula texto={o.argumentacion} />
                          </>
                        ) : (
                          <>
                            <Lock size={13} aria-hidden /> {t.muro.pase}
                          </>
                        )}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div>
              <h3>Procedimiento</h3>
              <Explicacion texto={x.explicacion} />
              <FiguraRevision figura={x.figura} />
              {x.smiles && <Estructura smiles={x.smiles} nombre="la molécula" />}
            </div>
            {abierto && x.referencias.length > 0 && (
              <p className="xs">
                Para estudiar: {x.referencias.map((r) => `${r.fuente} (${r.ubicacion})`).join("; ")}
              </p>
            )}
            <div className="fila entre">
              <span className="xs">Validado por: {x.validadoPor}</span>
              <Reportar reactivoId={x.reactivoId} version={x.version} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
