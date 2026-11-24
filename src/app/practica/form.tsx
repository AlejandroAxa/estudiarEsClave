"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { empezarPractica } from "@/app/acciones/examen";

export function FormPractica(p: { etiqueta: string; subarea?: string; repaso?: boolean; deshabilitado?: boolean; muro?: string | null; chico?: boolean; autoIniciar?: boolean }) {
  const [estado, accion, enviando] = useActionState(empezarPractica, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const hecho = useRef(false);
  useEffect(() => {
    if (p.autoIniciar && !p.deshabilitado && !hecho.current) {
      hecho.current = true;
      ref.current?.requestSubmit();
    }
  }, [p.autoIniciar, p.deshabilitado]);
  return (
    <form action={accion} ref={ref} className="pila" style={{ gap: 8 }}>
      {p.subarea && <input type="hidden" name="subarea" value={p.subarea} />}
      {p.repaso && <input type="hidden" name="repaso" value="1" />}
      {p.muro && (
        <p className="small" style={{ margin: 0 }}>
          <Lock size={14} aria-hidden /> {p.muro} <Link href="/planes">Ver planes</Link>
        </p>
      )}
      {estado?.error && <p className="aviso error">{estado.error}</p>}
      <button className={`btn ${p.chico ? "chico sec" : ""}`} disabled={p.deshabilitado || enviando}>
        {enviando ? "Preparando…" : p.etiqueta}
      </button>
    </form>
  );
}
