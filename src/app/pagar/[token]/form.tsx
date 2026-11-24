"use client";
import { useActionState } from "react";
import { pagarEnlace } from "@/app/acciones/compra";

export function FormPagoEnlace({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState(pagarEnlace, undefined);
  return (
    <form action={accion} className="hoja pila">
      <input type="hidden" name="token" value={token} />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="pila">
        <legend style={{ fontWeight: 700 }}>¿Quién eres?</legend>
        <label className="casilla">
          <input type="radio" name="quien" value="familiar" required defaultChecked /> <span>Su mamá, papá o tutor</span>
        </label>
        <label className="casilla">
          <input type="radio" name="quien" value="otro" /> <span>Otra persona</span>
        </label>
      </fieldset>
      <label className="campo">
        Tu correo para el recibo (opcional)
        <input type="email" name="correo" autoComplete="email" />
      </label>
      <label className="casilla">
        <input type="checkbox" name="mayor" value="si" required /> <span>Soy mayor de edad y acepto los <a href="/terminos">términos</a>.</span>
      </label>
      {estado?.error && <p className="aviso error">{estado.error}</p>}
      <button className="btn ancho" disabled={enviando}>
        {enviando ? "Abriendo la pasarela…" : "Pagar con tarjeta, OXXO o SPEI"}
      </button>
    </form>
  );
}
