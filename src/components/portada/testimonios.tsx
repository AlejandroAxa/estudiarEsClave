import Image from "next/image";
import { TESTIMONIOS } from "@/textos/testimonios";

/** Aspirantes que practicaron aquí y ya están dentro. */
export function Testimonios() {
  return (
    <section className="joa-claro joa-borde" id="testimonios">
      <div className="wrap">
        <div className="joa-cabecera">
          <div>
            <h2 className="joa-etiqueta">_ya_entraron</h2>
            <p className="joa-titulo">
              Practicaron aquí. <em>Ya están dentro.</em>
            </p>
          </div>
        </div>
        <ul className="testimonios">
          {TESTIMONIOS.map((t) => (
            <li key={t.carrera} className="testimonio">
              <Image
                src={t.foto}
                alt={t.alt}
                width={320}
                height={320}
                sizes="(max-width: 600px) 45vw, 280px"
              />
              <div className="testimonio-texto">
                <b className="testimonio-puntos">
                  {t.puntos}
                  <small> puntos</small>
                </b>
                <span className="testimonio-carrera">
                  {t.nombre ? `${t.nombre} · ` : "Entró a "}
                  {t.nombre ? t.carrera : `${t.carrera} en la BUAP`}
                </span>
                {t.frase ? (
                  <blockquote>“{t.frase}”</blockquote>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <p className="joa-nota">
          Resultados que nos compartieron aspirantes que usaron el simulador.
          Cada resultado depende del esfuerzo de cada quien; usar el simulador
          no garantiza tu lugar.
        </p>
      </div>
    </section>
  );
}
