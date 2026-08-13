import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// 🚀 Optimización de Fuente para Core Web Vitals (Zero CLS)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

// 🌐 Configuración del Viewport (Next.js 14/15 Standard)
export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// 🔍 SEO & Metaetiquetas de Nivel Empresarial
export const metadata: Metadata = {
  metadataBase: new URL("https://valoratransfer.com"),
  title: {
    default: "Altok€ | Envíos de Dinero y Remesas Perú - España - Estados Unidos",
    template: "%s | Altok€",
  },
  description:
    "Envía dinero de España a Perú con la mejor tasa de cambio del mercado, sin comisiones ocultas y transferencias directas a BCP, BBVA, Interbank y Yape/Plin en minutos.",
  keywords: [
    "remesas peru",
    "enviar dinero a peru",
    "tasa de cambio euro sol",
    "Altok€",
    "transferencias peru",
    "yape desde españa",
    "envio de dinero seguro",
  ],
  authors: [{ name: "Altok€", url: "https://valoratransfer.com" }],
  creator: "Altok€",
  publisher: "Altok€",
  alternates: {
    canonical: "https://valoratransfer.com",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Altok€ - Transferencias de Dinero Rápidas y Seguras",
    description:
      "Calcula tu envío en tiempo real y recibe tus soles en minutos con la mejor tasa garantizada.",
    url: "https://valoratransfer.com",
    siteName: "Altok€",
    locale: "es_PE",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Altok€ - Remesas y Transferencias a Perú",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Altok€ | Envíos de Dinero a Perú",
    description: "Tu dinero seguro en Perú con las mejores tasas de cambio.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🏷️ Datos Estructurados JSON-LD (Schema.org)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "Altok€",
    url: "https://valoratransfer.com",
    logo: "https://valoratransfer.com/logo.png",
    description:
      "Servicios de transferencia de dinero y remesas internacionales entre Europa, EE.UU. y Perú.",
    currenciesAccepted: "EUR, USD, PEN",
    paymentAccepted: "Bank Transfer, Credit Card, Debit Card",
    priceRange: "$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "PE",
      addressLocality: "Lima",
    },
  };

  return (
    <html
      lang="es"
      className={`dark ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 min-h-screen flex flex-col font-sans">
        {/* ♿ Enlace de accesibilidad para lectores de pantalla */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-emerald-500 focus:text-slate-950"
        >
          Saltar al contenido principal
        </a>

        <main id="main-content" className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}