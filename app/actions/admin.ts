// app/actions/admin.ts
'use server';

import { query } from "@/lib/db";
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_permanente'
);

export async function updateUserRoleAction(userId: string, newRole: string) {
  noStore();
  try {
    // 🛡️ Validación de seguridad: Verificar que quien ejecuta sea Admin
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return { success: false, error: "No autorizado." };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      return { success: false, error: "Acceso denegado. Se requieren privilegios de Administrador." };
    }

    // Normalizamos el rol a minúsculas para mantener consistencia en la BD
    const normalizedRole = newRole.toLowerCase().trim();
    if (!['admin', 'client', 'operator'].includes(normalizedRole)) {
      return { success: false, error: "Rol no válido." };
    }

    // ⚡ Actualización en Neon PostgreSQL
    const queryStr = `
      UPDATE public.users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, role;
    `;
    
    const result = await query(queryStr, [normalizedRole, userId]);

    if (!result.rows || result.rows.length === 0) {
      return { success: false, error: "Usuario no encontrado." };
    }

    return { success: true, data: result.rows[0] };
  } catch (err: any) {
    console.error("Error al actualizar rol de usuario:", err);
    return { success: false, error: err.message || "Error interno al actualizar el rol." };
  }
}