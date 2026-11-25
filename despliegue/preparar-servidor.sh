#!/bin/sh
# Prepara un VPS Ubuntu 24.04 recién creado: actualiza, instala Docker, abre solo
# los puertos necesarios en el cortafuegos y agrega memoria de intercambio (swap).
# Uso, como root:  sh preparar-servidor.sh
set -e
export DEBIAN_FRONTEND=noninteractive
echo "1/4 Actualizando el sistema…"
apt-get update -q && apt-get upgrade -y -q
apt-get install -y -q ca-certificates curl git ufw unattended-upgrades
echo "2/4 Instalando Docker…"
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; fi
echo "3/4 Cortafuegos: solo SSH, HTTP y HTTPS…"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
echo "4/4 Memoria de intercambio de 2 GB (ayuda al compilar)…"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
dpkg-reconfigure -f noninteractive unattended-upgrades
echo
docker --version && docker compose version
echo "Servidor listo."
