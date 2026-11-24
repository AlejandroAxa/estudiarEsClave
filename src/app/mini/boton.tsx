"use client";
import { useActionState } from "react";
import { empezarMini } from "@/app/acciones/examen";

export function BotonMini() {
  const [estado, accion, enviando] = useActionState(async () => empezarMini(), undefined);
  return (
    <form action={accion}>
      {estado?.error && <p className="aviso error">{estado.error}</p>}
      <button className="btn" disabled={enviando}>
        {enviando ? "Preparando tu consulta…" : "Empezar ahora"}
      </button>
    </form>
  );
}
