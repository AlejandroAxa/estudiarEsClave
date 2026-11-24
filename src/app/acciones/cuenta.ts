"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auth } from "@/lib/auth/auth";
import { borrarCuenta } from "@/lib/arco";
import { requerirSesion } from "@/lib/sesion";
import { headers } from "next/headers";

export async function accionBorrarCuenta(_p: { error?: string } | undefined, form: FormData) {
  const ses = await requerirSesion("/cuenta");
  if (String(form.get("confirmar") ?? "").trim().toUpperCase() !== "BORRAR") return { error: "Escribe BORRAR para confirmar." };
  await auth.api.signOut({ headers: await headers() }).catch(() => {});
  await borrarCuenta(db, ses.cuenta.id);
  const jar = await cookies();
  for (const c of jar.getAll()) if (c.name.startsWith("eec_") || c.name.includes("better-auth")) jar.delete(c.name);
  redirect("/?cuenta_borrada=1");
}

export async function salir() {
  await auth.api.signOut({ headers: await headers() }).catch(() => {});
  redirect("/");
}
