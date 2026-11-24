"use client";
import { useActionState } from "react";
import { publicar, subirBanco } from "@/app/acciones/admin";

export function FormularioImportar({ desarrollo }: { desarrollo: boolean }) {
  const [e, accion, enviando] = useActionState(subirBanco, undefined);
  return (
    <form action={accion} className="pila">
      <input type="file" name="archivo" accept="application/json,.json" required />
      {desarrollo && (
        <label className="casilla">
          <input type="checkbox" name="sinValidar" />
          <span>Aceptar reactivos sin validar (solo en desarrollo)</span>
        </label>
      )}
      {e?.error && (
        <div className="aviso error" role="alert">
          <p>{e.error}</p>
          {e.errores && (
            <ul className="xs">
              {e.errores.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {e?.ok && <p className="aviso ok">{e.ok}</p>}
      <button className="btn" disabled={enviando}>
        {enviando ? "Validando…" : "Importar"}
      </button>
    </form>
  );
}

export function FormularioPublicar() {
  const [e, accion, enviando] = useActionState(publicar, undefined);
  return (
    <form action={accion} className="fila" style={{ flexWrap: "wrap", alignItems: "end" }}>
      <input type="hidden" name="examenId" value="EXANI-II" />
      <label className="campo">
        Versión
        <input name="version" placeholder="1.0.0" required pattern="\d+\.\d+\.\d+(-[a-z0-9.]+)?" />
      </label>
      <label className="campo" style={{ flex: 1 }}>
        Notas
        <input name="notas" placeholder="Qué cambió" />
      </label>
      <button className="btn" disabled={enviando}>
        Publicar
      </button>
      {e?.error && (
        <p className="aviso error" role="alert" style={{ width: "100%" }}>
          {e.error}
        </p>
      )}
      {e?.ok && (
        <p className="aviso ok" style={{ width: "100%" }}>
          {e.ok}
        </p>
      )}
    </form>
  );
}
