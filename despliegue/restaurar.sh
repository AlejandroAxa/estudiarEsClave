#!/bin/sh
# Restaura un respaldo sobre la base actual (borra lo que hay ahora).
# Uso, desde la carpeta del proyecto:  sh despliegue/restaurar.sh respaldos/clave-20270101-0900.dump
set -e
[ -f "$1" ] || { echo "Indica el archivo, por ejemplo: sh despliegue/restaurar.sh respaldos/clave-AAAAMMDD-HHMM.dump"; exit 1; }
nombre=$(basename "$1")
echo "Se va a reemplazar la base con $nombre. Escribe SI para seguir:"
read r; [ "$r" = "SI" ] || exit 1
c="docker compose -f compose.produccion.yml"
$c stop web tareas
$c run --rm --no-deps tareas \
  pg_restore --clean --if-exists --no-owner --no-acl -d clave "/respaldos/$nombre"
$c start web tareas
echo "Listo. La base quedó como en $nombre."
