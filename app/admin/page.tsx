import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminContent } from "@/app/admin/AdminContent";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tu_clave_secreta_super_segura_para_jwt"
);

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let adminEmail = "Administrador";

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // 🔍 Modificación clave: Agregamos 'email' a la consulta SQL
    const userRes: any = await query(
      "SELECT role, email FROM public.users WHERE id = $1 LIMIT 1",
      [payload.userId]
    );
    const user = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];

    if (!user || user.role !== "admin") {
      redirect("/portal-cliente");
    }

    if (user.email) {
      adminEmail = user.email;
    }
  } catch (e) {
    redirect("/login");
  }

  // 🚀 Inyectamos el correo real al componente contenedor del admin
  return <AdminContent userEmail={adminEmail} />;
}
