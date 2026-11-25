import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Lock, Share2 } from "lucide-react";
import { db } from "@/db";
import { duenoActual } from "@/lib/dueno";
import { intentoDe } from "@/lib/evaluacion/evaluacion";
import { cargarResultado } from "@/lib/evaluacion/resultados";
import { estadoPlan, incluido, planParaArea } from "@/lib/planes";
import { BarraRango, porcentaje, Semaforo } from "@/components/semaforo";
import { CuentaRegresiva } from "@/components/cuenta-regresiva";
import { ciclo } from "@/lib/consultas";
import { formatoFecha } from "@/lib/fechas";
import { Latido } from "@/components/marca";
import { t } from "@/textos/es-MX";
import { temaActual } from "@/lib/tema-sesion";

export const metadata: Metadata = { title: "Tus resultados", robots: { index: false } };

function Candado({ children, abierto, texto = t.muro.pase }: { children: React.ReactNode; abierto: boolean; texto?: string }) {
  if (abierto) return <>{children}</>;
  return (
    <div className="candado">
      <div className="velo" aria-hidden>
        {children}
      </div>
      <div className="sello">
        <div>
          <p style={{ margin: "0 0 10px", fontWeight: 700 }}>
            <Lock size={16} aria-hidden /> {texto}
          </p>
          <Link href="/planes" className="btn chico">
            Ver el pase
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function Resultado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await duenoActual();
  const i = await intentoDe(db, id, d).catch(() => null);
  const tema = await temaActual();
  if (!i) notFound();
  if (i.estado !== "enviado") redirect(`/examen/${id}`);
  const r = await cargarResultado(db, id);
  if (!r) notFound();
  const c = await ciclo();
  const plan = await estadoPlan(db, i.cuentaId);
  const mini = i.modo === "mini";

  if (mini) {
    return (
      <div className="wrap band pila">
        <span className="pastilla">Mini diagnóstico</span>
        <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Tu primera consulta</h1>
        <p className="lead">Con 3 preguntas por área solo podemos darte una lectura por área. Es un primer vistazo, no un diagnóstico completo.</p>
        <div className="hoja sin-pad">
          <div className="membrete">
            <b>
              <Latido className="" /> {tema.reporte}
            </b>
            <span>{formatoFecha(i.enviadoEn!)}</span>
          </div>
          <table className="lab">
            <thead>
              <tr>
                <th>Área</th>
                <th>Aciertos</th>
                <th>Rango deseable 80–100 %</th>
              </tr>
            </thead>
            <tbody>
              {r.areas.map((a) => (
                <tr key={a.r.areaId}>
                  <td>
                    {a.nombre}
                    <br />
                    <Semaforo nivel={a.r.nivel} />
                  </td>
                  <td className="num">
                    {a.r.aciertos} de {a.r.presentados}
                  </td>
                  <td>
                    <BarraRango valor={a.r.dominio == null ? null : Number(a.r.dominio)} etiqueta={a.nombre} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">{t.aviso.estimacion}</p>
        <div className="hoja pila">
          <h2 style={{ fontSize: 28 }}>¿Quieres saber qué estudiar primero?</h2>
          <p>Crea tu cuenta y presenta el diagnóstico completo por secciones. Tienes 3 días del pase completo, sin tarjeta.</p>
          <div className="fila">
            {i.cuentaId ? (
              <Link href="/diagnostico" className="btn">
                Ir a mi diagnóstico completo
              </Link>
            ) : (
              <Link href="/entrar?siguiente=/diagnostico" className="btn">
                Crear mi cuenta gratis
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const completo = await incluido(db, plan.plan, "resultado_completo");
  const abiertoArea = async (areaId: string) => incluido(db, planParaArea(plan, areaId), "resultado_completo");
  const areasAbiertas = new Set<string>();
  for (const a of r.areas) if (await abiertoArea(a.r.areaId)) areasAbiertas.add(a.r.areaId);
  const prioridades = r.subareas.filter((x) => x.r.lugarPrioridad).sort((a, b) => a.r.lugarPrioridad! - b.r.lugarPrioridad!);
  const global = r.res.global == null ? null : Number(r.res.global);
  const parcial = Number(r.res.cobertura) < 0.8;

  return (
    <div className="wrap band pila">
      <div className="fila entre">
        <span className="pastilla">{i.modo === "simulacro" ? "Simulacro" : i.modo === "muestra" ? "Simulacro de muestra" : "Diagnóstico completo"}</span>
        <div className="fila no-imprimir">
          <Link href={`/examen/${id}/revision`} className="btn sec chico">
            Revisar pregunta por pregunta
          </Link>
          {i.cuentaId && (
            <Link href="/avance#compartir" className="btn sec chico">
              <Share2 size={16} aria-hidden /> Compartir mi avance
            </Link>
          )}
        </div>
      </div>

      <div className="hoja sin-pad">
        <div className="membrete">
          <b>
            <Latido className="" /> {tema.reporte}
          </b>
          <span>Resultados del diagnóstico</span>
        </div>
        <div className="meta">
          <div>
            Fecha<b>{formatoFecha(i.enviadoEn!)}</b>
          </div>
          <div>
            Algoritmo<b>{r.res.versionAlgoritmo}</b>
          </div>
          <div>
            Cobertura del examen<b>{Math.round(Number(r.res.cobertura) * 100)} %</b>
          </div>
        </div>
        <div style={{ padding: "24px 20px" }} className="rejilla-2">
          <div>
            <span className="small">Calificación global {parcial ? "(parcial)" : ""}</span>
            <div className="calif">{global == null ? "—" : Math.round(global)}</div>
            <div style={{ marginTop: 8 }}>
              <Semaforo nivel={r.res.nivel} />
            </div>
            <p className="xs" style={{ marginTop: 10 }}>
              {t.aviso.estimacion} De 0 a 100, ponderada por el peso de cada subárea en el examen.
            </p>
          </div>
          <div>
            <h3>Lo que dice tu resultado</h3>
            <p>{r.res.descripcion}</p>
            <CuentaRegresiva fecha={c?.fechaExamen ?? null} examen="EXANI-II" />
          </div>
        </div>
      </div>

      <section className="hoja pila" aria-labelledby="prioridades">
        <h2 id="prioridades" style={{ fontSize: 28 }}>
          Tus 3 prioridades
        </h2>
        <p className="small">Lo que más vale en el examen y menos dominas va primero.</p>
        {prioridades.length === 0 && <p>Ninguna subárea quedó por debajo de «Dominas». Mantén el ritmo con tu {tema.practica.toLowerCase()}.</p>}
        <ol className="opciones">
          {prioridades.map((p, k) => {
            const abierto = k === 0 || (completo && areasAbiertas.has(p.areaId));
            return (
              <li key={p.r.subareaId}>
                <Candado abierto={abierto}>
                  <div className="opcion" style={{ cursor: "default", alignItems: "center" }}>
                    <span className="burbuja">{k + 1}</span>
                    <span style={{ flex: 1 }}>
                      <b>{p.nombre}</b>
                      <span className="porque">
                        Vale {p.peso} preguntas del examen · dominio {porcentaje(p.r.dominio)} · <Semaforo nivel={p.r.nivel} />
                      </span>
                    </span>
                    <Link href={`/practica?subarea=${p.r.subareaId}`} className="btn chico">
                      Estudiar
                    </Link>
                  </div>
                </Candado>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="hoja sin-pad" aria-labelledby="mapa">
        <div className="membrete">
          <b id="mapa">Mapa por área y subárea</b>
          <span>Rango de referencia: 80–100 %</span>
        </div>
        <div className="desplazable">
          <table className="lab">
            <thead>
              <tr>
                <th>Estudio</th>
                <th>Resultado</th>
                <th>Nivel</th>
                <th style={{ minWidth: 160 }}>Rango</th>
              </tr>
            </thead>
            <tbody>
              {r.areas.map((a) => (
                <FilasArea key={a.r.areaId} a={a} subareas={r.subareas.filter((x) => x.areaId === a.r.areaId)} abierta={completo && areasAbiertas.has(a.r.areaId)} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hoja pila" aria-labelledby="temas">
        <h2 id="temas" style={{ fontSize: 24 }}>
          Por tema
        </h2>
        <p className="small">Con menos de 3 preguntas por tema no hay datos suficientes; por eso el mapa principal va por subárea.</p>
        <Candado abierto={completo}>
          <div className="rejilla">
            {r.temas.map((x) => (
              <div key={x.r.temaId} className="fila entre" style={{ borderBottom: "1px solid var(--linea)", paddingBottom: 6 }}>
                <span className="small">{x.nombre}</span>
                <span className="xs">
                  {x.r.aciertos}/{x.r.presentados}
                </span>
              </div>
            ))}
          </div>
        </Candado>
      </section>

      <section className="hoja pila" aria-labelledby="errores">
        <h2 id="errores" style={{ fontSize: 24 }}>
          Errores frecuentes
        </h2>
        {r.errores.length === 0 ? (
          <p>Ningún tipo de error se repitió 2 veces o más. Tus fallos parecen descuidos sueltos.</p>
        ) : (
          r.errores.map((e, k) => (
            <Candado key={e.r.errorId} abierto={k === 0 || completo}>
              <div style={{ borderLeft: "4px solid var(--lila)", paddingLeft: 14 }}>
                <b>
                  {e.descripcion} <span className="xs">({e.r.veces} veces)</span>
                </b>
                <p className="small" style={{ margin: 0 }}>
                  {e.recomendacion}
                </p>
              </div>
            </Candado>
          ))
        )}
      </section>

      {!completo && (
        <section className="noche hoja pila" style={{ background: "var(--noche)" }}>
          <h2 style={{ fontSize: 28, color: "#fff" }}>Ya sabes qué te falta. El pase te abre todo.</h2>
          <p className="lead">Prioridades 2 y 3, mapa por tema, las argumentaciones de cada opción y el repaso espaciado. Un solo pago hasta el día del examen.</p>
          <div className="fila">
            <Link href="/planes" className="btn">
              Ver planes
            </Link>
            <Link href="/planes#familia" className="btn sec">
              {t.muro.familia}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function FilasArea({
  a,
  subareas,
  abierta,
}: {
  a: { r: { areaId: string; dominio: string | null; nivel: string | null; aciertos: number; presentados: number }; nombre: string };
  subareas: { r: { subareaId: string; dominio: string | null; nivel: string | null; aciertos: number; presentados: number }; nombre: string; peso: number }[];
  abierta: boolean;
}) {
  return (
    <>
      <tr className="grupo">
        <td>{a.nombre}</td>
        <td className="num">{porcentaje(a.r.dominio)}</td>
        <td>
          <Semaforo nivel={a.r.nivel} />
        </td>
        <td>
          <BarraRango valor={a.r.dominio == null ? null : Number(a.r.dominio)} etiqueta={a.nombre} />
        </td>
      </tr>
      {subareas.map((x) => (
        <tr key={x.r.subareaId} style={abierta ? undefined : { filter: "blur(4px)" }} aria-hidden={abierta ? undefined : true}>
          <td style={{ paddingLeft: 36 }}>
            {x.nombre}
            <span className="xs"> · vale {x.peso}</span>
          </td>
          <td className="num">
            {x.r.aciertos}/{x.r.presentados}
          </td>
          <td>
            <Semaforo nivel={x.r.nivel} />
          </td>
          <td>
            <BarraRango valor={x.r.dominio == null ? null : Number(x.r.dominio)} etiqueta={x.nombre} />
          </td>
        </tr>
      ))}
      {!abierta && (
        <tr>
          <td colSpan={4} className="xs" style={{ paddingLeft: 36 }}>
            <Lock size={12} aria-hidden /> Detalle por subárea incluido en el pase
          </td>
        </tr>
      )}
    </>
  );
}
