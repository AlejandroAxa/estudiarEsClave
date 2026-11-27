import { TIKTOK_URL } from "@/lib/redes";

/** Logotipo de TikTok en un solo trazo, para heredar el color del texto. */
export function IconoTikTok({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.4-2.47V9.67a5.7 5.7 0 0 0-.8-.06 5.69 5.69 0 0 0-5.69 5.69A5.69 5.69 0 0 0 9.86 21a5.69 5.69 0 0 0 5.69-5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.25-1.48Z" />
    </svg>
  );
}

/** Enlace a nuestro TikTok. `variante="boton"` lo muestra como píldora. */
export function BotonTikTok({
  variante = "enlace",
  texto = "Síguenos en TikTok",
}: {
  variante?: "enlace" | "boton";
  texto?: string;
}) {
  return (
    <a
      href={TIKTOK_URL}
      target="_blank"
      rel="noopener noreferrer me"
      className={variante === "boton" ? "tiktok-boton" : "tiktok-enlace"}
      aria-label={`${texto} (se abre en otra pestaña)`}
    >
      <IconoTikTok />
      <span>{texto}</span>
    </a>
  );
}
