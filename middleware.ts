// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_muy_seguro');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith('/admin');
  const isClientPath = pathname.startsWith('/portal-cliente');

  // Si no es una ruta protegida, continuar
  if (!isAdminPath && !isClientPath) {
    return NextResponse.next();
  }

  // Si no hay token, redirigir al login preservando la ruta de origen
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Verificar la firma y validez del JWT y extraer el payload
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Asumimos que el token almacena el rol bajo la propiedad 'role' (ej: 'admin' o 'client')
    const userRole = (payload.role as string) || 'client';

    // 2. Control de Acceso Estricto (RBAC - Role-Based Access Control)
    if (isAdminPath && userRole !== 'admin') {
      // Si un cliente intenta entrar a /admin, se le deniega el acceso 
      // y se le redirige de forma segura a su portal correspondiente
      return NextResponse.redirect(new URL('/portal-cliente', request.url));
    }

    // Si es una ruta de cliente o el admin accede a una zona permitida, dejamos pasar
    return NextResponse.next();

  } catch (error) {
    // Si el token expiró o fue manipulado, destruimos la cookie corrupta y redirigimos
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal-cliente/:path*',
  ],
};