import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Antes de compilar: migraciones pendientes y configuración base (idempotente).
  buildCommand: "npm run db:configurar && next build",
  regions: ["iad1"],
  crons: [
    { path: "/api/cron/cerrar-intentos", schedule: "*/10 * * * *" },
    // Lunes 00:00 en la Ciudad de México.
    { path: "/api/cron/ligas", schedule: "0 6 * * 1" },
    { path: "/api/cron/calibracion", schedule: "0 9 * * *" },
    { path: "/api/cron/limpieza", schedule: "30 9 * * *" },
  ],
};
