# Estudiar es Clave

Simulador del EXANI-II para la ruta de Medicina (BUAP): mini diagnóstico sin registro, diagnóstico por subáreas, práctica diaria con repaso de errores, simulacro con tiempo, liga semanal por alias y pases de pago único.

La calificación es determinista (algoritmo `diag-1`, textos `txt-1`): no hay inteligencia artificial en tiempo de ejecución. Las fuentes de verdad del diseño están en la carpeta del proyecto (`modelado/modelo-ingenieria-software.md`, `identidad/DESIGN-F.md` y el formato del banco en `bancos/LEEME-formato-banco.md`).

## Tecnología

- Next.js 16 (App Router) en Vercel, con Fluid Compute.
- PostgreSQL en Neon (Vercel Marketplace) con Drizzle ORM. Las reglas del dominio que no caben en restricciones (D3, D8, D18) son disparadores en `drizzle/0001_reglas_dominio.sql`.
- Better Auth: enlace mágico por correo y Google opcional. El panel de administración pide además un código TOTP.
- Upstash Redis para límites de uso, Vercel Blob para las gráficas compartidas, Resend para correo y Mercado Pago (Checkout Pro) para cobrar.
- Vercel Cron para cerrar intentos vencidos, cerrar ligas, calibrar el banco y limpiar datos viejos (`vercel.ts`).

## Probar en tu computadora

Necesitas Node 22 o más nuevo. No hace falta instalar PostgreSQL: en local se usa PGlite.

```bash
npm install
cp .env.example .env.local
# En .env.local pon al menos:
#   DATABASE_URL=pglite:./.datos-local
#   BETTER_AUTH_SECRET=(salida de: openssl rand -hex 32)
#   BETTER_AUTH_URL=http://localhost:3000
#   PASARELA=simulada
npm run db:sembrar     # migra, configura, importa el banco semilla y publica 1.0.0-dev
npm run dev
```

Sin `RESEND_API_KEY`, el enlace para entrar aparece en la terminal donde corre `npm run dev`. Con `PASARELA=simulada` los pagos se aprueban o rechazan desde una pantalla de prueba.

Para el panel en `/admin`: pon tu correo en `ADMIN_EMAILS` antes de registrarte, corre `npm run admin:totp`, guarda el secreto en `ADMIN_TOTP_SECRET` y agrégalo a tu app autenticadora.

Comandos útiles:

| Comando | Qué hace |
| --- | --- |
| `npm test` | Pruebas (calificación, importador, flujo de examen, ARCO) sobre PGlite en memoria |
| `npm run typecheck` | Revisión de tipos |
| `npm run lint` | ESLint |
| `npm run db:generar` | Genera una migración nueva tras cambiar `src/db/schema.ts` |
| `npm run db:migrar` | Aplica migraciones a `DATABASE_URL` |
| `npm run db:configurar` | Configuración base (exámenes, límites, insignias, promoción). Segura en producción |
| `npm run db:sembrar` | Todo lo anterior más el banco semilla sin validar. Solo desarrollo y vistas previas |

## Verlo con Docker

Si tienes Docker Desktop, no necesitas instalar nada más ni poner claves:

```bash
docker compose up --build
```

Abre http://localhost:3000. La primera vez tarda unos minutos en compilar; luego carga Postgres con el banco semilla. Para entrar con tu cuenta, escribe cualquier correo en «Entrar» y copia el enlace que aparece en la terminal (no se manda correo real). Los pagos son simulados. Para el panel, entra con `admin@ejemplo.mx` y usa la clave TOTP que está en `docker-compose.yml`. Esa configuración es solo para tu computadora: no la uses en producción.

Para borrar los datos y empezar de cero: `docker compose down -v`.

## Publicar en Vercel

1. Importa este repositorio en Vercel.
2. En Storage / Marketplace agrega **Neon** (pone `DATABASE_URL`), **Upstash Redis** y **Vercel Blob**.
3. Agrega las variables de `.env.example` que faltan: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAILS`, `ADMIN_TOTP_SECRET`, `RESEND_API_KEY`, `CORREO_REMITENTE`, `PASARELA=mercadopago`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `CRON_SECRET` y, si quieres, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
4. Despliega. Cada compilación aplica las migraciones y la configuración base.
5. En Mercado Pago, configura la notificación de pagos (webhook) a `https://TU-DOMINIO/api/pagos/webhook` con el evento «Pagos» y copia su clave secreta a `MERCADOPAGO_WEBHOOK_SECRET`.
6. En Google Cloud (si usas Google), la URL de redirección es `https://TU-DOMINIO/api/auth/callback/google`.
7. Entra con tu correo de administrador, pasa el segundo factor y, en **Admin → Banco**, importa el banco **ya validado** y publica el release `1.0.0`. En **Admin → Precios** pon la fecha del examen cuando salga la convocatoria.

## El banco de preguntas

El banco llega como un archivo JSON validado fuera del sitio (no hay editor en línea). El importador rechaza el archivo completo si una sola pregunta tiene un error. En producción solo acepta reactivos en estado `validado` con `validado_por` y `validado_en`; los bancos semilla (Medicina con 338 preguntas, Ciencias Exactas con 114, Psicología con 163, las cuatro áreas EPIU de la BUAP con 263 cada una e Inglés con 100; las 63 de las áreas comunes son las mismas en todos) ya tienen el visto bueno docente y se importan en modo estricto. Un archivo con reactivos en `revisado_ia` solo se puede cargar en desarrollo, marcado «SIN VALIDAR».

Un release congela las versiones validadas y es inmutable. La calibración nocturna (R10) manda a revisión las preguntas con 100 respuestas o más que salen demasiado difíciles, no distinguen entre quien sabe y quien no, o tienen un distractor que casi nadie elige.

## Planes

| Plan | Qué incluye |
| --- | --- |
| Gratis | 1 diagnóstico por temporada, 15 preguntas de práctica al día, 1 protección de racha al mes |
| Prueba | 3 días con todo, sin tarjeta, una vez por cuenta |
| Pase Básico ($299) | Áreas generales sin límite: Comprensión lectora, Redacción indirecta y Pensamiento matemático |
| Paquete Medicina ($599) | Todo, incluidos Biología, Química, Premedicina y simulacros |

Los límites se editan en **Admin → Límites del plan**. Los precios incluyen IVA. Se aplica un solo descuento por compra: el mejor entre la promoción del último mes (40 %), un cupón o un código de referido (15 %).

## Estructura

```
src/app/            páginas y acciones del servidor
src/app/admin/      panel con segundo factor
src/app/api/cron/   tareas programadas
src/db/             esquema y conexión
src/lib/            reglas: diagnostico, evaluacion, banco, comercio, motivacion, planes, arco
drizzle/            migraciones
bancos/             banco semilla y su formato
scripts/            migrar, configurar, sembrar, secreto TOTP
```
