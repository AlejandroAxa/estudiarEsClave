"use client";
import { useActionState } from "react";
import { guardarCuenta } from "@/app/acciones/perfil";
import { accionBorrarCuenta } from "@/app/acciones/cuenta";

interface Valores {
  alias: string;
  nombre: string;
  tema: string;
  ranking: boolean;
  repaso: boolean;
  resumen: boolean;
}

export function FormularioCuenta({ v }: { v: Valores }) {
  const [estado, accion, enviando] = useActionState(guardarCuenta, undefined);
  return (
    <form action={accion} className="pila">
      <label className="campo">
        Alias
        <input name="alias" defaultValue={v.alias} required minLength={3} maxLength={24} autoComplete="off" />
      </label>
      <label className="campo">
        Nombre de pila (opcional)
        <input name="nombre" defaultValue={v.nombre} maxLength={40} />
      </label>
      <label className="campo">
        Apariencia
        <select name="tema" defaultValue={v.tema}>
          <option value="sistema">Como mi dispositivo</option>
          <option value="claro">Clara</option>
          <option value="oscuro">Oscura</option>
        </select>
      </label>
      <label className="casilla">
        <input type="checkbox" name="ranking" defaultChecked={v.ranking} />
        <span>Aparecer con mi alias en la liga semanal</span>
      </label>
      <label className="casilla">
        <input type="checkbox" name="repaso" defaultChecked={v.repaso} />
        <span>Repasar mis errores a los 1, 3 y 7 días</span>
      </label>
      <label className="casilla">
        <input type="checkbox" name="resumen" defaultChecked={v.resumen} />
        <span>Recibir un resumen semanal por correo</span>
      </label>
      {estado?.error && (
        <p className="aviso error" role="alert">
          {estado.error}
        </p>
      )}
      {estado?.ok && <p className="aviso ok">Guardado.</p>}
      <button className="btn" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

export function FormularioBorrar() {
  const [estado, accion, enviando] = useActionState(accionBorrarCuenta, undefined);
  return (
    <form action={accion} className="pila">
      <label className="campo">
        Escribe BORRAR para confirmar
        <input name="confirmar" autoComplete="off" required />
      </label>
      {estado?.error && (
        <p className="aviso error" role="alert">
          {estado.error}
        </p>
      )}
      <button className="btn disc" disabled={enviando}>
        {enviando ? "Borrando…" : "Borrar mi cuenta para siempre"}
      </button>
    </form>
  );
}
