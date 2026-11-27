"use client";
/**
 * Pantalla de consulta: una pregunta por pantalla, lectura al lado, marcar para
 * revisar, navegación libre dentro de la sección, cronómetro y guardado
 * automático con cola local para cuando se va la señal (RF-15 a RF-17, RNF-04).
 */
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, CloudOff, Check, Lock } from "lucide-react";
import { accionEnviar, accionIniciarSeccion, accionTerminarSeccion } from "@/app/acciones/examen";
import type { ItemVisible, Letra, Retroalimentacion } from "@/lib/evaluacion/evaluacion";
import { t } from "@/textos/es-MX";

interface Seccion {
  numero: number;
  area: string;
  estado: "pendiente" | "en_curso" | "terminada";
  venceEn: string | null;
  minutos: number;
}
interface Props {
  intento: { id: string; modo: string; venceEn: string; global: boolean };
  secciones: Seccion[];
  items: ItemVisible[];
  textos: Record<string, { titulo: string; cuerpo: string; esVerso: boolean; autoria: string | null }>;
  ahoraServidor: string;
  /** Palabras del área del alumno (src/lib/tema-area.ts). */
  vocabulario?: { practica: string; aciertos: string[] };
}
interface Pendiente {
  orden: number;
  letra: Letra | null;
  marcada: boolean;
  tiempoMs: number;
  idIdempotencia: string;
}

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)));

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function Examen({ intento, secciones, items, textos, ahoraServidor, vocabulario }: Props) {
  const voc = vocabulario ?? { practica: "Práctica diaria", aciertos: t.practica.aciertos };
  const router = useRouter();
  const practica = intento.modo === "practica";
  const [desfase] = useState(() => new Date(ahoraServidor).getTime() - Date.now());
  const claveCola = `eec:cola:${intento.id}`;

  const [resp, setResp] = useState<Record<number, Letra | null>>(() => Object.fromEntries(items.map((i) => [i.orden, i.respuesta])));
  const [marc, setMarc] = useState<Record<number, boolean>>(() => Object.fromEntries(items.map((i) => [i.orden, i.marcada])));
  const [retro, setRetro] = useState<Record<number, Retroalimentacion>>({});
  const [pendientes, setPendientes] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [muro, setMuro] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => Date.now() + desfase);
  const [ocupado, iniciar] = useTransition();
  const inicioPregunta = useRef(0);
  /** En celular la lectura y la pregunta van en pestañas para no subir y bajar todo el texto. */
  const [vista, setVista] = useState<"lectura" | "pregunta">("lectura");
  const ultimoTexto = useRef<string | null>(null);

  const enCurso = secciones.find((s) => s.estado === "en_curso");
  const visibles = useMemo(
    () => (intento.global || practica ? items : items.filter((i) => i.seccion === enCurso?.numero)),
    [items, enCurso?.numero, intento.global, practica],
  );
  const primeraSinResponder = Math.max(0, visibles.findIndex((i) => resp[i.orden] == null));
  const [idx, setIdx] = useState(primeraSinResponder);
  const actual = visibles[Math.min(idx, visibles.length - 1)];

  // Cola local: guarda primero en el teléfono y luego en el servidor.
  const leerCola = useCallback((): Pendiente[] => {
    try {
      return JSON.parse(localStorage.getItem(claveCola) ?? "[]");
    } catch {
      return [];
    }
  }, [claveCola]);
  const escribirCola = useCallback(
    (c: Pendiente[]) => {
      localStorage.setItem(claveCola, JSON.stringify(c));
      setPendientes(c.length);
    },
    [claveCola],
  );

  const enviarUno = useCallback(
    async (p: Pendiente) => {
      const r = await fetch(`/api/intentos/${intento.id}/respuestas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (r.status === 204) return { ok: true as const };
      const j = await r.json().catch(() => ({}));
      if (r.ok) return { ok: true as const, retro: j.retro as Retroalimentacion };
      if (r.status === 402) return { ok: false as const, definitivo: true, muro: j.error as string };
      if (r.status === 409 || r.status === 403 || r.status === 404 || r.status === 400) return { ok: false as const, definitivo: true, error: j.error as string };
      return { ok: false as const, definitivo: false };
    },
    [intento.id],
  );

  const vaciarCola = useCallback(async () => {
    let cola = leerCola();
    while (cola.length) {
      const p = cola[0];
      let r;
      try {
        r = await enviarUno(p);
      } catch {
        setAviso(t.errores.sinRed);
        return false;
      }
      if (!r.ok && !r.definitivo) {
        setAviso(t.errores.sinRed);
        return false;
      }
      cola = leerCola().filter((x) => x.idIdempotencia !== p.idIdempotencia);
      escribirCola(cola);
      if (r.ok && r.retro) setRetro((prev) => ({ ...prev, [p.orden]: r.retro! }));
      if (!r.ok && r.muro) {
        setMuro(r.muro);
        setResp((prev) => ({ ...prev, [p.orden]: null }));
      }
      if (!r.ok && r.error) {
        setAviso(r.error);
        if (/tiempo|cerrad|envi/i.test(r.error)) router.refresh();
      }
    }
    setAviso(null);
    return true;
  }, [enviarUno, escribirCola, leerCola, router]);

  useEffect(() => {
    // Sincroniza con la cola guardada en localStorage (sistema externo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendientes(leerCola().length);
    vaciarCola();
    const alVolver = () => vaciarCola();
    window.addEventListener("online", alVolver);
    const t1 = setInterval(() => leerCola().length && vaciarCola(), 8000);
    const t2 = setInterval(() => setAhora(Date.now() + desfase), 1000);
    return () => {
      window.removeEventListener("online", alVolver);
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [vaciarCola, leerCola, desfase]);

  useEffect(() => {
    inicioPregunta.current = Date.now();
  }, [actual?.orden]);

  // Al llegar a una lectura nueva se abre en la lectura; las siguientes preguntas del mismo texto, en la pregunta.
  useEffect(() => {
    const id = actual?.textoId ?? null;
    if (id === ultimoTexto.current) return;
    ultimoTexto.current = id;
    setVista(id ? "lectura" : "pregunta");
  }, [actual?.textoId]);

  const guardar = (orden: number, letra: Letra | null, marcada: boolean) => {
    // eslint-disable-next-line react-hooks/purity -- se llama desde un evento, no al dibujar
    const p: Pendiente = { orden, letra, marcada, tiempoMs: Date.now() - inicioPregunta.current, idIdempotencia: uuid() };
    escribirCola([...leerCola().filter((x) => x.orden !== orden || practica), p]);
    vaciarCola();
  };

  const elegir = (letra: Letra) => {
    if (!actual) return;
    if (practica && (resp[actual.orden] != null || retro[actual.orden])) return;
    setResp((r) => ({ ...r, [actual.orden]: letra }));
    guardar(actual.orden, letra, !!marc[actual.orden]);
  };
  const marcar = () => {
    if (!actual) return;
    const m = !marc[actual.orden];
    setMarc((x) => ({ ...x, [actual.orden]: m }));
    guardar(actual.orden, resp[actual.orden] ?? null, m);
  };

  // Cronómetro: por sección en el diagnóstico, global en simulacro y mini.
  const vence = practica ? null : intento.global ? new Date(intento.venceEn).getTime() : enCurso?.venceEn ? new Date(enCurso.venceEn).getTime() : null;
  const restante = vence ? vence - ahora : null;
  const cerrando = useRef(false);

  const terminar = useCallback(
    async (motivo: "boton" | "tiempo") => {
      if (cerrando.current) return;
      cerrando.current = true;
      await vaciarCola();
      if (intento.global || practica) {
        const r = await accionEnviar(intento.id);
        if (r.error) setAviso(r.error);
        localStorage.removeItem(claveCola);
        router.push(practica ? `/examen/${intento.id}/resumen` : `/examen/${intento.id}/resultado`);
        return;
      }
      if (!enCurso) return;
      const r = await accionTerminarSeccion(intento.id, enCurso.numero);
      if (r.error) setAviso(r.error);
      if (r.enviado) {
        localStorage.removeItem(claveCola);
        router.push(`/examen/${intento.id}/resultado`);
      } else {
        if (motivo === "tiempo") setAviso("Se acabó el tiempo de la sección. Lo que respondiste quedó guardado.");
        cerrando.current = false;
        setIdx(0);
        router.refresh();
      }
    },
    [vaciarCola, intento.global, intento.id, practica, enCurso, claveCola, router],
  );

  useEffect(() => {
    // El reloj es externo: al llegar a cero se cierra la sección.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restante != null && restante <= 0) terminar("tiempo");
  }, [restante, terminar]);

  /* ── Pantalla entre secciones (diagnóstico) ── */
  if (!practica && !intento.global && !enCurso) {
    const siguiente = secciones.find((s) => s.estado === "pendiente");
    const hechas = secciones.filter((s) => s.estado === "terminada").length;
    return (
      <div className="angosto band pila">
        {aviso && <p className="aviso">{aviso}</p>}
        <span className="pastilla">
          Sección {hechas + 1} de {secciones.length}
        </span>
        {hechas > 0 && (
          <p className="aviso ok aparece">
            <Check size={16} aria-hidden /> Sección terminada: +50 puntos. Tus respuestas están guardadas; los aciertos los verás al final.
          </p>
        )}
        {siguiente ? (
          <>
            <h1 style={{ fontSize: "clamp(30px,5vw,48px)" }}>{siguiente.area}</h1>
            <p className="lead">
              {items.filter((i) => i.seccion === siguiente.numero).length} preguntas · {siguiente.minutos} minutos. El cronómetro empieza cuando toques el botón.
            </p>
            <p className="small">Puedes tomar una pausa aquí y seguir otro día: el diagnóstico te espera 7 días.</p>
            <div className="fila">
              <button
                className="btn"
                disabled={ocupado}
                onClick={() =>
                  iniciar(async () => {
                    const r = await accionIniciarSeccion(intento.id, siguiente.numero);
                    if (r?.error) setAviso(r.error);
                    cerrando.current = false;
                    setIdx(0);
                    router.refresh();
                  })
                }
              >
                Empezar sección
              </button>
              <Link href="/inicio" className="btn sec">
                Tomar una pausa
              </Link>
            </div>
            <ol className="small" style={{ marginTop: 24 }}>
              {secciones.map((s) => (
                <li key={s.numero}>
                  {s.area} {s.estado === "terminada" ? "· terminada" : ""}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>Calificando…</p>
        )}
      </div>
    );
  }

  if (!actual) return <div className="angosto band">No hay preguntas en este intento.</div>;

  const texto = actual.textoId ? textos[actual.textoId] : null;
  const r = retro[actual.orden];
  const elegida = resp[actual.orden];
  const respondidas = visibles.filter((i) => resp[i.orden] != null).length;
  const ultima = idx >= visibles.length - 1;
  const frase = (arr: readonly string[]) => arr[actual.orden % arr.length];

  return (
    <div>
      <div className="barra-examen">
        <div className="wrap fila entre">
          <div className="fila" style={{ gap: 16 }}>
            <b>{practica ? voc.practica : intento.global ? (intento.modo === "mini" ? "Mini diagnóstico" : "Simulacro") : enCurso?.area}</b>
            <span className="small">
              {respondidas} de {visibles.length} respondidas
            </span>
            {practica && (
              <span className="progreso-practica" aria-hidden>
                <span style={{ width: `${(respondidas / Math.max(1, visibles.length)) * 100}%` }} />
              </span>
            )}
          </div>
          <div className="fila" style={{ gap: 16 }}>
            <span className={`estado-red ${pendientes ? "pendiente" : ""}`} aria-live="polite">
              {pendientes ? (
                <>
                  <CloudOff size={14} aria-hidden /> {pendientes} por guardar
                </>
              ) : (
                <>
                  <Check size={14} aria-hidden /> Guardado
                </>
              )}
            </span>
            {restante != null && (
              <span className={`reloj ${restante < 120000 ? "poco" : ""}`} role="timer" aria-label="Tiempo restante">
                {mmss(restante)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingBlock: 24 }}>
        {aviso && (
          <p className="aviso" role="status">
            {aviso}
          </p>
        )}
        {muro && (
          <div className="hoja pila" style={{ marginBottom: 20 }}>
            <p style={{ margin: 0 }}>
              <Lock size={16} aria-hidden /> {muro}
            </p>
            <div className="fila">
              <Link href="/planes" className="btn chico">
                Ver el pase
              </Link>
              <Link href="/planes#familia" className="btn sec chico">
                {t.muro.familia}
              </Link>
              <Link href="/inicio" className="btn disc">
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
        {texto && (
          <div className="pestanas-lectura" role="tablist" aria-label="Lectura y pregunta">
            <button role="tab" aria-selected={vista === "lectura"} aria-controls="panel-lectura" onClick={() => setVista("lectura")}>
              Lectura
            </button>
            <button role="tab" aria-selected={vista === "pregunta"} aria-controls="panel-pregunta" onClick={() => setVista("pregunta")}>
              Pregunta {idx + 1}
              {elegida ? <Check size={14} aria-hidden /> : null}
            </button>
          </div>
        )}
        <div className={`consulta ${texto ? `con-lectura ver-${vista}` : ""}`}>
          {texto && (
            <article id="panel-lectura" className={`hoja lectura ${texto.esVerso ? "verso" : ""}`} aria-label="Lectura" tabIndex={0}>
              <header className="lectura-cabeza">
                <span className="lectura-ceja">Lectura · {texto.cuerpo.split(/\s+/).length} palabras</span>
                {texto.titulo && <h3>{texto.titulo}</h3>}
              </header>
              <div className="lectura-cuerpo">
                {texto.cuerpo.split("\n\n").map((p, k) => (
                  <p key={k} data-n={texto.esVerso ? undefined : k + 1}>
                    {p}
                  </p>
                ))}
              </div>
              {texto.autoria && <p className="lectura-autoria">{texto.autoria}</p>}
              <button className="btn chico lectura-ir" onClick={() => setVista("pregunta")}>
                Ir a la pregunta <ChevronRight size={18} aria-hidden />
              </button>
            </article>
          )}
          <section id="panel-pregunta" className="hoja panel-pregunta" aria-labelledby="enunciado">
            <div className="fila entre">
              <span className="small">
                {practica && actual.materia && <span className="materia-pregunta">{actual.materia}</span>}
                Pregunta {idx + 1} de {visibles.length}
                {texto && (
                  <button className="enlace-lectura" onClick={() => setVista("lectura")}>
                    Volver a la lectura
                  </button>
                )}
              </span>
              {!practica && (
                <button className="btn disc" onClick={marcar} aria-pressed={!!marc[actual.orden]}>
                  {marc[actual.orden] ? <BookmarkCheck size={18} aria-hidden /> : <Bookmark size={18} aria-hidden />}
                  {marc[actual.orden] ? "Marcada para revisar" : "Marcar para revisar"}
                </button>
              )}
            </div>
            {actual.datos && actual.datos.length > 0 && (
              <dl className="ficha" aria-label="Datos">
                {actual.datos.map((d, k) => (
                  <div key={k}>
                    <dt dangerouslySetInnerHTML={{ __html: d.tex }} />
                    <dd dangerouslySetInnerHTML={{ __html: d.desc }} />
                  </div>
                ))}
              </dl>
            )}
            {/* HTML compuesto en el servidor (src/lib/formulas.ts): texto escapado y fórmulas de KaTeX. */}
            <div className="pregunta" id="enunciado" dangerouslySetInnerHTML={{ __html: actual.enunciado }} />
            <ul className="opciones" role="radiogroup" aria-labelledby="enunciado">
              {actual.opciones.map((o) => {
                const sel = elegida === o.letra;
                const clase = r ? (o.letra === r.letraCorrecta ? "correcta" : sel ? "incorrecta" : "") : "";
                return (
                  <li key={o.letra}>
                    <button
                      className={`opcion ${clase}`}
                      role="radio"
                      aria-checked={sel}
                      disabled={practica && (elegida != null || !!r)}
                      onClick={() => elegir(o.letra)}
                    >
                      <span className="burbuja">
                        {o.letra}
                        {sel && !r && (
                          <svg className="palomita" viewBox="0 0 42 42" aria-hidden>
                            <path d="M8 22h6l3-6 5 13 4-9h8" />
                          </svg>
                        )}
                      </span>
                      <span>
                        <span dangerouslySetInnerHTML={{ __html: o.texto }} />
                        {r && (
                          <span className="porque">
                            {r.argumentaciones[o.letra] ? (
                              <>
                                <span className="etiqueta">{o.letra === r.letraCorrecta ? "Por qué sí: " : "Por qué no: "}</span>
                                <span dangerouslySetInnerHTML={{ __html: r.argumentaciones[o.letra]! }} />
                              </>
                            ) : (
                              <>
                                <Lock size={13} aria-hidden /> {t.muro.pase}
                              </>
                            )}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {practica && elegida && !r && <p className="small">Revisando…</p>}
            {r && (
              <div className="pila aparece" style={{ marginTop: 18 }} aria-live="polite">
                <p className={`aviso ${r.correcta ? "ok" : "error"}`}>
                  <b>{r.correcta ? frase(voc.aciertos) : frase(t.practica.errores)}</b>
                  {r.puntos ? ` +${r.puntos} puntos` : ""}
                </p>
                <div>
                  <h3>Procedimiento</h3>
                  <div className="explicacion" dangerouslySetInnerHTML={{ __html: r.explicacion }} />
                </div>
                {r.recomendacion && (
                  <p className="small">
                    <b>Consejo:</b> {r.recomendacion}
                  </p>
                )}
                {r.referencias.length > 0 && (
                  <p className="xs">
                    Para estudiar: {r.referencias.map((x) => `${x.fuente} (${x.ubicacion})`).join("; ")}
                  </p>
                )}
                {r.bloqueadas && (
                  <p className="small">
                    <Lock size={13} aria-hidden /> Las argumentaciones de las 3 opciones y las referencias vienen con el pase. <Link href="/planes">Ver planes</Link>
                  </p>
                )}
              </div>
            )}
            <div className="fila entre" style={{ marginTop: 24 }}>
              <button className="btn sec chico" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
                <ChevronLeft size={18} aria-hidden /> Anterior
              </button>
              {!ultima ? (
                <button className="btn chico" onClick={() => setIdx((i) => Math.min(visibles.length - 1, i + 1))} disabled={practica && !r && !muro}>
                  Siguiente <ChevronRight size={18} aria-hidden />
                </button>
              ) : (
                <button
                  className="btn chico"
                  disabled={ocupado || (practica && !r && !muro)}
                  onClick={() => {
                    if (!practica && respondidas < visibles.length && !confirmarSinModal(visibles.length - respondidas)) return;
                    iniciar(() => terminar("boton"));
                  }}
                >
                  {practica ? `Terminar ${voc.practica.split(" ")[0].toLowerCase()}` : intento.global ? "Enviar examen" : "Terminar sección"}
                </button>
              )}
            </div>
          </section>
        </div>

        {!practica && (
          <nav className="hoja" style={{ marginTop: 20 }} aria-label="Mapa de preguntas">
            <div className="fila entre" style={{ marginBottom: 10 }}>
              <b>Mapa de preguntas</b>
              <button className="btn disc" onClick={() => iniciar(() => terminar("boton"))} disabled={ocupado}>
                {intento.global ? "Enviar ahora" : "Terminar sección ahora"}
              </button>
            </div>
            <div className="mapa-preguntas">
              {visibles.map((it, k) => (
                <button
                  key={it.orden}
                  className={`${resp[it.orden] ? "resp" : ""} ${marc[it.orden] ? "marc" : ""}`}
                  aria-current={k === idx}
                  aria-label={`Pregunta ${k + 1}${resp[it.orden] ? ", respondida" : ""}${marc[it.orden] ? ", marcada" : ""}`}
                  onClick={() => setIdx(k)}
                >
                  {k + 1}
                </button>
              ))}
            </div>
            <p className="xs" style={{ marginTop: 10 }}>
              Las preguntas sin responder cuentan como no acertadas, igual que en el examen real (no se resta por error).
            </p>
          </nav>
        )}
      </div>
    </div>
  );
}

/** Aviso sin cuadros de diálogo del navegador: la segunda vez que se toca, envía. */
let avisado = false;
function confirmarSinModal(faltan: number) {
  if (avisado) return true;
  avisado = true;
  const el = document.getElementById("enunciado");
  el?.insertAdjacentHTML(
    "beforebegin",
    `<p class="aviso" role="alert">Te faltan ${faltan} por responder. Toca otra vez para terminar de todos modos, o usa el mapa para regresar.</p>`,
  );
  return false;
}
