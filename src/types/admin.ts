/**
 * Estados permitidos para una transacción dentro de ValoraTransfer
 */
export type TransactionStatus = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO';

/**
 * Tipo estricto para las divisas soportadas en el corredor España ↔ Perú
 */
export type CurrencyCode = 'EUR' | 'PEN';

/**
 * Esquema de la tabla 'clients' en Supabase (PostgreSQL)
 */
export interface Client {
  id: string;
  created_at?: string;
  full_name: string;
  email: string;
  document_type: string;
  document_number: string;
  phone?: string | null;
}

/**
 * Esquema base de la tabla 'transactions' en Supabase (PostgreSQL)
 */
export interface Transaction {
  id: string;
  created_at: string;
  updated_at?: string;
  client_id?: string;
  recipient_name: string;
  recipient_bank: string;
  recipient_account: string;
  send_amount: number;
  send_currency: CurrencyCode;
  receive_amount: number;
  receive_currency: CurrencyCode;
  operation_code: string;
  status: TransactionStatus;
  internal_notes?: string | null;
  receipt_url?: string | null;
  processed_by?: string | null;
}

/**
 * DTO Unificado (Data Transfer Object) para la tabla de administración.
 * Acepta tanto datos planos como la relación anidada de 'clients'.
 */
export interface ClientOperation extends Transaction {
  // Atributos del Cliente (Extraídos de la relación clients o fallback)
  full_name: string;
  email: string;
  document_type: string;
  document_number: string;
  phone?: string | null;
  
  // Relación opcional retornada por consultas JOIN de Supabase: select('*, clients(*)')
  clients?: Client | Client[] | null;
}