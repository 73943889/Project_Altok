"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TransactionPayload {
  user_id: string;
  send_amount: number;
  send_currency: "EUR" | "PEN";
  receive_amount: number;
  receive_currency: "EUR" | "PEN";
  recipient_name: string;
  recipient_bank: string;
  recipient_account: string;
  client_data: {
    full_name: string;
    email: string;
    document_type: string;
    document_number: string;
    phone: string;
  };
}

export async function createTransactionAction(payload: TransactionPayload) {
  try {
    if (!payload.user_id || payload.send_amount <= 0) {
      return { success: false, error: "Datos de transferencia inválidos." };
    }

    // 1. Upsert del cliente en el servidor de forma privada
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .upsert(
        [
          {
            full_name: payload.client_data.full_name,
            email: payload.client_data.email,
            document_type: payload.client_data.document_type,
            document_number: payload.client_data.document_number,
            phone: payload.client_data.phone,
          },
        ],
        { onConflict: "document_number" }
      )
      .select("id")
      .single();

    if (clientError) {
      console.error("Error al registrar cliente:", clientError);
      return { success: false, error: `Error en datos del remitente: ${clientError.message}` };
    }

    // 2. Generar código de operación único
    const operationCode = `VT-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Inserción de la transacción de forma privada
    const { data: txData, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert([
        {
          user_id: payload.user_id,
          client_id: clientData.id,
          operation_code: operationCode,
          send_amount: payload.send_amount,
          send_currency: payload.send_currency,
          receive_amount: payload.receive_amount,
          receive_currency: payload.receive_currency,
          recipient_name: payload.recipient_name,
          recipient_bank: payload.recipient_bank,
          recipient_account: payload.recipient_account,
          status: "PENDIENTE",
        },
      ])
      .select()
      .single();

    if (txError) {
      console.error("Error en transacción:", txError);
      return { success: false, error: `Error al crear orden: ${txError.message}` };
    }

    return { success: true, data: txData };
  } catch (err: any) {
    console.error("Error crítico en Server Action:", err);
    return { success: false, error: "Error interno al procesar la orden." };
  }
}