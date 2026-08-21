'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcrypt'; // 👈 Usamos bcrypt nativo (C++)
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { LoginRequestSchema } from '@/lib/validations/api-contracts';
if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// 1. Guardar o actualizar sesión única (1:1) en Neon
export async function saveUserSession(userId: string) {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const refreshToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 horas

  await query(
    `INSERT INTO public.sessions (user_id, refresh_token, expires_at, last_activity)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET 
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         last_activity = NOW();`,
    [userId, refreshToken, expiresAt]
  );

  return refreshToken;
}

// Tipado estricto para reemplazar 'any' sin alterar los tipos permitidos
export type LoginActionInput = FormData | { email?: string; password?: string };

// 2. Acción de Inicio de Sesión
export async function loginAction(input: LoginActionInput) {
  try {
    let rawEmail: string = '';
    let rawPassword: string = '';

    // 1. Mantener extracción dual para soporte de FormData u Objeto JSON
    if (input instanceof FormData) {
      rawEmail = String(input.get('email') || '').trim();
      rawPassword = String(input.get('password') || '');
    } else if (input && typeof input === 'object') {
      rawEmail = String(input.email || '').trim();
      rawPassword = String(input.password || '');
    }

    // 🛡️ 2. Validar contrato de entrada con Zod (Zero-Trust)
    const validation = LoginRequestSchema.safeParse({
      email: rawEmail,
      password: rawPassword,
    });

    if (!validation.success) {
      return { 
        success: false, 
        error: 'Por favor completa todos los campos con un formato válido.' 
      };
    }

    const { email, password } = validation.data;

    // 3. Consulta a Neon PostgreSQL
    const dbResponse: any = await query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM public.users WHERE email = $1 LIMIT 1',
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

    // 4. Verificación segura delegada al módulo nativo C++ de bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return { success: false, error: 'Credenciales inválidas. Contraseña incorrecta.' };
    }

    // 5. Verificación de estado de cuenta
    const isActive = user.is_active === true || user.is_active === 't' || user.is_active === 1;
    if (!isActive) {
      return { 
        success: false, 
        error: 'Cuenta inhabilitada, comunicarse con el administrador.' 
      };
    }

    const userRole = (user.role || 'client').toLowerCase().trim();

    // 6. Guardar la sesión única (1:1) en la base de datos
    const refreshToken = await saveUserSession(user.id);

    // 7. Firma de JWT con soporte unificado de claims (id, userId, sub y sessionToken)
    const token = await new SignJWT({ 
      id: user.id,
      userId: user.id, 
      email: user.email, 
      role: userRole,
      isActive: isActive,
      sessionToken: refreshToken // Mantiene la clave única dentro del JWT
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // 8. Configuración de Cookies HttpOnly
    const cookieStore = await cookies();
    
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    cookieStore.set({
      name: 'user_email',
      value: user.email,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    const redirectTo = userRole === 'admin' ? '/admin' : '/portal-cliente';

    return { 
      success: true, 
      message: 'Inicio de sesión exitoso', 
      redirectTo,
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

// 3. Acción de Cierre de Sesión
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = (payload as any).userId || (payload as any).id;

        if (userId) {
          await query('DELETE FROM public.sessions WHERE user_id = $1', [userId]);
        }
      } catch (jwtError) {
        console.warn('Aviso en logout: No se pudo verificar el token para limpieza en BD:', jwtError);
      }
    }
    
    cookieStore.set({ name: 'auth_token', value: '', path: '/', expires: new Date(0), httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    cookieStore.set({ name: 'user_email', value: '', path: '/', expires: new Date(0), httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

  } catch (error) {
    console.error('Error crítico al cerrar sesión:', error);
  }

  redirect('/login');
}

// 4. Solicitar Recuperación de Contraseña
export async function requestPasswordResetAction(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    const userRes: any = await query(
      'SELECT id, email, full_name FROM public.users WHERE email = $1 LIMIT 1',
      [cleanEmail]
    );
    const user = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];

    if (!user) {
      return { success: true, message: 'Si el correo está registrado, recibirás las instrucciones en tu bandeja.' };
    }

    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const resetToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await query(
      'UPDATE public.users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expiresAt, user.id]
    );

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    const userName = user.full_name || 'Estimado usuario';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <tr>
                    <td>
                      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: bold;">Solicitud de Recuperación de Contraseña</h2>
                      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hola <strong>${userName}</strong>,</p>
                      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Altok€!</strong>.</p>
                      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Haz clic en el siguiente botón para continuar (el enlace expira en 15 minutos):</p>
                      
                      <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetLink}" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Restablecer Contraseña</a>
                      </div>
                      
                      <p style="font-size: 13px; color: #64748b; line-height: 1.4;">Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
                      
                      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                      
                      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">© 2026 Altok€!. Todos los derechos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim();

    try {
      await resend.emails.send({
        from: 'Altok€! Soporte <onboarding@resend.dev>',
        to: [cleanEmail],
        subject: '🔒 Restablece tu contraseña - Altok€!',
        html: htmlContent,
      });
    } catch (emailErr) {
      console.error('Error al enviar correo con Resend:', emailErr);
      console.log(`🔗 [DEV FALLBACK] Enlace para ${cleanEmail}: ${resetLink}`);
    }

    return { 
      success: true, 
      message: 'Se han enviado las instrucciones a tu correo electrónico. Revisa tu bandeja de entrada.'
    };
  } catch (err: any) {
    console.error('Error en requestPasswordResetAction:', err);
    return { success: false, error: 'Ocurrió un error al procesar la solicitud.' };
  }
}

// 5. Restablecer contraseña con token
export async function resetPasswordAction(token: string, newPass: string) {
  try {
    if (!token || !newPass || newPass.length < 8) {
      return { success: false, error: 'Datos inválidos o contraseña muy corta.' };
    }

    const userRes: any = await query(
      'SELECT id FROM public.users WHERE reset_token = $1 AND reset_token_expires > NOW() LIMIT 1',
      [token]
    );
    const user = Array.isArray(userRes) ? userRes[0] : userRes?.rows?.[0];

    if (!user) {
      return { success: false, error: 'El enlace de recuperación es inválido o ha expirado.' };
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);

    // Actualizamos la contraseña y limpiamos el token de recuperación
    await query(
      'UPDATE public.users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    // 🔒 REGLA DE SESIÓN ÚNICA: Destruimos la sesión activa existente para forzar re-login
    await query('DELETE FROM public.sessions WHERE user_id = $1', [user.id]);

    return { success: true, message: 'Contraseña actualizada con éxito.' };
  } catch (err: any) {
    console.error('Error en resetPasswordAction:', err);
    return { success: false, error: 'Error al restablecer la contraseña.' };
  }
}