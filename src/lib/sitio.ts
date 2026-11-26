/**
 * Dirección pública del sitio. Se lee al momento (no al compilar): en el VPS la
 * imagen se compila sin variables de entorno, y el sitemap, robots.txt y las
 * URL canónicas salían con un dominio equivocado.
 */
export const DOMINIO_PREDETERMINADO = "https://estudiaresclave.com";

export const urlSitio = () => (process.env.BETTER_AUTH_URL || DOMINIO_PREDETERMINADO).replace(/\/$/, "");
