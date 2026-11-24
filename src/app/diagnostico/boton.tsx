"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { empezarExamen } from "@/app/acciones/examen";

export function BotonEmpezar({ modo, permitido, muro }: { modo: string; permitido: boolean; muro: string | null }) {
  const [estado, accion, enviando] = useActionState(empezarExamen, undefined);
  if (!permitido)
    return (
      <div className="pila">
        <p className="small">
          <Lock size={14} aria-hidden /> {muro}
        </p>
        <Link href="/planes" className="btn sec chico">
          Ver el pase
        </Link>
      </div>
    );
  return (
    <form action={accion}>
      <input type="hidden" name="modo" value={modo} />
      {estado?.error && <p className="aviso error">{estado.error}</p>}
      <button className="btn" disabled={enviando}>
        {enviando ? "Preparando…" : "Empezar"}
      </button>
    </form>
  );
}
