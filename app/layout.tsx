import type { Metadata } from "next";
import "./globals.css";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Schema.org para Rich Snippets en Google
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
    <html lang="es" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}