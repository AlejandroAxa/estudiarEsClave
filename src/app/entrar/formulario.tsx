"use client";
import { useState } from "react";
import { authCliente } from "@/lib/auth/cliente";

export function FormularioEntrar({ destino, google }: { destino: string; google: boolean }) {
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<"listo" | "enviando" | "enviado" | "error">("listo");
  const [error, setError] = useState("");
  const callbackURL = `/bienvenida?siguiente=${encodeURIComponent(destino)}`;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    const r = await authCliente.signIn.magicLink({ email: correo.trim(), callbackURL, errorCallbackURL: "/entrar?error=enlace" });
    if (r.error) {
      setError(r.error.status === 429 ? "Pediste muchos enlaces. Espera unos minutos." : "No pudimos mandar el enlace. Revisa el correo e intenta de nuevo.");
      setEstado("error");
    } else setEstado("enviado");
  };

  if (estado === "enviado")
    return (
      <div className="hoja pila" role="status">
        <h2 style={{ fontSize: 24 }}>Revisa tu correo</h2>
        <p>
          Mandamos un enlace a <b>{correo}</b>. Ábrelo en este mismo teléfono o computadora. Si no llega en un minuto, busca en Spam o Promociones.
        </p>
        <button className="btn disc" onClick={() => setEstado("listo")}>
          Usar otro correo
        </button>
      </div>
    );

  return (
    <div className="hoja pila">
      <form onSubmit={enviar} className="pila">
        <label className="campo">
          Tu correo
          <input type="email" name="correo" autoComplete="email" inputMode="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </label>
        {estado === "error" && <p className="aviso error">{error}</p>}
        <button className="btn ancho" disabled={estado === "enviando"}>
          {estado === "enviando" ? "Enviando…" : "Mandarme el enlace"}
        </button>
      </form>
      {google && (
        <button className="btn sec ancho" onClick={() => authCliente.signIn.social({ provider: "google", callbackURL })}>
          Entrar con Google
        </button>
      )}
    </div>
  );
}
