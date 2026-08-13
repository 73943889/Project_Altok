'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { unstable_noStore as noStore } from "next/cache";
import Pusher from 'pusher';

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET!);

const cleanEnv = (val?: string) => {
  if (!val) return '';
  return val.replace(/^[^=]+=\s*/, '').replace(/^["']|["']$/g, '').trim();
};

export async function getAdminOperations() {
  noStore();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return { success: false, error: 'No autorizado' };

    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    
    const userRes: any = await query(
      'SELECT role FROM public.users WHERE id = $1 LIMIT 1',
      [payload.userId]
    );
    const user = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];

    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Acceso denegado' };
    }

    const txRes: any = await query(`
      SELECT 
        t.*, 
        c.full_name, c.email, c.document_type, c.document_number, c.phone 
      FROM public.transactions t
      LEFT JOIN public.clients c ON t.client_id = c.id
      ORDER BY t.created_at DESC
    `);

    const transactions = Array.isArray(txRes) ? txRes : txRes?.rows || [];

    return { success: true, transactions };
  } catch (err: any) {
    console.error('Error en getAdminOperations:', err);
    return { success: false, error: err.message };
  }
}

export async function updateTransactionStatusAction(
  transactionId: string, 
  newStatus: string, 
  internalNotes?: string | null
) {
  noStore(); 
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    let adminEmail = "Administrador Sistema";

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
        const userRes: any = await query(
          "SELECT email FROM public.users WHERE id = $1 LIMIT 1",
          [payload.userId]
        );
        const user = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];
        if (user?.email) {
          adminEmail = user.email;
        }
      } catch (err) {
        console.error("Error verificando sesión para auditoría:", err);
      }
    }

    let finalNotes = internalNotes;
    if (newStatus === "COMPLETADO") {
      finalNotes = "Transacción exitosa";
    } else if (newStatus === "RECHAZADO") {
      if (!finalNotes || finalNotes.trim() === "") {
        return { success: false, error: "El motivo del rechazo es obligatorio." };
      }
      finalNotes = `${finalNotes.trim()}`;
    }

   const res = await query(
      `UPDATE public.transactions 
       SET status = $1, processed_by = $2, internal_notes = COALESCE($3, internal_notes), updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [newStatus, adminEmail, finalNotes, transactionId]
    );

    const updatedTx = Array.isArray(res) ? res[0] : res?.rows?.[0];

    if (!updatedTx) {
      throw new Error("No se encontró la transacción a actualizar.");
    }

    // ⚡ Emisión en tiempo real mediante Pusher con Telemetría Estricta
    try {
      const appId = cleanEnv(process.env.PUSHER_APP_ID);
      const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY);
      const secret = cleanEnv(process.env.PUSHER_SECRET);
      const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER) || 'mt1';

      console.log("🔍 [Pusher Debug Backend] Credenciales leídas:", {
        appId: appId ? `CONFIGURADO (${appId})` : "VACÍO ❌",
        key: key ? "CONFIGURADO ✅" : "VACÍO ❌",
        secret: secret ? "CONFIGURADO ✅" : "VACÍO ❌",
        cluster
      });

      if (appId && key && secret) {
        const pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });

        await pusher.trigger('operations-channel', 'transaction-updated', {
          transactionId,
          status: newStatus,
          timestamp: Date.now(),
        });
        console.log('✅ [Pusher Server] Evento "transaction-updated" emitido exitosamente al canal operations-channel');
      } else {
        console.error('❌ [Pusher Server] Faltan credenciales de entorno obligatorias para Pusher.');
      }
    } catch (pusherErr: any) {
      console.error('❌ [Pusher Error Detallado]:', pusherErr.message || pusherErr);
    }

    return { success: true, transaction: updatedTx };
  } catch (err: any) {
    console.error("❌ Error en updateTransactionStatusAction:", err);
    return { success: false, error: err.message };
  }
}