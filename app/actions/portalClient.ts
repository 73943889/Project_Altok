'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { jwtVerify } from 'jose';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache'; // 👈 Importamos revalidatePath aquí

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
export async function getPortalData() {
  noStore();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { success: false, error: 'No autorizado' };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload as any).userId || (payload as any).id;
    const sessionToken = (payload as any).sessionToken; // 👈 1. Extraemos el token dinámico de la cookie

    // 2. Obtener datos del usuario Y el token de sesión activo en Neon mediante JOIN
    const userRes: any = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, s.refresh_token 
       FROM public.users u
       LEFT JOIN public.sessions s ON u.id = s.user_id
       WHERE u.id = $1 LIMIT 1`,
      [userId]
    );
    const users = Array.isArray(userRes) ? userRes : userRes?.rows;
    
    if (!users || users.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const currentUser = users[0];

    // 🛡️ 3. Validación estricta de cuenta inhabilitada
    const isActive = currentUser.is_active === true || currentUser.is_active === 't' || currentUser.is_active === 1;
    if (!isActive) {
      cookieStore.set({
        name: 'auth_token',
        value: '',
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return { success: false, error: 'cuenta_inhabilitada' };
    }

    // 🔒 4. VALIDACIÓN DE SESIÓN ÚNICA EN TIEMPO REAL (DISPOSITIVO CONCURRENTE)
    // Si la cookie trae un sessionToken y este NO coincide con el refresh_token activo en BD,
    // significa que el usuario inició sesión en un teléfono u otro navegador.
    if (sessionToken && currentUser.refresh_token !== sessionToken) {
      // Destruimos la cookie del dispositivo antiguo
      cookieStore.set({
        name: 'auth_token',
        value: '',
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return { success: false, error: 'sesion_expulsada' };
    }

    // 5. Obtener transacciones del usuario
    const txRes: any = await query(
      'SELECT * FROM public.transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const transactions = Array.isArray(txRes) ? txRes : txRes?.rows || [];

    // 6. Obtener configuración del sitio / tasas
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

export async function updateUserProfileAction(fullName: string, phone: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { success: false, error: 'No autorizado' };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    // 🛡️ Ejecutamos el UPDATE seguro en la tabla public.users de Neon
    const updateQuery = `
      UPDATE public.users 
      SET full_name = $1, phone = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING id, full_name, email, phone, role;
    `;

    const res: any = await query(updateQuery, [fullName.trim(), phone.trim(), userId]);
    const updatedUser = Array.isArray(res) ? res[0] : res?.rows?.[0];

    if (!updatedUser) {
      throw new Error('No se pudo actualizar el usuario en la base de datos.');
    }

    revalidatePath('/portal-cliente');
    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error('❌ Error al actualizar el perfil del usuario:', err.message);
    return { success: false, error: err.message };
  }
}

export async function updateUserProfileAndPasswordAction(
  fullName: string, 
  phone: string, 
  currentPassword?: string, 
  newPassword?: string
) {
  noStore();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { success: false, error: 'No autorizado' };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    // 1. Si el usuario desea cambiar la contraseña, validamos las reglas de negocio
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return { success: false, error: 'Debes ingresar tu contraseña actual para realizar el cambio.' };
      }

      // Regla 1: Mínimo 8 caracteres
      if (newPassword.length < 8) {
        return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
      }

      // Regla 2: No permitir solo caracteres especiales (debe contener letras o números)
      const hasAlphanumeric = /[a-zA-Z0-9]/.test(newPassword);
      if (!hasAlphanumeric) {
        return { success: false, error: 'La contraseña no puede estar compuesta únicamente por caracteres especiales.' };
      }

      // Obtenemos el hash actual de la base de datos Neon PostgreSQL
      const userRes: any = await query(
        'SELECT password_hash FROM public.users WHERE id = $1 LIMIT 1',
        [userId]
      );
      const dbUser = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];

      if (!dbUser || !dbUser.password_hash) {
        return { success: false, error: 'Error al verificar credenciales del usuario.' };
      }

      // Validar contraseña actual
      const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.password_hash);
      if (!isPasswordValid) {
        return { success: false, error: 'La contraseña actual es incorrecta.' };
      }

      // Hashear la nueva contraseña con bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const updateQueryWithPass = `
        UPDATE public.users 
        SET full_name = $1, phone = $2, password_hash = $3, updated_at = NOW() 
        WHERE id = $4 
        RETURNING id, full_name, email, phone, role;
      `;
      const resPass = await query(updateQueryWithPass, [fullName.trim(), phone.trim(), hashedPassword, userId]);
      const updatedUserPass = Array.isArray(resPass) ? resPass[0] : resPass?.rows?.[0];

      revalidatePath('/portal-cliente');
      return { success: true, user: updatedUserPass };
    }
    // 2. Actualización estándar sin cambiar contraseña
    const updateQuery = `
      UPDATE public.users 
      SET full_name = $1, phone = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING id, full_name, email, phone, role;
    `;
    const res = await query(updateQuery, [fullName.trim(), phone.trim(), userId]);
    const updatedUser = Array.isArray(res) ? res[0] : res?.rows?.[0];

    if (!updatedUser) {
      throw new Error('No se pudo actualizar el usuario en la base de datos.');
    }

    revalidatePath('/portal-cliente');
    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error('❌ Error al actualizar el perfil y credenciales:', err.message);
    return { success: false, error: err.message };
  }
}