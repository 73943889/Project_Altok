/*import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 1. Protección Anti-Clickjacking estricta
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // 2. Prevención de Mime-Type Sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // 3. Política de Referrer segura
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 4. Permisos de APIs del navegador (Permissions Policy)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // 5. CSP Reforzada para mitigar las alertas de ZAP manteniendo compatibilidad con Next.js
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline';", // Requerido por Next.js App Router
              "style-src 'self' 'unsafe-inline';", // Requerido para estilos inyectados de Tailwind / Componentes
              "img-src 'self' data: https: blob:;",
              "font-src 'self' data:;",
              "connect-src 'self' https:;",
              "frame-ancestors 'none';",
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;*/
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Deshabilitar la cabecera X-Powered-By: Next.js por seguridad
  poweredByHeader: false,
  reactStrictMode: true,

  // Remover console.log/info en producción (mantiene warn y error)
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  // Configuración de optimización de imágenes para dominios externos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 1. Imprescindible para Producción: Fuerza HTTPS estricto (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // 2. Protección Anti-Clickjacking estricta
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // 3. Prevención de Mime-Type Sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // 4. Política de Referrer segura
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 5. Permisos de APIs del navegador (Permissions Policy)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // 6. CSP Reforzada y Blindada
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline';", // Requerido por Next.js App Router
              "style-src 'self' 'unsafe-inline';", // Requerido para Tailwind y componentes
              "img-src 'self' data: https: blob:;",
              "font-src 'self' data:;",
              "connect-src 'self' https:;",
              "object-src 'none';", // Bloquea plugins vulnerables
              "base-uri 'self';", // Previene inyección de <base>
              "form-action 'self';", // Restringe el destino de formularios
              "frame-ancestors 'none';",
              "upgrade-insecure-requests;", // Fuerza HTTPS en todos los recursos
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;