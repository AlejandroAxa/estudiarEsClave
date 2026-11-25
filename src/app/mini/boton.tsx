"use client";
import { useActionState } from "react";
import { empezarMini } from "@/app/acciones/examen";

export function BotonMini({ opciones, elegida }: { opciones: { id: string; nombre: string; detalle: string }[]; elegida: string }) {
  const [estado, accion, enviando] = useActionState(async (_p: unknown, form: FormData) => empezarMini(String(form.get("ruta") ?? "")), undefined);
  return (
    <form action={accion} className="pila">
      <fieldset className="selector-area">
        <legend>¿De qué área es tu carrera?</legend>
        {opciones.map((o) => (
          <label key={o.id}>
            <input type="radio" name="ruta" value={o.id} defaultChecked={o.id === elegida} required />
            <span>{o.nombre}</span>
            <span className="xs">{o.detalle}</span>
          </label>
        ))}
      </fieldset>
      {estado?.error && <p className="aviso error">{estado.error}</p>}
      <div>
        <button className="btn" disabled={enviando}>
          {enviando ? "Preparando tu consulta…" : "Empezar ahora"}
        </button>
      </div>
    </form>
  );
}
