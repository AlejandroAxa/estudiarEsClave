"use client";
import { useActionState } from "react";
import { verificarMfa } from "@/app/acciones/admin";

export function FormularioMfa() {
  const [e, accion, enviando] = useActionState(verificarMfa, undefined);
  return (
    <form action={accion} className="hoja pila">
      <label className="campo">
        Código
        <input name="codigo" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required autoFocus />
      </label>
      {e?.error && (
        <p className="aviso error" role="alert">
          {e.error}
        </p>
      )}
      <button className="btn" disabled={enviando}>
        Verificar
      </button>
    </form>
  );
}
