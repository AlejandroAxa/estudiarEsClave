"use client";
import { useActionState } from "react";
import { comprar } from "@/app/acciones/compra";

export function FormCompra({ sku, cupon }: { sku: string; cupon: string }) {
  const [estado, accion, enviando] = useActionState(comprar, undefined);
  return (
    <form action={accion} className="hoja pila">
      <input type="hidden" name="sku" value={sku} />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="pila">
        <legend className="campo" style={{ fontWeight: 700 }}>
          ¿Quién paga?
        </legend>
        {[
          ["alumno", "Yo (soy mayor de edad)"],
          ["familiar", "Mi mamá, papá o tutor, aquí conmigo"],
          ["otro", "Otra persona mayor de edad"],
        ].map(([v, l]) => (
          <label key={v} className="casilla">
            <input type="radio" name="quien" value={v} required defaultChecked={v === "alumno"} /> <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <label className="campo">
        Cupón (opcional)
        <input name="cupon" defaultValue={cupon} maxLength={30} autoCapitalize="characters" />
      </label>
      {estado?.error && <p className="aviso error">{estado.error}</p>}
      <button className="btn ancho" disabled={enviando}>
        {enviando ? "Abriendo la pasarela…" : "Ir a pagar"}
      </button>
      <p className="xs">Te llevamos a la página segura de la pasarela. El pase se activa en cuanto ella nos confirma el pago (con OXXO o SPEI puede tardar unas horas).</p>
    </form>
  );
}
