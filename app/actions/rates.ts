'use server';

import { query } from '@/lib/db';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { notifyClientsRateChanged } from '@/app/api/rates/stream/route';
import Pusher from 'pusher';

const cleanEnv = (val?: string) => {
  if (!val) return '';
  return val.replace(/^[^=]+=\s*/, '').replace(/^["']|["']$/g, '').trim();
};

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

    // 1. Invalidación de caché en Vercel CDN
    revalidatePath('/');
    revalidatePath('/api/rates');

    // 2. Transmisión local por SSE
    try {
      notifyClientsRateChanged();
    } catch (e) {
      // Ignorar fallback en serverless
    }

    // 3. Obtención e instanciación en tiempo de ejecución (Runtime)
    const appId = cleanEnv(process.env.PUSHER_APP_ID);
    const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY);
    const secret = cleanEnv(process.env.PUSHER_SECRET);
    const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER) || 'mt1';

    if (appId && key && secret) {
      const pusher = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });

      await pusher.trigger('rates-channel', 'rates-updated', {
        updates,
        timestamp: Date.now(),
      });
      console.log('✅ [Pusher Server] Evento "rates-updated" transmitido con éxito');
    } else {
      console.error('❌ [Pusher Server] Faltan variables de entorno para emitir el WebSocket:', {
        hasAppId: !!appId,
        hasKey: !!key,
        hasSecret: !!secret,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error al actualizar tasas y comisiones:', err);
    return { success: false, error: err.message };
  }
}