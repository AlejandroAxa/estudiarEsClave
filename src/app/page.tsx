import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { sesionActual } from "@/lib/sesion";
import { productosActivos } from "@/lib/comercio/comercio";
import { pesos } from "@/lib/fechas";
import { AREAS_GENERALES, totalCarreras } from "@/lib/areas-generales";
import { PLANES_AREA, SKU_BASICO, SKU_MEDICINA } from "@/lib/planes-area";
import { DibujoMotivo } from "@/components/motivo-area";
import Image from "next/image";
import { Lectura } from "@/components/portada/lectura";
import { Fases } from "@/components/portada/fases";
import { Arranque } from "@/components/portada/arranque";
import { BarraAvance } from "@/components/portada/navegacion";
import { Testimonios } from "@/components/portada/testimonios";
import { FranjaCampus } from "@/components/portada/campus";
import { BotonTikTok } from "@/components/boton-tiktok";
import { PREGUNTAS } from "@/textos/preguntas";
import { t } from "@/textos/es-MX";

/**
 * Portada. Dirección: una foto del campus a todo lo ancho al abrir y, después, negro y
 * blanco roto. Sans en negritas con la palabra clave en cursiva serif,
 * etiquetas en minúscula con guion bajo, frases que se encienden al leerlas y
 * una línea de avance arriba. El resto del sitio conserva su sistema.
 */
const PALABRAS = [
  "Diagnóstico",
  "Prioridad",
  "Porqué",
  "Práctica",
  "Repaso",
  "Racha",
  "Simulacro",
  "Liga",
];

const BENEFICIOS: [string, string, string][] = [
  [
    "Saber qué estudiar",
    "sin adivinar.",
    "El diagnóstico ordena tus temas por lo que más puntos te puede dar: lo que pesa mucho en el examen y es donde más fallas.",
  ],
  [
    "El porqué de",
    "cada opción.",
    "No solo la correcta. Cada respuesta incorrecta explica por qué parecía buena y en qué se equivoca.",
  ],
  [
    "Lo que fallas",
    "vuelve.",
    "Tus errores regresan a los 1, 3 y 7 días, justo cuando estás por olvidarlos.",
  ],
  [
    "Precios",
    "a la vista.",
    "Un solo pago hasta el día del examen, IVA incluido y sin renovaciones automáticas.",
  ],
  [
    "Una calificación que",
    "no cambia de humor.",
    "Mismas reglas para todos, preguntas originales revisadas por docentes y la revisión pregunta por pregunta.",
  ],
];

