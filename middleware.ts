import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 1. Instanciación en Top-Level Scope para evitar re-codificar en cada petición
const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_SECRET = JWT_SECRET_STRING ? new TextEncoder().encode(JWT_SECRET_STRING) : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const isAdminPath = pathname.startsWith('/admin');
  const isClientPath = pathname.startsWith('/portal-cliente');
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 2. BLINDAJE CRÍTICO: Si el secreto no está cargado, rechazar el tráfico de inmediato
  if (!JWT_SECRET) {
    console.error('❌ CRITICAL_SECURITY_ALERT: JWT_SECRET ausente en el entorno.');
    return new NextResponse('Error de configuración del servidor.', { status: 500 });
  }

  // Helper local para inyectar Encabezados de Seguridad OWASP
  const applySecurityHeaders = (response: NextResponse) => {
    // 🟢 ÚNICO CAMBIO: Autorizamos explícitamente a Pusher (wss:// y https://) en el Content-Security-Policy
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss: ws: https://*.pusher.com wss://*.pusher.com;");
    
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
  };

  // 3. Redirección UX: Usuario con sesión activa intentando entrar a /login o /register
  if (token && isAuthPath) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userRole = (payload.role as string) || 'client';
      const destination = userRole === 'admin' ? '/admin' : '/portal-cliente';
      return applySecurityHeaders(NextResponse.redirect(new URL(destination, request.url)));
    } catch {
      // Token corrupto: se destruye la cookie y se permite ver la pantalla de login
      const response = NextResponse.next();
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return applySecurityHeaders(response);
    }
  }

  // 4. Continuación inmediata para rutas públicas
  if (!isAdminPath && !isClientPath) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 5. Bloqueo sin Token en Rutas Protegidas
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // 6. Validación de Firma y Roles RBAC
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = (payload.role as string) || 'client';

    // Restricción de acceso para clientes intentando ingresar a /admin
    if (isAdminPath && userRole !== 'admin') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/portal-cliente', request.url)));
    }

    return applySecurityHeaders(NextResponse.next());

  } catch (error) {
    // Expiración o manipulación: purga completa de sesión
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('alert', 'sesion_expirada');

    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('user_email', '', { maxAge: 0, path: '/' });

    return applySecurityHeaders(response);
  }
}

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