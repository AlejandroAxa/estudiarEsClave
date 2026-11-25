# Guía para publicar Estudiar es Clave en un VPS

Esta guía lleva el sitio a un servidor propio (un VPS) paso a paso, sin necesidad de saber de servidores. Está pensada para un **VPS KVM 2 de Hostinger con Ubuntu 24.04**, pero sirve igual en cualquier VPS con Ubuntu.

Calcula una hora y media la primera vez. Casi todo es copiar y pegar comandos.

## Qué vas a montar

Todo corre en el mismo VPS, cada pieza en su propio contenedor de Docker:

| Pieza | Qué hace | Antes, en Vercel |
| --- | --- | --- |
| `web` | El sitio (Next.js) | Vercel Functions |
| `db` | La base de datos PostgreSQL | Neon |
| `redis` | Cuenta los intentos para frenar abusos (límites de uso) | Upstash |
| `caddy` | Recibe las visitas, pone el candado HTTPS y lo renueva solo | Vercel |
| `tareas` | Corre las tareas programadas y hace el respaldo diario de la base | Vercel Cron |
| Volumen `almacen` | Guarda las gráficas de avance que comparten los alumnos | Vercel Blob |

Siguen fuera del VPS, como antes: **Resend** (manda los correos para entrar) y **Mercado Pago** (cobra).

Los archivos de esta configuración están en la carpeta `despliegue/` del repositorio y en `compose.produccion.yml`.

## Paso 0. Lo que necesitas tener a la mano

