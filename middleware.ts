import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 1. Inicializar el cliente de Supabase para el entorno Edge (Middleware)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Refrescar la sesión de Supabase Auth si es necesario (Vital para Server Components)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 3. 🛡️ Protección Estricta de la Ruta /admin
  if (url.pathname.startsWith('/admin')) {
    // Si no hay usuario autenticado o hay error de sesión, redirigir al login
    if (userError || !user) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Consultar el rol del usuario en la tabla profiles de la base de datos
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Si no existe perfil, hay error de base de datos o el rol NO es admin, prohibir el acceso
    if (profileError || !profile || profile.role !== 'admin') {
      url.pathname = '/portal-cliente'; // Redirección segura a la zona de clientes
      return NextResponse.redirect(url);
    }
  }

  // 4. 🛡️ Protección opcional para portales de clientes autenticados
  if (url.pathname.startsWith('/portal-cliente') && (userError || !user)) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 5. Inyección de Headers de Seguridad Enterprise (del middleware anterior)
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );

  return supabaseResponse;
}

// Configuración del Matcher optimizada para ignorar archivos estáticos y APIs públicas
export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas de solicitud excepto:
     * - api (rutas de API backend)
     * - _next/static (archivos estáticos)
     * - _next/image (archivos optimizados de imágenes)
     * - favicon.ico, sitemap.xml, robots.txt (archivos raíz públicos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};