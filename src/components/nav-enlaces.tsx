"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Enlaces del menú con la página actual marcada (aria-current) para saber dónde estás. */
export function NavEnlaces({ enlaces }: { enlaces: { href: string; txt: string }[] }) {
  const ruta = usePathname() ?? "";
  return (
    <>
      {enlaces.map((e) => {
        const actual = ruta === e.href || (e.href !== "/" && ruta.startsWith(e.href + "/"));
        return (
          <Link key={e.href} href={e.href} aria-current={actual ? "page" : undefined}>
            {e.txt}
          </Link>
        );
      })}
    </>
  );
}
