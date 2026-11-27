import { INSTAGRAM_URL } from "@/lib/redes";

/** Logotipo de Instagram en un solo color, para heredar el color del texto. */
export function IconoInstagram({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** Enlace a nuestro Instagram. `variante="boton"` lo muestra como píldora. */
export function BotonInstagram({
  variante = "enlace",
  texto = "Síguenos en Instagram",
}: {
  variante?: "enlace" | "boton";
  texto?: string;
}) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer me"
      className={variante === "boton" ? "tiktok-boton" : "tiktok-enlace"}
      aria-label={`${texto} (se abre en otra pestaña)`}
    >
      <IconoInstagram />
      <span>{texto}</span>
    </a>
  );
}
