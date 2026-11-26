import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PREGUNTAS } from "@/textos/preguntas";
import { HeroEditorial } from "@/components/estilos/editorial";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

export default function Preguntas() {
  return (
    <div className="editorial">
      <HeroEditorial
        ceja="Resolución de dudas"
        titulo={
          <>
            Preguntas
            <br /> frecuentes.
          </>
        }
        sub={
          <>
            Lo que nos preguntan <u>antes de empezar</u>
          </>
        }
      />
      <section className="ed-papel">
        <div className="wrap ed-faq">
          {PREGUNTAS.map(([p, r], i) => (
            <details key={p}>
              <summary>
                <span>
                  {i + 1}. {p}
                </span>
                <Plus size={20} strokeWidth={1.5} aria-hidden />
              </summary>
              <div className="ed-faq-respuesta">{r}</div>
            </details>
          ))}
          <p className="ed-letra-chica">
            ¿No está tu pregunta? Revisa la <Link href="/guia">guía del examen</Link> o los <Link href="/planes">planes y precios</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
