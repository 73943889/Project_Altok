import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
// ... tus otros imports (fuentes, css, etc.)

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // Si hay token, verificamos globalmente que la cuenta no haya sido inhabilitada
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const email = payload.email as string;

      const res: any = await query(
        "SELECT is_active FROM public.users WHERE email = $1 LIMIT 1",
        [email]
      );
      const rows = Array.isArray(res) ? res : res?.rows;

      const isActive = rows && rows.length > 0 && (rows[0].is_active === true || rows[0].is_active === 't' || rows[0].is_active === 1);

      if (!isActive) {
        // Matamos cookies globalmente y forzamos recarga sin sesión
        cookieStore.set({ name: "auth_token", value: "", maxAge: 0, path: "/" });
        cookieStore.set({ name: "user_email", value: "", maxAge: 0, path: "/" });
        // Redirigir limpiamente para que la UI (Navbar) se repinte sin usuario
        redirect("/?alert=sesion_cerrada_por_admin"); 
      }
    } catch (error) {
      // Si el token es inválido/expirado, lo limpiamos de paso
      cookieStore.set({ name: "auth_token", value: "", maxAge: 0, path: "/" });
    }
  }

  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}