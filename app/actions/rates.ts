'use server';

import { query } from '@/lib/db';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
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
    // 1. Capa de Persistencia con Tipado Explícito en SQL (Cast ::numeric y ::text)
    for (const item of updates) {
      await query(
        `INSERT INTO public.site_config (key, value, updated_at) 
         VALUES ($1::text, $2::numeric, NOW()) 
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [item.key, item.value]
      );

      if (item.key === 'transfer_commission_bank') {
        await query(
          `INSERT INTO public.site_config (key, value, updated_at) 
           VALUES ($1::text, $2::numeric, NOW()) 
           ON CONFLICT (key) 
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          ['transfer_commission', item.value]
        );
      }
    }

    // 2. Invalidación de la Caché CDN en Vercel
    revalidatePath('/');
    revalidatePath('/api/rates');

    // 3. Capa de Tiempo Real (Pusher) aislada con Tolerancia a Fallos
    try {
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
        console.log('✅ [Pusher Server] Evento "rates-updated" emitido exitosamente');
      }
    } catch (pusherErr: any) {
      console.error('❌ [Pusher Error No Fatal]:', pusherErr.message || pusherErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error crítico al actualizar tasas y comisiones en DB:', err);
    return { success: false, error: err.message };
  }
}