import Link from "next/link";

export function Pie() {
  return (
    <footer className="pie">
      <div className="wrap">
        <div>
          <b className="disp" style={{ fontStretch: "150%", fontWeight: 900, fontSize: 20 }}>
            estudiar es clave
          </b>
          <p style={{ maxWidth: "48ch", marginTop: 8 }}>
            Simulador independiente. No está afiliado al CENEVAL ni a la BUAP. Las calificaciones son estimaciones propias.
          </p>
        </div>
        <nav aria-label="Pie" style={{ display: "grid", gap: 6 }}>
          <Link href="/guia">Guía del examen</Link>
          <Link href="/carreras">Áreas generales</Link>
          <Link href="/areas">Áreas del examen (temarios)</Link>
          <Link href="/carreras/medicina">Medicina BUAP</Link>
          <Link href="/prepa">Prepa (EXANI-I)</Link>
          <Link href="/planes">Planes</Link>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
        </nav>
        <nav aria-label="Legal" style={{ display: "grid", gap: 6 }}>
          <Link href="/privacidad">Aviso de privacidad</Link>
          <Link href="/terminos">Términos</Link>
          <span>© {new Date().getFullYear()} Estudiar es Clave</span>
        </nav>
      </div>
    </footer>
  );
}
