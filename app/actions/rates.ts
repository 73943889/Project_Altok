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
    // 🛡️ 1. Intentar obtener el token de autenticación (comprobando cookies auth_token o token)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value;

    let userId: string | null = null;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = ((payload as any).userId || (payload as any).id) as string;
      } catch (jwtErr) {
        console.warn('⚠️ No se pudo decodificar el token para la auditoría:', jwtErr);
      }
    }

    // 🛡️ Backup: Si el JWT no traía el ID, buscamos por el email guardado en cookie o usador por defecto
    if (!userId) {
      const userEmail = cookieStore.get('user_email')?.value || 'danielgastelusotelo@gmail.com';
      const userRes: any = await query('SELECT id FROM public.users WHERE email = $1 LIMIT 1', [userEmail]);
      const foundUser = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];
      if (foundUser?.id) {
        userId = foundUser.id;
      }
    }

    // 2. Procesar cada tasa/comisión y registrar en auditoría
    for (const item of updates) {
      // A. Obtener el valor antiguo antes de actualizar
      const oldRes: any = await query('SELECT value FROM public.site_config WHERE key = $1 LIMIT 1', [item.key]);
      const oldValue = Array.isArray(oldRes) ? oldRes[0]?.value : oldRes?.rows?.[0]?.value;

      // B. Actualizar o Insertar en site_config
      await query(
        `INSERT INTO public.site_config (key, value, updated_at) 
         VALUES ($1::text, $2::numeric, NOW()) 
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [item.key, item.value]
      );

      // C. Regla para comisión bancaria
      if (item.key === 'transfer_commission_bank') {
        await query(
          `INSERT INTO public.site_config (key, value, updated_at) 
           VALUES ($1::text, $2::numeric, NOW()) 
           ON CONFLICT (key) 
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          ['transfer_commission', item.value]
        );
      }

      // 📝 D. REGISTRO EN AUDITORÍA CON EL CHANGED_BY POBLADO
      if (userId) {
        await query(
          `INSERT INTO public.site_config_audit (config_key, old_value, new_value, changed_by, action_type, changed_at)
           VALUES ($1, $2, $3, $4::uuid, $5, NOW())`,
          [
            item.key,
            oldValue !== undefined ? oldValue : null,
            item.value,
            userId,
            oldValue !== undefined ? 'UPDATE' : 'INSERT'
          ]
        );
      }
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