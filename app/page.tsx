import React from "react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";
import { Navbar } from "@/components/ui/Navbar";
import { HomeContent } from "@/components/ui/HomeContent";
import type { Metadata } from "next";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tu_clave_secreta_super_segura_para_jwt"
);

export const metadata: Metadata = {
  title: "Altok€! | Envíos de Dinero Rápidos y Seguros de España y EE.UU. a Perú",
  description: "Transfiere de Euros o Dólares a Soles al instante y con la tasa real. Cuentas locales BCP, Interbank y BBVA con cero comisiones ocultas.",
  keywords: ["enviar dinero a peru", "remesas españa peru", "tipo de cambio euros soles", "altoke"],
  metadataBase: new URL("https://altoke.com"),
  openGraph: {
    title: "Altok€! | Envíos de Dinero a Perú con la Tasa Real",
    description: "Plataforma financiera regulada para enviar remesas en minutos.",
    url: "https://altoke.com",
    siteName: "Altok€!",
    images: [{ url: "/logo.png", width: 800, height: 600, alt: "Altok€ Logo" }],
    locale: "es_PE",
    type: "website",
  },
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let sessionData = null;
  let profileName = "Cliente";

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const dbResponse: any = await query(
        "SELECT id, full_name, email, role FROM public.users WHERE id = $1 LIMIT 1",
        [payload.userId]
      );
      const rows = Array.isArray(dbResponse) ? dbResponse : dbResponse?.rows;
      if (rows && rows.length > 0) {
        sessionData = { user: rows[0] };
        profileName = rows[0].full_name || rows[0].email;
      }
    } catch (e) {
      console.error("Error al verificar sesión en Home:", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 scroll-smooth">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialService",
            "name": "Altok€!",
            "url": "https://altoke.com",
            "logo": "https://altoke.com/logo.png",
            "description": "Servicio de transferencias y remesas internacionales de España y EE.UU. a Perú.",
            "currenciesAccepted": "EUR, USD, PEN",
            "areaServed": ["ES", "US", "PE"],
          }),
        }}
      />

      <Navbar 
        session={sessionData} 
        profileName={profileName} 
        loadingAuth={false} 
      />

      <HomeContent initialSession={sessionData} initialProfileName={profileName} />

      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} ALTOK€!. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}