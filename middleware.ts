import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_para_jwt'
);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const token = request.cookies.get('auth_token')?.value;

  let isAuthenticated = false;
  let userRole = 'client';

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
      userRole = (payload.role as string) || 'client';
    } catch (error) {
      isAuthenticated = false;
    }
  }

  const redirectToLogin = () => {
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  };

  // 1. Protección estricta para /admin
  if (url.pathname.startsWith('/admin')) {
    if (!isAuthenticated || userRole !== 'admin') {
      return redirectToLogin();
    }
  }

  // 2. Protección estricta para portales de clientes
  if (url.pathname.startsWith('/portal-cliente')) {
    if (!isAuthenticated) {
      return redirectToLogin();
    }
  }

  // 3. Inyección de Headers de Seguridad Enterprise en todas las respuestas válidas
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );

  return response;
}

// Configuración del Matcher optimizada para excluir explícitamente páginas públicas y recursos estáticos
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud, EXCEPTO:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap.xml, robots.txt (archivos raíz)
     * - login, register, y la página principal (/) para evitar bloqueos innecesarios en vistas públicas
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|register|$).*)',
  ],
};