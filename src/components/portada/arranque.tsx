/**
 * Formulario de arranque en forma de frase: «Hola, soy ___ y voy por ___».
 * Solo el área viaja (GET a /mini?area=...); el nombre se queda en la página.
 */
import { OPCIONES_MINI } from "@/lib/areas-generales";

export function Arranque() {
  return (
    <form action="/mini" method="get" className="arranque">
      <p className="arranque-frase">
        Hola, soy{" "}
        <label className="arranque-campo">
          <span className="sr-only">Tu nombre</span>
          <input name="nombre-local" form="no-enviar" placeholder="tu nombre" autoComplete="given-name" maxLength={40} />
        </label>{" "}
        y voy por{" "}
        <label className="arranque-campo">
          <span className="sr-only">Tu área</span>
          <select name="area" defaultValue="" required>
            <option value="" disabled>
              elige tu área
            </option>
            {OPCIONES_MINI.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.nombre}
              </option>
            ))}
          </select>
        </label>
        . Quiero saber qué estudiar primero.
      </p>
      <div className="fila">
        <button className="btn-luz">Hacer mi mini diagnóstico</button>
        <span className="arranque-nota">20 minutos, sin cuenta y sin tarjeta.</span>
      </div>
    </form>
  );
}
