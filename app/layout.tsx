import type { Metadata } from "next";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import "./globals.css";

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const metadata: Metadata = {
  title: "Altok€ | Envíos de Dinero y Remesas Perú - España - Estados Unidos",
  description: "Envía dinero de España a Perú con la mejor tasa de cambio del mercado, sin comisiones ocultas y transferencias directas a BCP, BBVA, Interbank y Yape/Plin.",
  keywords: ["remesas peru", "enviar dinero a peru", "tasa de cambio euro sol", "Altok€", "transferencias peru"],
  authors: [{ name: "Altok€" }],
  openGraph: {
    title: "Altok€ - Transferencias de Dinero Rápidas y Seguras",
    description: "Calcula tu envío en tiempo real y recibe tus soles en minutos.",
    url: "https://valoratransfer.com",
    siteName: "Altok€",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Altok€ | Envíos de Dinero",
    description: "Tu dinero seguro en Perú con las mejores tasas de cambio.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🛡️ CAPA DE SEGURIDAD GLOBAL: Validación en tiempo real de cuentas inhabilitadas
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userEmail = payload.email as string;

      if (userEmail) {
        // Consulta ultrarrápida a Neon PostgreSQL para verificar el estado is_active actual
        const res: any = await query(
          "SELECT is_active FROM public.users WHERE email = $1 LIMIT 1",
          [userEmail]
        );
        const rows = Array.isArray(res) ? res : res?.rows;

        if (rows && rows.length > 0) {
          const isActive = rows[0].is_active === true || rows[0].is_active === 't' || rows[0].is_active === 1;

          // Si el administrador inhabilitó la cuenta, destruimos cookies y expulsamos al login
          if (!isActive) {
            cookieStore.set({ name: "auth_token", value: "", maxAge: 0, path: "/" });
            cookieStore.set({ name: "user_email", value: "", maxAge: 0, path: "/" });
            redirect("/login?error=cuenta_inhabilitada");
          }
        }
      }
    } catch (err) {
      // Si el token es inválido o expiró, dejamos que el flujo normal actúe
    }
  }

  // Schema.org para Rich Snippets en Google (Intacto y optimizado)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "Altok€",
    "url": "https://valoratransfer.com",
    "logo": "https://valoratransfer.com/logo.png",
    "description": "Servicios de transferencia de dinero y remesas internacionales entre Europa y Perú.",
    "currenciesAccepted": "EUR, PEN",
    "paymentAccepted": "Bank Transfer, Credit Card",
    "priceRange": "$",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PE",
      "addressLocality": "Lima"
    }
  };

  return (
    /* 
      💡 suppressHydrationWarning previene errores de consola cuando extensiones 
      del navegador o atributos de tema alteran la etiqueta html en la carga inicial.
    */
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}