'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import Pusher from 'pusher';

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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
    // 🛡️ 1. Extraer el userId del Administrador desde la cookie cifrada JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    let userId: string | null = null;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = ((payload as any).userId || (payload as any).id) as string;
      } catch (jwtErr) {
        console.warn('⚠️ No se pudo extraer el userId del token para la auditoría:', jwtErr);
      }
    }

    if (!userId) {
      return { success: false, error: 'Usuario no autenticado para realizar esta acción.' };
    }

    // 🔒 2. Iniciar Transacción Atómica en Neon PostgreSQL
    await query('BEGIN;');

    try {
      // Definimos la variable de sesión dentro de LA MISMA transacción
      await query(`SELECT set_config('app.current_user_id', $1, true);`, [userId]);

      for (const item of updates) {
        // Actualizamos o insertamos la tasa (El Trigger automático registrará changed_by correctamente)
        await query(
          `INSERT INTO public.site_config (key, value, updated_at) 
           VALUES ($1::text, $2::numeric, NOW()) 
           ON CONFLICT (key) 
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [item.key, item.value]
        );

        // Regla de respaldo para transferencia bancaria
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

      // Confirmamos la transacción
      await query('COMMIT;');
    } catch (dbErr) {
      // Si algo falla, revertimos los cambios
      await query('ROLLBACK;');
      throw dbErr;
    }

    // 3. Invalidación de Caché CDN
    revalidatePath('/');
    revalidatePath('/api/rates');

    // 4. Notificación en Tiempo Real vía Pusher
    try {
      const appId = cleanEnv(process.env.PUSHER_APP_ID);
      const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY);
      const secret = cleanEnv(process.env.PUSHER_SECRET);
      const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER) || 'mt1';

      if (appId && key && secret) {
        const pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
        await pusher.trigger('rates-channel', 'rates-updated', { updates, timestamp: Date.now() });
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