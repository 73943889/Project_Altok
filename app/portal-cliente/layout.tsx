import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // 1. Barrera de seguridad: Si no hay token, redirigir al login
  if (!token) {
    redirect("/login?error=no_autorizado");
  }

  try {
    // 2. Verificar firma y validez del JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email as string;

    if (!email) {
      redirect("/login?error=token_invalido");
    }

    // 3. Verificación en tiempo real en Neon PostgreSQL
    const res: any = await query(
      "SELECT is_active FROM public.users WHERE email = $1 LIMIT 1",
      [email]
    );
    const rows = Array.isArray(res) ? res : res?.rows;

    const isActive =
      rows &&
      rows.length > 0 &&
      (rows[0].is_active === true ||
        rows[0].is_active === "t" ||
        rows[0].is_active === 1);

    if (!isActive) {
      redirect("/login?error=cuenta_inhabilitada");
    }
  } catch (error) {
    redirect("/login?error=sesion_expirada");
  }

  return <>{children}</>;
}