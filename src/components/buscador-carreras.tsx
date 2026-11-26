"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type Item = { nombre: string; href: string; area: string };

const normal = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Índice A–Z de todas las licenciaturas con búsqueda que ignora acentos. Sin JavaScript se ve la lista completa. */
export function BuscadorCarreras({ carreras }: { carreras: Item[] }) {
  const [q, setQ] = useState("");
  const filtradas = useMemo(() => {
    const n = normal(q.trim());
    return n ? carreras.filter((c) => normal(c.nombre).includes(n)) : carreras;
  }, [q, carreras]);
  const grupos = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const c of filtradas) {
      const l = normal(c.nombre)[0].toUpperCase();
      m.set(l, [...(m.get(l) ?? []), c]);
    }
    return [...m.entries()];
  }, [filtradas]);
  return (
    <div className="buscador-carreras">
      <label className="buscador-campo">
        <Search size={18} aria-hidden />
        <span className="sr-only">Busca tu carrera</span>
        <input type="search" placeholder="Busca tu carrera: Derecho, Enfermería, Mecatrónica…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </label>
      <p className="xs" aria-live="polite">
        {filtradas.length} {filtradas.length === 1 ? "carrera" : "carreras"}
      </p>
      {grupos.length === 0 ? (
        <p className="small">No la encontramos. Revisa cómo se escribe o búscala en la convocatoria de la BUAP.</p>
      ) : (
        <div className="indice-az">
          {grupos.map(([letra, items]) => (
            <section key={letra}>
              <h3>{letra}</h3>
              <ul>
                {items.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href}>{c.nombre}</Link>
                    <span>{c.area}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
