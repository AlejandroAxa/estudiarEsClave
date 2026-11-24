import type { Metadata } from "next";
import { BotonMini } from "./boton";

export const metadata: Metadata = {
  title: "Mini diagnóstico gratis",
  description: "18 preguntas, 3 por área del EXANI-II, en unos 20 minutos y sin crear cuenta.",
};

export default function Mini() {
  return (
    <div className="angosto band pila">
      <span className="pastilla">Gratis · sin cuenta</span>
      <h1 style={{ fontSize: "clamp(34px,6vw,60px)" }}>Mini diagnóstico</h1>
      <p className="lead">18 preguntas, 3 de cada área del EXANI-II con el módulo de Medicina. Tienes 20 minutos. Al final ves cómo vas en cada área.</p>
      <ul className="small">
        <li>No pedimos ningún dato para empezar.</li>
        <li>Puedes marcar preguntas para revisar y moverte entre ellas.</li>
        <li>Si se va la señal, tus respuestas se guardan en el teléfono.</li>
      </ul>
      <BotonMini />
    </div>
  );
}
