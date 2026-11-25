#!/bin/sh
# Crea .env con claves aleatorias nuevas. Solo pregunta el dominio y tu correo.
# Uso, desde la carpeta del proyecto:  sh despliegue/crear-env.sh
set -e
[ -f .env ] && { echo "Ya existe .env; no lo sobrescribo. Bórralo primero si de verdad quieres uno nuevo."; exit 1; }
printf "Dominio del sitio, sin https:// (ej. estudiaresclave.mx): "; read dominio
printf "Tu correo (será el administrador del panel): "; read correo
alf=ABCDEFGHIJKLMNOPQRSTUVWXYZ234567
totp=$(head -c 400 /dev/urandom | tr -dc "$alf" | head -c 32)
sed -e "s|^DOMINIO=.*|DOMINIO=$dominio|" \
    -e "s|^ADMIN_EMAILS=.*|ADMIN_EMAILS=$correo|" \
    -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
    -e "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -hex 32)|" \
    -e "s|^CRON_SECRET=.*|CRON_SECRET=$(openssl rand -hex 24)|" \
    -e "s|^ADMIN_TOTP_SECRET=.*|ADMIN_TOTP_SECRET=$totp|" \
    -e "s|^CORREO_REMITENTE=.*|CORREO_REMITENTE=\"Estudiar es Clave <hola@$dominio>\"|" \
    despliegue/env.produccion.example > .env
chmod 600 .env
echo
echo "Listo: .env creado. Agrega esta clave a tu app autenticadora (Google Authenticator, etc.),"
echo "tipo «basada en tiempo», para entrar al panel de administración:"
echo
echo "    $totp"
echo
echo "Falta poner a mano en .env: RESEND_API_KEY, MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_WEBHOOK_SECRET."
echo "Ábrelo con:  nano .env"
