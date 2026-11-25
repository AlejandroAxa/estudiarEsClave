# Imagen del sitio. Sirve igual para la vista local (docker-compose.yml) y para
# el VPS (compose.produccion.yml); la diferencia la marca ENTORNO=produccion.
FROM node:22-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valor temporal solo para compilar; el real llega desde el archivo .env o docker-compose.yml.
RUN BETTER_AUTH_SECRET=solo-para-compilar-0000000000000000 npx next build

FROM base AS app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /app ./
RUN mkdir -p /app/almacen && chown node:node /app/almacen
USER node
EXPOSE 3000
# Producción: migraciones y configuración base. Local: además el banco semilla.
CMD ["sh", "-c", "if [ \"$ENTORNO\" = produccion ]; then npx tsx scripts/configurar.ts; else npx tsx scripts/sembrar.ts; fi && exec npx next start -p ${PORT}"]
