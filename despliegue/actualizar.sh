#!/bin/sh
# Trae la última versión de main, respalda la base y reconstruye el sitio.
# Uso, desde la carpeta del proyecto:  sh despliegue/actualizar.sh
set -e
c="docker compose -f compose.produccion.yml"
echo "1/3 Respaldo antes de actualizar…"
$c exec -T tareas sh /despliegue/respaldar.sh
echo "2/3 Bajando cambios…"
git pull --ff-only
echo "3/3 Reconstruyendo y reiniciando (el sitio aplica las migraciones al arrancar)…"
$c up -d --build
docker image prune -f >/dev/null
$c ps
