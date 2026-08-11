import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Carga estricta de la clave secreta desde las variables de entorno
const JWT_SECRET_STRING = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const isAdminPath = pathname.startsWith('/admin');
  const isClientPath = pathname.startsWith('/portal-cliente');
  const isAuthPath = pathname === '/login' || pathname === '/register';

  // 1. Blindaje de Seguridad: Previene el arranque si falta JWT_SECRET en Producción
  if (!JWT_SECRET_STRING) {
    console.error('❌ CRITICAL_SECURITY_ALERT: La variable JWT_SECRET no está definida en el entorno.');
    return NextResponse.next();
  }

  const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

  // 2. Redirección Inteligente (UX): Si ya está autenticado, no permitir acceso a /login o /register
  if (token && isAuthPath) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userRole = (payload.role as string) || 'client';
      const destination = userRole === 'admin' ? '/admin' : '/portal-cliente';
      return NextResponse.redirect(new URL(destination, request.url));
    } catch {
      // Si el token es inválido o expiró, limpiamos la cookie corrupta y permitimos ver el login
      const response = NextResponse.next();
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  // 3. Rutas Públicas: Si no es una ruta protegida, continuar la ejecución de inmediato
  if (!isAdminPath && !isClientPath) {
    return NextResponse.next();
  }

  // 4. Verificación de Existencia de Token en Rutas Protegidas
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Control de Acceso Basado en Roles (RBAC Estricto)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = (payload.role as string) || 'client';

    // Regla de Bloqueo: Si un rol CLIENTE intenta ingresar a /admin
    if (isAdminPath && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/portal-cliente', request.url));
    }

    // Permitir el paso si cumple con el rol asignado
    return NextResponse.next();

  } catch (error) {
    // Si el JWT expira, es manipulado o inválido: destrucción de cookies en el Edge y rechazo 401/307
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('alert', 'sesion_expirada');

    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('user_email', '', { maxAge: 0, path: '/' });

    return response;
  }
}

// Configuración de captura completa de rutas (Raíz y Subrutas)
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/portal-cliente',
    '/portal-cliente/:path*',
    '/login',
    '/register',
  ],
};