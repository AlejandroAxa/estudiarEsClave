import Link from "next/link";

export const metadata = { title: { default: "Administración", template: "%s · Admin" }, robots: { index: false } };

const SECCIONES = [
  ["/admin", "Resumen"],
  ["/admin/banco", "Banco y releases"],
  ["/admin/comercio", "Precios y promociones"],
  ["/admin/limites", "Límites del plan"],
  ["/admin/reportes", "Reportes de error"],
  ["/admin/cuentas", "Cuentas"],
  ["/admin/auditoria", "Auditoría"],
];

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap band pila">
      <nav className="fila" aria-label="Administración" style={{ flexWrap: "wrap", gap: 8 }}>
        {SECCIONES.map(([h, t]) => (
          <Link key={h} href={h} className="pastilla">
            {t}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
