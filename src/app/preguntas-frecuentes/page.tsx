import type { Metadata } from "next";
import { PREGUNTAS } from "@/textos/preguntas";

export const metadata: Metadata = { title: "Preguntas frecuentes" };



export default function Preguntas() {
  return (
    <div className="wrap band pila angosto lectura">
      <h1 style={{ fontSize: "clamp(32px,5vw,56px)" }}>Preguntas frecuentes</h1>
      {PREGUNTAS.map(([p, r]) => (
        <details key={p} className="hoja">
          <summary>
            <b>{p}</b>
          </summary>
          <p style={{ marginTop: 12 }}>{r}</p>
        </details>
      ))}
    </div>
  );
}
