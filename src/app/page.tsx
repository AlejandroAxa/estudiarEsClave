import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { sesionActual } from "@/lib/sesion";
import { productosActivos } from "@/lib/comercio/comercio";
import { pesos } from "@/lib/fechas";
import { AREAS_GENERALES, totalCarreras } from "@/lib/areas-generales";
import { DibujoMotivo } from "@/components/motivo-area";
import { Titular } from "@/components/portada/titular";
import { Servicios } from "@/components/portada/servicios";
import { Arranque } from "@/components/portada/arranque";
import { PildoraFlotante } from "@/components/portada/pildora";
import { PREGUNTAS } from "@/textos/preguntas";
import { t } from "@/textos/es-MX";

/**
 * Portada. Dirección: un solo degradado de noche a ciruela y violeta que
 * acompaña todo el recorrido, titulares enormes en Anybody condensada, frases
 * cortas y una acción luminosa siempre a mano. El resto del sitio conserva su
 * sistema; esto solo cambia la primera impresión.
 */
export default async function Portada() {
  const ses = await sesionActual().catch(() => null);
  if (ses?.perfil) redirect("/inicio");
  const productos = await productosActivos(db).catch(() => []);

  return (
    <div className="portada">
      <section className="portada-hero" id="portada-hero">
        <div className="wrap">
          <Titular lineas={["Saber qué", "estudiar es", "la mitad", "del examen."]} etiqueta="Saber qué estudiar es la mitad del examen" />
          <div className="portada-hero-pie">
            <p>Simulador del EXANI-II para la BUAP. Diagnóstico, práctica diaria y simulacro para tu área, con el porqué de cada respuesta.</p>
            <div className="fila">
              <Link href="/mini" className="btn-luz">
                Empezar gratis
              </Link>
              <Link href="/entrar" className="enlace-flecha">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="portada-banda">
        <div className="wrap">
          <p className="manifiesto">
            Hay cursos de seis meses, guías de 300 páginas y videos de dos horas. Aquí empiezas por lo que más puntos te da: <b>20 minutos para saber dónde estás</b> y
            diez preguntas al día para avanzar.
          </p>
        </div>
      </section>

      <section className="portada-banda">
        <div className="wrap">
          <span className="portada-ceja">Cómo funciona</span>
          <Servicios />
        </div>
      </section>

      <section className="portada-banda">
        <div className="wrap portada-casos">
          <div className="portada-casos-titulo">
            <h2>Tu área, tu examen.</h2>
            <p>Cuatro áreas de conocimiento en la BUAP. Cada una con su diagnóstico, su banco de preguntas y su propio estilo.</p>
          </div>
          <ol className="casos">
            {AREAS_GENERALES.map((a, i) => (
              <li key={a.slug} className="caso" style={{ "--acento": a.acento } as React.CSSProperties}>
                <Link href={`/carreras/${a.slug}`} className="caso-imagen" aria-label={`Ver ${a.nombre}`}>
                  <DibujoMotivo tema={a.tema} acento={a.acento} className="ilustracion mini" />
                </Link>
                <div className="caso-texto">
                  <span className="caso-num">
                    {i + 1}/{AREAS_GENERALES.length}
                  </span>
                  <h3>
                    <Link href={`/carreras/${a.slug}`}>{a.nombre}</Link>
                  </h3>
                  <p>{a.lema}</p>
                  <div className="caso-dato">
                    <b>{totalCarreras(a)}</b>
                    <span>carreras en esta área</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="portada-banda portada-negro">
        <div className="wrap">
          <span className="portada-ceja">Precios</span>
          <h2 className="portada-h2">Precios públicos. Un pago, hasta el examen.</h2>
          <div className="precios">
            <div className="precio">
              <h3>Gratis</h3>
              <b className="precio-cifra">$0</b>
              <p>Un diagnóstico por temporada, 15 preguntas al día y 3 días del pase completo al crear tu cuenta, sin tarjeta.</p>
              <Link href="/entrar" className="enlace-flecha">
                Crear cuenta
              </Link>
            </div>
            {productos.map((p, k) => (
              <div key={p.sku} className={`precio ${k === productos.length - 1 ? "destacado" : ""}`}>
                <h3>{p.nombre}</h3>
                <b className="precio-cifra">{pesos(Number(p.precioMxn))}</b>
                <p>{p.descripcion}</p>
                <Link href="/planes" className="enlace-flecha">
                  Ver qué incluye
                </Link>
              </div>
            ))}
          </div>
          <p className="portada-nota">IVA incluido. Sin renovaciones automáticas. Tarjeta, OXXO o SPEI.</p>
        </div>
      </section>

      <section className="portada-banda portada-negro">
        <div className="wrap portada-faq">
          <div>
            <span className="portada-ceja">Preguntas frecuentes</span>
            <p className="portada-faq-lema">¿Sigues con dudas? Lo raro sería no tenerlas.</p>
            <Link href="/preguntas-frecuentes" className="btn-luz">
              Ver todas
            </Link>
          </div>
          <div className="faq-lista">
            {PREGUNTAS.slice(0, 6).map(([p, r]) => (
              <details key={p} className="faq">
                <summary>
                  <span>{p}</span>
                  <Plus size={22} strokeWidth={1.5} aria-hidden />
                </summary>
                <p>{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="portada-banda portada-negro portada-declaracion">
        <div className="wrap">
          <p className="declaracion" aria-label="Cero relleno. Puro examen.">
            <span>Cero relleno.</span>
            <span>Puro examen.</span>
          </p>
          <p className="declaracion-pie">Preguntas originales revisadas por docentes, precios a la vista y una calificación que no cambia de humor. {t.aviso.estimacion}</p>
        </div>
      </section>

      <section className="portada-banda portada-arranque">
        <div className="wrap">
          <span className="portada-ceja">Empieza</span>
          <Arranque />
        </div>
      </section>

      <PildoraFlotante />
    </div>
  );
}
