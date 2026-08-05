'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { unstable_noStore as noStore } from 'next/cache';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_para_jwt'
);

export async function getPortalData() {
  noStore();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { success: false, error: 'No autorizado' };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    // 1. Obtener datos del usuario desde Neon
    const userRes: any = await query(
      'SELECT id, full_name, email, phone, role FROM public.users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const users = Array.isArray(userRes) ? userRes : userRes?.rows;
    
    if (!users || users.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const currentUser = users[0];

    // 2. Obtener transacciones del usuario (Incluye automáticamente internal_notes para el historial del cliente)
    const txRes: any = await query(
      'SELECT * FROM public.transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const transactions = Array.isArray(txRes) ? txRes : txRes?.rows || [];

    // 3. Obtener configuración del sitio / tasas
    const configRes: any = await query('SELECT * FROM public.site_config');
    const siteConfig = Array.isArray(configRes) ? configRes : configRes?.rows || [];

    return {
      success: true,
      user: currentUser,
      transactions,
      siteConfig,
    };
  } catch (err: any) {
    console.error('Error al obtener datos del portal:', err);
    return { success: false, error: 'Sesión inválida o expirada' };
  }
}