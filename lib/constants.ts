export interface DestinationOption {
  id: string;
  name: string;
  country: "PEN" | "EUR" | "USD";
  type: "bank" | "wallet";
}

export const DESTINATION_OPTIONS: DestinationOption[] = [
  // --- PERÚ (PEN) - BANCOS ---
  { id: "BCP", name: "BCP", country: "PEN", type: "bank" },
  { id: "BBVA_PE", name: "BBVA Perú", country: "PEN", type: "bank" },
  { id: "Interbank", name: "Interbank", country: "PEN", type: "bank" },
  { id: "Scotiabank", name: "Scotiabank", country: "PEN", type: "bank" },
  // --- PERÚ (PEN) - WALLETS ---
  { id: "Yape", name: "Yape", country: "PEN", type: "wallet" },
  { id: "Plin", name: "Plin", country: "PEN", type: "wallet" },
  { id: "Bim", name: "Bim Monedero Móvil", country: "PEN", type: "wallet" },

  // --- EUROPA / ESPAÑA (EUR) - BANCOS ---
  { id: "CaixaBank", name: "CaixaBank", country: "EUR", type: "bank" },
  { id: "Santander", name: "Banco Santander", country: "EUR", type: "bank" },
  { id: "BBVA_ES", name: "BBVA España", country: "EUR", type: "bank" },
  { id: "Sabadell", name: "Banco Sabadell", country: "EUR", type: "bank" },
  // --- EUROPA / ESPAÑA (EUR) - WALLETS ---
  { id: "Bizum", name: "Bizum", country: "EUR", type: "wallet" },

  // --- ESTADOS UNIDOS (USD) - BANCOS ---
  { id: "BankofAmerica", name: "Bank of America", country: "USD", type: "bank" },
  { id: "CapitalOne", name: "Capital One", country: "USD", type: "bank" },
  { id: "JPMorganChase", name: "JPMorgan Chase", country: "USD", type: "bank" },
  // --- ESTADOS UNIDOS (USD) - WALLETS ---
  { id: "Zelle", name: "Zelle Transfer", country: "USD", type: "wallet" },
];

// Extracción de IDs como Tupla Constante para validación estricta con Zod
export const DESTINATION_BANK_IDS = [
  "BCP", "BBVA_PE", "Interbank", "Scotiabank", "Yape", "Plin", "Bim",
  "CaixaBank", "Santander", "BBVA_ES", "Sabadell", "Bizum",
  "BankofAmerica", "CapitalOne", "JPMorganChase", "Zelle"
] as const;