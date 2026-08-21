import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { RegisterRequestSchema } from '@/lib/validations/api-contracts';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tu_clave_secreta_super_segura_para_jwt"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar contrato de entrada con Zod
    const validation = RegisterRequestSchema.safeParse(body);

    if (!validation.success) {
      console.log("Errores de validación:", validation.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de registro inválidos.',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, phone, timezone } = validation.data;

    // 2. Verificar si el usuario ya existe
    const existingUsers: any = await query(
      'SELECT id FROM public.users WHERE email = $1 OR (phone IS NOT NULL AND phone = $2) LIMIT 1',
      [email, phone || null]
    );
    const rows = Array.isArray(existingUsers) ? existingUsers : existingUsers?.rows;

    if (rows && rows.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ya existe un usuario registrado con este mismo correo o número de teléfono.' 
        },
        { status: 400 }
      );
    }

    // 3. Encriptar contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insertar usuario
    const insertRes: any = await query(
      `INSERT INTO public.users (full_name, email, password_hash, phone, role, timezone, created_at)
       VALUES ($1, $2, $3, $4, 'client', $5, NOW())
       RETURNING id, email, full_name, role`,
      [fullName, email, passwordHash, phone, timezone]
    );
    const newUser = Array.isArray(insertRes) ? insertRes[0] : insertRes?.rows?.[0];

    if (!newUser) {
      throw new Error("No se pudo retornar el usuario creado.");
    }

    // 5. Generar Token JWT (Incluye 'sub' para compatibilidad estándar con el Middleware)
    const token = await new SignJWT({ userId: newUser.id, role: newUser.role, email: newUser.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(newUser.id))
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // 6. Configurar Cookie HttpOnly
    const response = NextResponse.json({
      success: true,
      message: 'Cuenta creada con éxito y sesión iniciada',
      user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name },
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (err: any) {
    console.error('❌ Error crítico en registro:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Ocurrió un error interno en el servidor.' },
      { status: 500 }
    );
  }
}