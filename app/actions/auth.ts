'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { redirect } from 'next/navigation';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_para_jwt'
);

export async function loginAction(input: any) {
  try {
    let email: string = '';
    let password: string = '';

    if (input instanceof FormData) {
      email = String(input.get('email') || '').trim();
      password = String(input.get('password') || '');
    } else if (input && typeof input === 'object') {
      email = String(input.email || '').trim();
      password = String(input.password || '');
    }

    if (!email || !password) {
      return { success: false, error: 'Por favor completa todos los campos.' };
    }

    const dbResponse: any = await query(
      'SELECT id, full_name, email, password_hash, role FROM public.users WHERE email = $1 LIMIT 1',
      [email]
    );

    const rows = Array.isArray(dbResponse) ? dbResponse : dbResponse?.rows;

    if (!rows || rows.length === 0) {
      return { success: false, error: 'Credenciales inválidas o usuario no registrado.' };
    }

    const user = rows[0];

    if (!user || !user.password_hash) {
      return { success: false, error: 'Error de configuración en la cuenta del usuario.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, error: 'Contraseña incorrecta.' };
    }

    const userRole = (user.role || 'client').toLowerCase().trim();

    // =========================================================================
    // CREAR UN JWT FIRMADO VÁLIDO PARA QUE EL MIDDLEWARE LO PUEDA LEER PERFECTAMENTE
    // =========================================================================
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email, 
      role: userRole 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Expira en 7 días
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token, // Guardamos el JWT firmado, no texto plano
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return { 
      success: true, 
      message: 'Inicio de sesión exitoso', 
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: userRole
      } 
    };

  } catch (error: any) {
    console.error('Error crítico en loginAction:', error);
    return { success: false, error: error.message || 'Error interno en el servidor.' };
  }
  
  
  
}
export async function logoutAction() {
  const cookieStore = await cookies();
  
  // Destruimos la cookie en el servidor asegurando todos los parámetros de seguridad
  cookieStore.set({
    name: 'auth_token',
    value: '',
    path: '/',
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  redirect('/login');
}