export default async function Portada() {
  const ses = await sesionActual().catch(() => null);
  if (ses?.perfil) redirect("/inicio");
  const productos = await productosActivos(db).catch(() => []);
  const porSku = new Map(productos.map((p) => [p.sku, p]));
  const basico = porSku.get(SKU_BASICO);
  const medicina = porSku.get(SKU_MEDICINA);

  return (
    <div className="joa">
      <section className="joa-hero" id="portada-hero">
        <div className="joa-hero-foto" aria-hidden>
          <Image
            src="/imagenes/campus-multiaulas.webp"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="joa-hero-centro">
          <h1>
            Simulador
            <br />
            del EXANI-II
            <br />
            para la BUAP
            <br />
            que te dice
            <br />
            <em>qué estudiar</em>
            <br />
            primero.
          </h1>
        </div>
        <div className="wrap joa-hero-pie">
          <div>
            <span className="joa-etiqueta">_simulador</span>
            <p className="joa-hero-frase">
              Saber qué estudiar es <em>la mitad</em> del examen.
            </p>
          </div>
          <div className="joa-hero-acciones">
            <Link href="/mini" className="joa-boton">
              Empezar gratis
            </Link>
            <Link href="/entrar" className="joa-enlace">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      <section className="joa-negro joa-manifiesto" id="manifiesto">
        <div className="wrap">
          <h2 className="joa-etiqueta">_manifiesto</h2>
          <p className="joa-frase">
            Practicar visto como <em>el lugar</em> donde un aspirante
            <br /> deja de <em>adivinar.</em>
          </p>
          <ul className="joa-nube" aria-label="Lo que encuentras aquí">
            {PALABRAS.map((p, k) => (
              <li key={p} style={{ "--k": k } as React.CSSProperties}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="joa-claro joa-lectura">
        <div className="wrap">
          <Lectura texto="Hay cursos de seis meses, guías de 300 páginas y videos de dos horas. Aquí empiezas por lo que más puntos te da: veinte minutos para saber dónde estás y diez preguntas al día para avanzar." />
        </div>
      </section>

      <figure className="joa-foto">
        <Image
          src="/imagenes/aspirantes.webp"
          alt="Cuatro estudiantes sentados en las escaleras de un edificio, sonriendo y haciendo la señal de amor y paz"
          width={1600}
          height={1066}
          sizes="100vw"
        />
        <figcaption className="wrap">
          <span className="joa-etiqueta">_aspirantes</span>
          <span>
            Para quien ya sabe a qué carrera va y quiere llegar al examen
            sabiendo qué le toca estudiar.
          </span>
        </figcaption>
      </figure>

      <section className="joa-claro" id="areas">
        <div className="wrap">
          <div className="joa-cabecera">
            <div>
              <h2 className="joa-etiqueta">_áreas</h2>
              <p className="joa-titulo">
                Cuatro áreas, <em>un mismo</em> examen.
              </p>
            </div>
            <Link href="/carreras" className="joa-enlace">
              Ver todas
            </Link>
          </div>
          <ul className="joa-casos">
            {AREAS_GENERALES.map((a) => (
              <li
                key={a.slug}
                style={{ "--acento": a.acento } as React.CSSProperties}
              >
                <Link href={`/carreras/${a.slug}`} className="joa-caso">
                  <span className="joa-caso-imagen">
                    <DibujoMotivo
                      tema={a.tema}
                      acento={a.acento}
                      className="ilustracion mini"
                    />
                  </span>
                  <span className="joa-caso-pie">
                    <span className="joa-caso-nombre">
                      Ver área <b>/{a.corto}</b>
                    </span>
                    <span className="joa-caso-dato">
                      {totalCarreras(a)} carreras
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="joa-claro joa-cifras"
        aria-label="El examen en cifras"
      >
        <div className="wrap">
          <p>
            El EXANI-II de la BUAP tiene <b>190</b> preguntas y dura hasta{" "}
            <b>5</b> horas. Cada una tiene <b>3</b> opciones y equivocarte te
            resta <b>0</b> puntos.
          </p>
          <span className="joa-nota">
            Guía del sustentante del CENEVAL y su página para la BUAP. Medicina
            va aparte, en dos etapas.
          </span>
        </div>
      </section>

      <section className="joa-negro" id="proceso">
        <div className="wrap">
          <div className="joa-centrado">
            <h2 className="joa-etiqueta">_proceso</h2>
            <p className="joa-titulo">
              Un <em>método</em> para llegar
              <br /> con el <em>resultado</em> claro.
            </p>
          </div>
          <Fases />
        </div>
      </section>

      <section className="joa-negro joa-beneficios">
        <div className="wrap joa-dos">
          <h2 className="joa-etiqueta joa-pegajosa">_beneficios</h2>
          <ul>
            {BENEFICIOS.map(([a, b, c]) => (
              <li key={b}>
                <h3>
                  {a} <em>{b}</em>
                </h3>
                <p>{c}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FranjaCampus />

      <Testimonios />

      <section className="joa-claro" id="precios">
        <div className="wrap">
          <div className="joa-cabecera">
            <div>
              <h2 className="joa-etiqueta">_precios</h2>
              <p className="joa-titulo">
                Un pago, <em>hasta el examen.</em>
              </p>
            </div>
            <Link href="/planes" className="joa-enlace">
              Comparar planes
            </Link>
          </div>
          <h3 className="joa-precios-sub">
            <span className="joa-etiqueta">_plan_de_tu_área</span>
            Cada área de la BUAP presenta su propio examen. Su plan abre las
            áreas comunes y los módulos de tu área.
          </h3>
          <div className="joa-precios">
            {PLANES_AREA.flatMap((pa) => {
              const p = porSku.get(pa.sku);
              if (!p) return [];
              return [
                <div
                  key={pa.sku}
                  className="joa-precio"
                  style={{ "--acento": pa.area.acento } as React.CSSProperties}
                >
                  <span className="joa-etiqueta">{pa.area.corto}</span>
                  <b>{pesos(Number(p.precioMxn))}</b>
                  <p>{totalCarreras(pa.area)} carreras, simulacros completos ilimitados hasta el examen.</p>
                  <Link href={`/planes#${pa.sku}`} className="joa-enlace">
                    Ver qué incluye
                  </Link>
                </div>,
              ];
            })}
          </div>
          <h3 className="joa-precios-sub">
            <span className="joa-etiqueta">_otras_opciones</span>
          </h3>
          <div className="joa-precios tres">
            <div className="joa-precio">
              <span className="joa-etiqueta">Gratis</span>
              <b>$0</b>
              <p>Un diagnóstico por temporada, 15 preguntas al día y 3 días con todo abierto, sin tarjeta.</p>
              <Link href="/entrar" className="joa-enlace">
                Crear cuenta
              </Link>
            </div>
            {basico && (
              <div className="joa-precio">
                <span className="joa-etiqueta">Solo áreas comunes</span>
                <b>{pesos(Number(basico.precioMxn))}</b>
                <p>Comprensión lectora, Redacción indirecta y Pensamiento matemático, sin los módulos de tu área.</p>
                <Link href={`/planes#${basico.sku}`} className="joa-enlace">
                  Ver qué incluye
                </Link>
              </div>
            )}
            {medicina && (
              <div className="joa-precio">
                <span className="joa-etiqueta">Medicina (EIPM)</span>
                <b>{pesos(Number(medicina.precioMxn))}</b>
                <p>Áreas comunes más Biología, Química y Premedicina, con simulacros completos ilimitados.</p>
                <Link href={`/planes#${medicina.sku}`} className="joa-enlace">
                  Ver qué incluye
                </Link>
              </div>
            )}
          </div>
          <p className="joa-nota">
            IVA incluido. Sin renovaciones automáticas. Tarjeta, OXXO o SPEI.
          </p>
        </div>
      </section>

      <section className="joa-claro joa-borde">
        <div className="wrap joa-dos">
          <div>
            <h2 className="joa-etiqueta">_preguntas</h2>
            <p className="joa-titulo">
              ¿Dudas? <em>Lo raro</em> sería no tenerlas.
            </p>
            <Link href="/preguntas-frecuentes" className="joa-enlace">
              Ver todas
            </Link>
          </div>
          <div className="joa-faq">
            {PREGUNTAS.slice(0, 6).map(([p, r]) => (
              <details key={p}>
                <summary>
                  <span>{p}</span>
                  <Plus size={20} strokeWidth={1.5} aria-hidden />
                </summary>
                <p>{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="joa-negro joa-cierre">
        <div className="wrap">
          <h2 className="joa-etiqueta">
            Diagnóstico, práctica diaria y simulacro con el porqué de cada
            respuesta.
          </h2>
          <p className="joa-cierre-frase">
            Tú pones las ganas.
            <br />
            <em>Nosotros, el orden.</em>
          </p>
          <span className="joa-temporada">
            <i aria-hidden /> Temporada 2027 abierta
          </span>
          <Arranque />
          <p className="joa-redes">
            <BotonTikTok
              variante="boton"
              texto="Una pregunta al día en TikTok"
            />
          </p>
          <p className="joa-nota">{t.aviso.estimacion}</p>
        </div>
      </section>

      <BarraAvance />
    </div>
  );
}
