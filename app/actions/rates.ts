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
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value;

    let userEmail: string | null = null;

    // 1. Intentar obtener el CORREO ELECTRÓNICO desde el JWT
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userEmail = (payload.email as string) || null;
      } catch (jwtErr) {
        console.warn('⚠️ No se pudo decodificar el token para auditoría:', jwtErr);
      }
    }

    // 2. Si el JWT no contenía el email, buscar el correo por la cookie o el email de sesión
    if (!userEmail) {
      const storedEmail = cookieStore.get('user_email')?.value;
      if (storedEmail) {
        userEmail = storedEmail;
      } else {
        // Fallback: Si no hay cookie directa, consultar el correo del usuario en BD
        const userRes: any = await query('SELECT email FROM public.users WHERE role = $1 LIMIT 1', ['admin']);
        const foundUser = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];
        userEmail = foundUser?.email || 'danielgastelusotelo@gmail.com';
      }
    }

    // 3. Registrar la actualización e insertar el correo en changed_by
    for (const item of updates) {
      const oldRes: any = await query('SELECT value FROM public.site_config WHERE key = $1 LIMIT 1', [item.key]);
      const oldValue = Array.isArray(oldRes) ? oldRes[0]?.value : oldRes?.rows?.[0]?.value;
      const isUpdate = oldValue !== undefined && oldValue !== null;

      // Actualizar la tabla principal
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

      // 📝 REGISTRO DE AUDITORÍA: Guardar expresamente el Correo Electrónico
      await query(
        `INSERT INTO public.site_config_audit (config_key, old_value, new_value, changed_by, action_type, changed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          item.key,
          isUpdate ? oldValue : null,
          item.value,
          userEmail,
          isUpdate ? 'UPDATE' : 'INSERT'
        ]
      );
    }

    // 4. Invalidar caché en Next.js
    revalidatePath('/');
    revalidatePath('/api/rates');

    // 5. Emitir evento vía Pusher
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
    console.error('Error crítico al actualizar tasas en DB:', err);
    return { success: false, error: err.message };
  }
}