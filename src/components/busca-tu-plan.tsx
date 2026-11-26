"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type Item = { carrera: string; plan: string; sku: string; area: string };

const normal = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Escribe tu carrera y te decimos qué plan te toca. Sin JavaScript se ven las tarjetas de abajo. */
export function BuscaTuPlan({ carreras }: { carreras: Item[] }) {
  const [q, setQ] = useState("");
  const hallados = useMemo(() => {
    const n = normal(q.trim());
    return n.length < 2 ? [] : carreras.filter((c) => normal(c.carrera).includes(n)).slice(0, 6);
  }, [q, carreras]);
  return (
    <div className="busca-plan">
      <label className="buscador-campo">
        <Search size={18} aria-hidden />
        <span className="sr-only">¿Qué carrera quieres estudiar?</span>
        <input type="search" placeholder="Escribe tu carrera: Derecho, Enfermería, Mecatrónica…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </label>
      <div aria-live="polite">
        {q.trim().length >= 2 && hallados.length === 0 && (
          <p className="small">No la encontramos. Revisa cómo se escribe o busca tu área en las tarjetas de abajo.</p>
        )}
        {hallados.length > 0 && (
          <ul className="busca-plan-lista">
            {hallados.map((c) => (
              <li key={c.carrera + c.sku}>
                <span>
                  <b>{c.carrera}</b>
                  <span className="xs">{c.area}</span>
                </span>
                <a href={`#${c.sku}`} className="btn chico">
                  {c.plan}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
