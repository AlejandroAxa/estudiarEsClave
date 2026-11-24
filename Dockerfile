# Imagen para ver el sitio en local con Docker. En producción se usa Vercel.
FROM node:22-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valor temporal solo para compilar; el real llega desde docker-compose.yml.
RUN BETTER_AUTH_SECRET=solo-para-compilar-0000000000000000 npx next build

FROM base AS app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app ./
EXPOSE 3000
# Migra, carga configuración y banco semilla (solo la primera vez) y arranca.
CMD ["sh", "-c", "npx tsx scripts/sembrar.ts && exec npx next start -p ${PORT}"]
