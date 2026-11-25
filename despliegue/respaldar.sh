#!/bin/sh
# Respaldo comprimido de la base en ./respaldos del VPS. Guarda los últimos DIAS_RESPALDO días.
set -e
umask 077
archivo="/respaldos/clave-$(date -u +%Y%m%d-%H%M).dump"
pg_dump -Fc -f "$archivo.tmp"
mv "$archivo.tmp" "$archivo"
find /respaldos -name 'clave-*.dump' -mtime +"${DIAS_RESPALDO:-14}" -delete
echo "Respaldo listo: $archivo"
