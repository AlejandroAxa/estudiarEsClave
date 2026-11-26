#!/bin/sh
# Cierra los puertos 80 y 443 a todo lo que no sea Cloudflare, para que nadie
# pueda saltarse la protección atacando directo la IP del VPS.
#
#   sh despliegue/solo-cloudflare.sh          activa (y queda activo al reiniciar)
#   sh despliegue/solo-cloudflare.sh quitar   vuelve a abrir los puertos a todos
#
# Úsalo SOLO cuando el sitio ya cargue a través de Cloudflare (nube naranja).
# Docker publica los puertos por encima de ufw, por eso las reglas van en la
# cadena DOCKER-USER de iptables. SSH (puerto 22) no se toca.
set -e
[ "$(id -u)" = 0 ] || { echo "Córrelo como root (sudo)."; exit 1; }
RUTA="$(cd "$(dirname "$0")" && pwd)/solo-cloudflare.sh"
EXT="$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="dev") print $(i+1)}')"

quitar() {
  for ipt in iptables ip6tables; do
    while $ipt -D DOCKER-USER -i "$EXT" -j CF-ORIGEN 2>/dev/null; do :; done
    $ipt -F CF-ORIGEN 2>/dev/null || true
    $ipt -X CF-ORIGEN 2>/dev/null || true
  done
}

if [ "$1" = quitar ]; then
  quitar
  systemctl disable --now solo-cloudflare.service 2>/dev/null || true
  rm -f /etc/systemd/system/solo-cloudflare.service
  echo "Listo: los puertos 80 y 443 vuelven a aceptar a cualquiera."
  exit 0
fi

command -v ipset >/dev/null || { apt-get update -q && apt-get install -y -q ipset; }
iptables -L DOCKER-USER -n >/dev/null 2>&1 || { echo "No encuentro la cadena DOCKER-USER. ¿Está corriendo Docker?"; exit 1; }

echo "1/3 Descargando la lista de IP de Cloudflare…"
v4="$(curl -fsS https://www.cloudflare.com/ips-v4)"
v6="$(curl -fsS https://www.cloudflare.com/ips-v6)"
[ -n "$v4" ] || { echo "No pude descargar la lista; no cambié nada."; exit 1; }
ipset create cf4 hash:net family inet -exist && ipset flush cf4
for n in $v4; do ipset add cf4 "$n"; done
ipset create cf6 hash:net family inet6 -exist && ipset flush cf6
for n in $v6; do ipset add cf6 "$n"; done

echo "2/3 Reglas: solo Cloudflare entra por 80 y 443 (interfaz $EXT)…"
quitar
for par in "iptables cf4" "ip6tables cf6"; do
  set -- $par
  $1 -L DOCKER-USER -n >/dev/null 2>&1 || continue
  $1 -N CF-ORIGEN
  $1 -A CF-ORIGEN -p tcp -m multiport ! --dports 80,443 -j RETURN
  $1 -A CF-ORIGEN -p udp ! --dport 443 -j RETURN
  $1 -A CF-ORIGEN -m set --match-set "$2" src -j RETURN
  $1 -A CF-ORIGEN -j DROP
  $1 -I DOCKER-USER -i "$EXT" -j CF-ORIGEN
done

echo "3/3 Haciendo que se vuelva a aplicar al reiniciar el servidor…"
cat > /etc/systemd/system/solo-cloudflare.service <<UNIDAD
[Unit]
Description=Puertos 80 y 443 solo para Cloudflare
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStartPre=/bin/sleep 10
ExecStart=/bin/sh $RUTA

[Install]
WantedBy=multi-user.target
UNIDAD
systemctl daemon-reload
systemctl enable solo-cloudflare.service >/dev/null
echo "Listo. Prueba que el sitio abra en el navegador. Si algo falla: sh $RUTA quitar"
