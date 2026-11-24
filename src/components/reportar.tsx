"use client";
import { useActionState } from "react";
import { Flag } from "lucide-react";
import { reportarError } from "@/app/acciones/reportes";

export function Reportar({ reactivoId, version }: { reactivoId: string; version: number }) {
  const [estado, accion, enviando] = useActionState(reportarError, undefined);
  if (estado?.ok) return <p className="xs">Gracias. Revisaremos esta pregunta.</p>;
  return (
    <details>
      <summary className="btn disc" style={{ fontSize: 14 }}>
        <Flag size={14} aria-hidden /> Reportar error
      </summary>
      <form action={accion} className="pila" style={{ marginTop: 8 }}>
        <input type="hidden" name="reactivoId" value={reactivoId} />
        <input type="hidden" name="version" value={version} />
        <label className="campo">
          ¿Qué está mal?
          <textarea name="motivo" rows={3} required minLength={5} maxLength={1000} />
        </label>
        {estado?.error && <p className="aviso error">{estado.error}</p>}
        <button className="btn chico" disabled={enviando}>
          Enviar reporte
        </button>
      </form>
    </details>
  );
}