- El VPS contratado (Hostinger KVM 2 o similar).
- Un dominio (por ejemplo `estudiaresclave.mx`) y acceso a su panel de DNS.
- Una cuenta en [Resend](https://resend.com) para mandar correos.
- Tu cuenta de vendedor en [Mercado Pago](https://www.mercadopago.com.mx/developers) con las credenciales de producción.
- Una app autenticadora en el celular (Google Authenticator, Microsoft Authenticator o similar).
- En tu computadora con Windows: la app **PowerShell** (ya viene instalada).

## Paso 1. Preparar el VPS en Hostinger

1. En el panel de Hostinger, entra a tu VPS y elige como sistema operativo **Ubuntu 24.04** «limpio» (sin panel de control ni aplicaciones extra).
2. Pon una **contraseña de root** larga y guárdala en un lugar seguro.
3. Copia la **dirección IP** del VPS (algo como `185.123.45.67`). La vas a usar varias veces; en esta guía aparece como `TU-IP`.

## Paso 2. Apuntar el dominio al VPS

En el panel de DNS de tu dominio (en Hostinger está en **Dominios → DNS / Nameservers**) crea o cambia estos registros:

| Tipo | Nombre | Apunta a |
| --- | --- | --- |
| A | `@` | `TU-IP` |
| A | `www` | `TU-IP` |

Si ya había registros `A` o `CNAME` para `@` o `www` (por ejemplo los de Vercel), bórralos. El cambio puede tardar desde unos minutos hasta unas horas. Puedes revisarlo en [dnschecker.org](https://dnschecker.org) escribiendo tu dominio: cuando aparezca `TU-IP` en casi todo el mapa, ya está.

## Paso 3. Entrar al VPS

Abre PowerShell en tu computadora y escribe:

```bash
ssh root@TU-IP
```

La primera vez te pregunta si confías en el servidor: escribe `yes` y Enter. Luego pega la contraseña de root (no se ve mientras la escribes; es normal) y Enter. Cuando veas algo como `root@srv123:~#`, ya estás dentro del VPS. **Todos los comandos que siguen se escriben ahí.**

> Para pegar en PowerShell usa clic derecho o Ctrl+V.

## Paso 4. Bajar el código y preparar el servidor

```bash
apt-get update && apt-get install -y git
git clone https://github.com/alejandroaxa/estudiaresclave.git /opt/estudiaresclave
cd /opt/estudiaresclave
sh despliegue/preparar-servidor.sh
```

Si el repositorio es privado, `git clone` te pide usuario y contraseña. En usuario pon tu usuario de GitHub, y en contraseña un **token**: créalo en GitHub en *Settings → Developer settings → Personal access tokens → Fine-grained tokens*, solo para este repositorio y con permiso de **Contents: Read-only**.

El script `preparar-servidor.sh` tarda unos minutos. Actualiza Ubuntu, instala Docker, deja abiertos solo los puertos necesarios (SSH, 80 y 443), agrega 2 GB de memoria de intercambio para que la compilación no se quede sin memoria y activa las actualizaciones de seguridad automáticas. Al final dice «Servidor listo».

## Paso 5. Crear el archivo de claves (`.env`)

```bash
cd /opt/estudiaresclave
sh despliegue/crear-env.sh
```

Te pregunta tu dominio (sin `https://`) y tu correo. Crea el archivo `.env` con claves aleatorias nuevas y te muestra una **clave para el panel de administración**. Agrégala ahora a tu app autenticadora: *Agregar cuenta → Introducir clave de configuración*, tipo «basada en tiempo». Si se te pasa, la encuentras luego en `.env` en la línea `ADMIN_TOTP_SECRET`.

Faltan tres valores que tienes que pegar tú. Abre el archivo con:

```bash
nano .env
```

Muévete con las flechas y llena:

- `RESEND_API_KEY`: en Resend, *API Keys → Create API Key*.
- `MERCADOPAGO_ACCESS_TOKEN`: en Mercado Pago Developers, *Tus integraciones → (tu aplicación) → Credenciales de producción → Access Token*.
- `MERCADOPAGO_WEBHOOK_SECRET`: lo obtienes en el paso 9. Por ahora déjalo vacío.

Si usas «Entrar con Google», llena también `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

Guarda con **Ctrl+O** y Enter, y sal con **Ctrl+X**.

> El archivo `.env` tiene todas las llaves del sitio. No lo compartas ni lo subas a GitHub (ya está excluido).

## Paso 6. Encender el sitio

```bash
docker compose up -d --build
```

La primera vez tarda entre 5 y 10 minutos porque compila el sitio. Cuando termine, revisa que todo esté arriba:

```bash
docker compose ps
```

Debes ver `db`, `redis`, `web`, `caddy` y `tareas` con estado `Up` (y `healthy` en `db`, `redis` y `web`). `web` tarda hasta un minuto en pasar a `healthy`.

Abre `https://TU-DOMINIO` en el navegador. Si ves el candado y la portada, ya quedó. Si no, ve a [Problemas comunes](#problemas-comunes).

## Paso 7. Cargar el banco de preguntas

El sitio arranca sin preguntas. Para cargar los bancos ya validados por docentes que vienen en el repositorio y publicar el release `1.0.0`:

```bash
docker compose exec web npx tsx scripts/cargar-bancos.ts 1.0.0
```

Al final dice «Release 1.0.0 publicado con … reactivos». También crea los productos (Pase Básico y Paquete Medicina) si no existían.

Si más adelante llega un banco corregido, súbelo al repositorio y, después de actualizar (paso 11), corre el mismo comando con la versión siguiente, por ejemplo `1.0.1`. Si no hay preguntas nuevas, no publica nada. También puedes importar bancos desde **Admin → Banco** en el sitio.

## Paso 8. Entrar como administrador

1. En el sitio, pulsa «Entrar» y escribe el correo que diste en el paso 5.
2. Te llega un correo con el enlace para entrar.
3. Ve a `https://TU-DOMINIO/admin` y escribe el código de 6 dígitos de tu app autenticadora.
4. En **Admin → Precios** pon la fecha del examen cuando salga la convocatoria.

## Paso 9. Conectar los servicios externos

**Resend (correo).** Para que los correos salgan desde tu dominio y no lleguen a spam, en Resend ve a *Domains → Add Domain*, escribe tu dominio y agrega en tu DNS los registros que te muestra (TXT y MX). Cuando Resend diga «Verified», revisa en `.env` que `CORREO_REMITENTE` use ese dominio.

**Mercado Pago (pagos).** En *Tus integraciones → (tu aplicación) → Webhooks → Configurar notificaciones*, modo productivo:

- URL: `https://TU-DOMINIO/api/pagos/webhook`
- Evento: **Pagos**

Guarda y copia la **clave secreta** que te muestra a `MERCADOPAGO_WEBHOOK_SECRET` en `.env` (con `nano .env`). Luego reinicia el sitio para que la tome:

```bash
docker compose up -d
```

**Google (opcional).** En Google Cloud, la URL de redirección autorizada es `https://TU-DOMINIO/api/auth/callback/google`.

Haz una compra de prueba con un monto real pequeño para confirmar que el pago llega y el pase se activa.

## Paso 10. Respaldos

Todos los días a las 2:00 de la mañana (hora del centro de México) se guarda un respaldo de la base en `/opt/estudiaresclave/respaldos/`. Se conservan los últimos 14 días (cámbialo con `DIAS_RESPALDO` en `.env`).

Ver los respaldos:

```bash
ls -lh /opt/estudiaresclave/respaldos
```

Hacer uno en este momento:

```bash
docker compose exec tareas sh /despliegue/respaldar.sh
```

**Guarda una copia fuera del VPS** (si el VPS se pierde, sus respaldos también). Desde PowerShell en tu computadora, no en el VPS:

```bash
scp -r root@TU-IP:/opt/estudiaresclave/respaldos .
```

Además, en el panel de Hostinger activa las **copias de seguridad semanales** o toma una **instantánea (snapshot)** antes de cambios grandes.

Restaurar un respaldo (reemplaza todo lo que hay en la base por lo del archivo):

```bash
cd /opt/estudiaresclave
sh despliegue/restaurar.sh respaldos/clave-AAAAMMDD-HHMM.dump
```

## Paso 11. Actualizar el sitio cuando haya cambios en GitHub

```bash
cd /opt/estudiaresclave
sh despliegue/actualizar.sh
```

Hace un respaldo, baja lo último de `main`, recompila y reinicia. Las migraciones de la base se aplican solas al arrancar. El sitio deja de responder uno o dos minutos mientras reinicia; hazlo en horas de poco uso.

## Si ya tenías datos en Vercel (Neon)

Solo si el sitio ya tuvo alumnos reales en Vercel. Con el sitio del VPS recién encendido y **antes** del paso 7:

1. En Neon, copia la cadena de conexión de la base de producción (empieza con `postgres://` y termina en `neon.tech/...`).
2. En el VPS:

```bash
cd /opt/estudiaresclave
docker compose stop web tareas
docker compose run --rm --no-deps tareas sh -c 'pg_dump -Fc -d "CADENA-DE-NEON" -f /respaldos/desde-neon.dump'
docker compose run --rm --no-deps tareas pg_restore --clean --if-exists --no-owner --no-acl -d clave /respaldos/desde-neon.dump
docker compose start web tareas
```

Cambia `CADENA-DE-NEON` por la cadena completa, dentro de las comillas. Después de revisar que todo está bien, apunta el dominio al VPS (paso 2) y apaga el proyecto en Vercel.

## Comandos útiles

Todos se corren dentro de `/opt/estudiaresclave` (escribe `cd /opt/estudiaresclave` si acabas de entrar).

| Para | Comando |
| --- | --- |
| Ver si todo está arriba | `docker compose ps` |
| Ver lo que dice el sitio (salir con Ctrl+C) | `docker compose logs -f web` |
| Ver las tareas programadas y respaldos | `docker compose logs --tail 50 tareas` |
| Ver lo del certificado HTTPS | `docker compose logs --tail 50 caddy` |
| Reiniciar el sitio | `docker compose restart web` |
| Aplicar cambios de `.env` | `docker compose up -d` |
| Apagar todo (los datos se conservan) | `docker compose down` |
| Espacio libre en disco | `df -h /` |

**Nunca** uses `docker compose down -v`: la `-v` borra la base de datos.

## Problemas comunes

**El navegador dice que el sitio no es seguro o no carga.** Casi siempre es el DNS: revisa en dnschecker.org que el dominio ya apunte a `TU-IP`. Luego mira `docker compose logs --tail 50 caddy`. Si menciona `rate limit` o `challenge failed`, espera a que el DNS esté listo y corre `docker compose restart caddy`.

**`web` no pasa a `healthy` o se reinicia.** Mira `docker compose logs --tail 100 web`. Un mensaje con `Falta …` indica que falta una variable en `.env`. Si menciona `La pasarela simulada no se permite en producción`, falta `MERCADOPAGO_ACCESS_TOKEN`.

**No llega el correo para entrar.** Revisa `RESEND_API_KEY` y que el dominio esté verificado en Resend. Los errores aparecen en `docker compose logs web`.

**La compilación se detiene con «Killed».** Falta memoria. Revisa que la memoria de intercambio esté activa con `swapon --show`; si no aparece nada, corre otra vez `sh despliegue/preparar-servidor.sh`.

**`docker compose` dice que no encuentra el servicio o el archivo.** Estás en otra carpeta: escribe `cd /opt/estudiaresclave` y repite.

## Seguridad básica

- Solo están abiertos los puertos 22 (SSH), 80 y 443. La base y Redis no se ven desde internet.
- Cuando te sientas cómodo, entra con **llave SSH** en lugar de contraseña: en Hostinger, *VPS → Configuración → Claves SSH*.
- Las actualizaciones de seguridad de Ubuntu se instalan solas. Una vez al mes entra y corre `apt-get update && apt-get upgrade -y`, y reinicia el VPS desde el panel si lo pide.
