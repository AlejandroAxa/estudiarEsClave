#!/bin/sh
# Llama a una tarea programada del sitio con el secreto, como lo hacía Vercel Cron.
# Uso: tarea.sh limpieza
wget -q -O - -T 120 --header "Authorization: Bearer ${CRON_SECRET}" "http://web:3000/api/cron/$1" \
  && echo " <- $1 ok" || echo "tarea $1 falló"
