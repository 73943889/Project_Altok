import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

const rawSecret = env.JWT_SECRET || process.env.JWT_SECRET || "placeholder_jwt_secret_for_build_phase_only";
const JWT_SECRET = new TextEncoder().encode(rawSecret);

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
    const userId = (payload as any).userId || (payload as any).id;
    const sessionToken = (payload as any).sessionToken;
    const email = payload.email as string;

    if (!email || !userId) {
      redirect("/login?error=token_invalido");
    }

    // 3. Verificación doble en Neon PostgreSQL (Estado de Usuario + Sesión Única Activa)
    const res: any = await query(
      `SELECT u.is_active, s.refresh_token 
       FROM public.users u
       LEFT JOIN public.sessions s ON u.id = s.user_id
       WHERE u.id = $1 LIMIT 1`,
      [userId]
    );
    const rows = Array.isArray(res) ? res : res?.rows;

    if (!rows || rows.length === 0) {
      redirect("/login?error=usuario_no_encontrado");
    }

    const userData = rows[0];

    // A. Validar que la cuenta esté activa
    const isActive =
      userData.is_active === true ||
      userData.is_active === "t" ||
      userData.is_active === 1;

    if (!isActive) {
      redirect("/login?error=cuenta_inhabilitada");
    }

    // B. 🔒 VALIDACIÓN DE SESIÓN ÚNICA EN TIEMPO REAL
    // Si el sessionToken de la cookie NO coincide con el refresh_token guardado en BD,
    // significa que el usuario inició sesión en otro navegador/dispositivo.
    if (sessionToken && userData.refresh_token !== sessionToken) {
      redirect("/login?error=sesion_expulsada");
    }

  } catch (error: any) {
    // Si la excepción es por la redirección de Next.js, la dejamos pasar
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/login?error=sesion_expirada");
  }

  return <>{children}</>;
}