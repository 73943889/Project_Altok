'use server';

import { query } from '@/lib/db';
import { unstable_noStore as noStore } from 'next/cache';

export async function getTreasuryOperationsAction() {
  noStore();
  try {
    const res = await query(`
      SELECT 
        t.*,
        u.full_name as user_full_name,
        u.email as user_email
      FROM public.transactions t
      LEFT JOIN public.users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    const rows = Array.isArray(res) ? res : res?.rows || [];
    
    // 🔍 Auditoría en consola de tu terminal para verificar los datos crudos de Neon
    console.log("📊 [TESORERIA DEBUG] Filas crudas obtenidas de la BD:", JSON.stringify(rows, null, 2));

    const formattedData = rows.map((tx: any) => ({
      ...tx,
      full_name: tx.user_full_name || tx.full_name || "Remitente no registrado",
      email: tx.user_email || tx.email || "Sin correo",
      send_amount: Number(tx.send_amount || tx.monto_envio || 0),
      receive_amount: Number(tx.receive_amount || tx.monto_recibe || 0),
      send_currency: (tx.send_currency || tx.moneda_envio || "EUR").toUpperCase(),
      receive_currency: (tx.receive_currency || tx.moneda_recibe || "PEN").toUpperCase(),
      status: (tx.status || tx.estado || "PENDIENTE").toUpperCase().trim(),
    }));

    return { success: true, operations: formattedData };
  } catch (err: any) {
    console.error("❌ Error en getTreasuryOperationsAction:", err);
    return { success: false, error: err.message, operations: [] };
  }
}