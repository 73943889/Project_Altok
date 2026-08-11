// app/actions/rates.ts
'use server';

import { query } from '@/lib/db';
import { unstable_noStore as noStore } from 'next/cache';
import { notifyClientsRateChanged } from '@/app/api/rates/stream/route';

export async function getRatesAction() {
  noStore();
  try {
    const res = await query('SELECT key, value FROM public.site_config');
    const rows = Array.isArray(res) ? res : res?.rows || [];
    return { success: true, config: rows };
  } catch (err: any) {
    console.error('Error al obtener tasas:', err);
    return { success: false, error: err.message };
  }
}

export async function updateRatesAction(updates: { key: string; value: number }[]) {
  noStore();
  try {
    for (const item of updates) {
      await query(
        `INSERT INTO public.site_config (key, value, updated_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = NOW()`,
        [item.key, item.value]
      );

      if (item.key === 'transfer_commission_bank') {
        await query(
          `INSERT INTO public.site_config (key, value, updated_at) 
           VALUES ('transfer_commission', $2, NOW()) 
           ON CONFLICT (key) 
           DO UPDATE SET value = $2, updated_at = NOW()`,
          ['transfer_commission', item.value]
        );
      }
    }

    // 🔄 Notificamos al stream en tiempo real de forma inmediata y limpia
    notifyClientsRateChanged();

    return { success: true };
  } catch (err: any) {
    console.error('Error al actualizar tasas y comisiones:', err);
    return { success: false, error: err.message };
  }
}