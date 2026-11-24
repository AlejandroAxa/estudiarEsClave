"use client";
import { useActionState } from "react";
import { guardarBienvenida } from "@/app/acciones/perfil";

export function FormularioBienvenida({ rutas, siguiente }: { rutas: { id: string; nombre: string; examenId: string; carrera: string | null }[]; siguiente: string }) {
  const [estado, accion, enviando] = useActionState(guardarBienvenida, undefined);
  return (
    <form action={accion} className="hoja pila">
      <input type="hidden" name="siguiente" value={siguiente} />
      <label className="campo">
        ¿A qué carrera vas?
        <select name="ruta" required defaultValue={rutas.find((r) => r.id === "medicina")?.id}>
          {rutas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} ({r.examenId})
            </option>
          ))}
        </select>
      </label>
      <label className="campo">
        Tu alias para la liga
        <span className="ayuda">Sin espacios. Por ejemplo: futura_cardio o Neurona27.</span>
        <input name="alias" required minLength={3} maxLength={24} autoComplete="off" />
      </label>
      <label className="campo">
        ¿Cómo te saludamos? (opcional)
        <span className="ayuda">Solo tu nombre de pila o un apodo.</span>
        <input name="nombre" maxLength={40} autoComplete="given-name" />
      </label>
      <label className="casilla">
        <input type="checkbox" name="aviso" value="si" required />
        <span>
          Leí el <a href="/privacidad" target="_blank">aviso de privacidad</a>. Entiendo que para comprar un pase hay que ser mayor de edad.
        </span>
      </label>
      {estado?.error && (
        <p className="aviso error" role="alert">
          {estado.error}
        </p>
      )}
      <button className="btn ancho" disabled={enviando}>
        {enviando ? "Guardando…" : "Empezar mis 3 días de pase"}
      </button>
    </form>
  );
}
