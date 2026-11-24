/**
 * Better Auth: enlace mágico por correo (sin contraseñas) y Google opcional.
 * Las tablas viven en la misma base (cuenta, sesion, proveedor_cuenta, verificacion).
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as s from "@/db/schema";
import { enviarCorreo, plantillaCorreo } from "../correo";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const auth = betterAuth({
  appName: "Estudiar es Clave",
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: s.cuenta, session: s.sesion, account: s.proveedorCuenta, verification: s.verificacion },
  }),
  socialProviders: google,
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 30 },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        const c = plantillaCorreo("Tu enlace para entrar", "Toca el botón para entrar a Estudiar es Clave. El enlace sirve una sola vez y vence en 15 minutos.", { texto: "Entrar", url });
        await enviarCorreo({ para: email, asunto: "Tu enlace para entrar a Estudiar es Clave", ...c });
      },
    }),
    nextCookies(),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (u) => {
          const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
          await db.insert(s.cuentaRol).values({ cuentaId: u.id, rol: "alumno" }).onConflictDoNothing();
          if (admins.includes(u.email.toLowerCase())) await db.insert(s.cuentaRol).values({ cuentaId: u.id, rol: "admin" }).onConflictDoNothing();
        },
      },
    },
  },
});
