"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAdminUsersAction() {
  try {
    const result = await query(`
      SELECT 
        id, 
        full_name, 
        email, 
        role, 
        is_active, 
        created_at 
      FROM public.users 
      ORDER BY created_at DESC
    `);
    
    const rows = Array.isArray(result) ? result : result?.rows || [];

    // Mapeo defensivo para asegurar que is_active sea estrictamente booleano (true / false)
    const users = rows.map((u: any) => ({
      ...u,
      is_active: u.is_active === true || u.is_active === 't' || u.is_active === 1
    }));

    return { success: true, users };
  } catch (err: any) {
    console.error("❌ Error al obtener usuarios:", err);
    return { success: false, error: err.message, users: [] };
  }
}

export async function updateUserRoleAction(userId: string, newRole: "ADMIN" | "CLIENTE") {
  try {
    await query(
      `UPDATE public.users SET role = $1 WHERE id = $2`,
      [newRole, userId]
    );
    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error al actualizar rol:", err);
    return { success: false, error: err.message };
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  try {
    const newStatus = !currentStatus; // Invierte el booleano actual
    
    console.log(`🔄 Actualizando usuario ID: ${userId} a is_active: ${newStatus}`);

    // Ejecutamos el update explícito en Neon
    const res = await query(
      `UPDATE public.users SET is_active = $1 WHERE id = $2 RETURNING id, is_active`,
      [newStatus, userId]
    );

    const updatedRows = Array.isArray(res) ? res : res?.rows;

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(`No se encontró ningún usuario con el ID: ${userId} para actualizar.`);
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error crítico al actualizar el estado del usuario en Neon:", err.message);
    return { success: false, error: err.message };
  }
}