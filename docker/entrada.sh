#!/bin/sh
# Migra, carga la configuración y el banco semilla (solo la primera vez) y arranca.
set -e
npx tsx scripts/sembrar.ts
exec npx next start -p "${PORT:-3000}"
