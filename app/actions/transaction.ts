// app/actions/transaction.ts
'use server';

import { query } from "@/lib/db";
import { unstable_noStore as noStore } from 'next/cache';

interface TransactionPayload {
  user_id: string;
  send_amount: number;
  send_currency: "EUR" | "PEN" | "USD";
  receive_amount: number;
  receive_currency: "EUR" | "PEN" | "USD";
  exchange_rate_applied: number;
  recipient_name: string;
  recipient_bank: string;
  recipient_account: string;
  bank: string;
  transfer_commission: number; // 👈 Comisión activa
  commission_type: 'bank' | 'wallet'; // 👈 Tipo de canal
  client_data: {
    full_name: string;
    email: string;
    document_type: string;
    document_number: string;
    phone: string;
  };
}

export async function updateTransactionBankAction(operationCode: string, bankName: string) {
  noStore();
  try {
    const queryStr = `
      UPDATE public.transactions
      SET bank = $1, updated_at = NOW()
      WHERE operation_code = $2
      RETURNING *;
    `;
    const result = await query(queryStr, [bankName, operationCode]);
    return { success: true, data: result.rows[0] };
  } catch (err: any) {
    console.error("Error al actualizar banco de recaudo:", err);
    return { success: false, error: err.message };
  }
}

export async function createTransactionAction(payload: TransactionPayload) {
  noStore();
  try {
    if (!payload.user_id || payload.send_amount <= 0) {
      return { success: false, error: "Datos de transferencia inválidos." };
    }

    // Generar código de operación único
    const operationCode = `VT-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Upsert del cliente (remitente) basado en el número de documento
    const clientQuery = `
      INSERT INTO public.clients (full_name, email, document_type, document_number, phone)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (document_number) 
      DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone
      RETURNING id;
    `;

    const clientValues = [
      payload.client_data.full_name,
      payload.client_data.email,
      payload.client_data.document_type,
      payload.client_data.document_number,
      payload.client_data.phone,
    ];

    const clientResult = await query(clientQuery, clientValues);
    const clientId = clientResult.rows[0]?.id;

    if (!clientId) {
      return { success: false, error: "No se pudo registrar o recuperar la información del remitente." };
    }

    // 2. Inserción de la transacción con los placeholders correctos ($1 hasta $13)
    const txQuery = `
      INSERT INTO public.transactions (
        user_id,
        client_id,
        operation_code,
        send_amount,
        send_currency,
        receive_amount,
        receive_currency,
        exchange_rate_applied, 
        recipient_name,
        recipient_bank,
        recipient_account,
        bank,
        transfer_commission,
        commission_type,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE', NOW())
      RETURNING *;
    `;

    const txValues = [
      payload.user_id,
      clientId,
      operationCode,
      payload.send_amount,
      payload.send_currency,
      payload.receive_amount,
      payload.receive_currency,
      payload.exchange_rate_applied || 0,
      payload.recipient_name,
      payload.recipient_bank,
      payload.recipient_account,
      payload.bank || "Cuenta Colectora Principal", // 👈 $12: Banco receptor corporativo
      payload.transfer_commission || 0,             // 👈 $13: Comisión
      payload.commission_type || 'bank',            // 👈 $14: Tipo de comisión
    ];
    const txResult = await query(txQuery, txValues);

    return { 
      success: true, 
      data: txResult.rows[0] 
    };

  } catch (err: any) {
    console.error("Error crítico en Server Action con Neon:", err);
    return { success: false, error: "Error interno al procesar la orden en la base de datos." };
  }
}