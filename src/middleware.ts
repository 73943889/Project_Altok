import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificación básica de la ruta /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Si deseas implementar Login con Supabase Auth más adelante,
    // aquí validas las cookies 'sb-access-token'
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};