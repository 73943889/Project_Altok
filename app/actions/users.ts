'use server';

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import Pusher from 'pusher';

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

const cleanEnv = (val?: string) => {
  if (!val) return '';
  return val.replace(/^[^=]+=\s*/, '').replace(/^["']|["']$/g, '').trim();
};

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  try {
    // Invertimos de manera limpia el estado actual para la base de datos
    const newStatus = !currentStatus;
    
    console.log(`🔄 Actualizando usuario ID: ${userId} a is_active: ${newStatus}`);

    // Ejecutamos la actualización directa en Neon PostgreSQL
    const res = await query(
      `UPDATE public.users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_active`,
      [newStatus, userId]
    );

    const updatedRows = Array.isArray(res) ? res : res?.rows;

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(`No se encontró ningún usuario con el ID: ${userId} para actualizar.`);
    }

    // ⚡ Emisión en tiempo real mediante Pusher para notificar al cliente (Kick-out si es inhabilitado)
    try {
      const appId = cleanEnv(process.env.PUSHER_APP_ID);
      const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY);
      const secret = cleanEnv(process.env.PUSHER_SECRET);
      const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER) || 'mt1';

      if (appId && key && secret) {
        const pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });

        await pusher.trigger('operations-channel', 'user-status-changed', {
          userId,
          is_active: newStatus,
          timestamp: Date.now(),
        });
        console.log('✅ [Pusher Server] Evento "user-status-changed" emitido exitosamente');
      } else {
        console.warn('⚠️ [Pusher Server] Omitido: Faltan credenciales de entorno en el servidor.');
      }
    } catch (pusherErr: any) {
      console.error('❌ [Pusher Error No Fatal]:', pusherErr.message || pusherErr);
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error crítico al actualizar el estado del usuario en Neon:", err.message);
    return { success: false, error: err.message };
  }
}