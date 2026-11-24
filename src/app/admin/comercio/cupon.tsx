"use client";
import { useActionState } from "react";
import { crearCupon } from "@/app/acciones/admin";

export function FormularioCupon() {
  const [e, accion, enviando] = useActionState(crearCupon, undefined);
  return (
    <form action={accion} className="fila" style={{ flexWrap: "wrap", alignItems: "end" }}>
      <label className="campo">
        Código
        <input name="codigo" required pattern="[A-Za-z0-9-]{3,30}" />
      </label>
      <label className="campo">
        %
        <input type="number" name="pct" min="1" max="100" required />
      </label>
      <label className="campo">
        Vence
        <input type="date" name="hasta" required />
      </label>
      <label className="campo">
        Usos máximos
        <input type="number" name="usos" min="1" required />
      </label>
      <button className="btn" disabled={enviando}>
        Crear cupón
      </button>
      {e?.error && <p className="aviso error" style={{ width: "100%" }}>{e.error}</p>}
      {e?.ok && <p className="aviso ok" style={{ width: "100%" }}>{e.ok}</p>}
    </form>
  );
}
