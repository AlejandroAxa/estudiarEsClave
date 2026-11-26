import Link from "next/link";
import { Menu } from "lucide-react";
import { sesionActual } from "@/lib/sesion";
import { Latido } from "./marca";
import { t } from "@/textos/es-MX";
import { NavEnlaces } from "./nav-enlaces";

export async function Encabezado() {
  const ses = await sesionActual().catch(() => null);
  const enlaces = ses
    ? [
        { href: "/inicio", txt: t.nav.inicio },
        { href: "/diagnostico", txt: t.nav.diagnostico },
        { href: "/practica", txt: t.nav.practica },
        { href: "/avance", txt: t.nav.avance },
        { href: "/liga", txt: t.nav.liga },
        { href: "/cuenta", txt: t.nav.cuenta },
        ...(ses.roles.includes("admin") ? [{ href: "/admin", txt: t.nav.admin }] : []),
      ]
    : [
        { href: "/guia", txt: "Guía del examen" },
        { href: "/carreras", txt: "Áreas generales" },
        { href: "/areas", txt: "Temarios" },
        { href: "/planes", txt: t.nav.planes },
        { href: "/preguntas-frecuentes", txt: "Preguntas" },
        { href: "/entrar", txt: t.nav.entrar },
      ];
  const nav = <NavEnlaces enlaces={enlaces} />;
  return (
    <header className="cabeza">
      <div className="wrap">
        <Link href={ses ? "/inicio" : "/"} className="marca" aria-label="Estudiar es Clave, inicio">
          <Latido className="" />
          <b>clave</b>
        </Link>
        <nav className="principal" aria-label="Principal">
          {nav}
        </nav>
        <details className="menu-movil">
          <summary aria-label="Abrir menú">
            <Menu size={24} strokeWidth={1.75} />
          </summary>
          <nav aria-label="Principal (celular)">{nav}</nav>
        </details>
      </div>
    </header>
  );
}
