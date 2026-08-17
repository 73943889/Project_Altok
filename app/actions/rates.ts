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

    // 2. Definir la variable de sesión en PostgreSQL para que el Trigger la lea
    if (userId) {
      await query(`SET LOCAL app.current_user_id = $1;`, [userId]);
    }

    // 3. Persistencia con Auditoría Integrada en site_config
    for (const item of updates) {
      // Obtenemos el valor antiguo para auditoría manual si no usas Trigger
      const oldRes: any = await query('SELECT value FROM public.site_config WHERE key = $1 LIMIT 1', [item.key]);
      const oldValue = Array.isArray(oldRes) ? oldRes[0]?.value : oldRes?.rows?.[0]?.value;

      // Actualizamos o insertamos la tasa
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

      // 4. Inserción explícita en site_config_audit para asegurar changed_by (Si no usas Trigger automático)
      await query(
        `INSERT INTO public.site_config_audit (config_key, old_value, new_value, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [item.key, oldValue || null, item.value, userId]
      );
    }

    // 5. Invalidación de Caché
    revalidatePath('/');
    revalidatePath('/api/rates');

    // 6. Notificación en Tiempo Real vía Pusher
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