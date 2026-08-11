// app/actions/transaction.ts
'use server';

import { query } from "@/lib/db";
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL_ERROR: La variable de entorno JWT_SECRET no está definida.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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
  transfer_commission: number;
  commission_type: 'bank' | 'wallet';
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
    // 🛡️ 1. EXTRACCIÓN Y VALIDACIÓN DE SESIÓN (ZERO-TRUST)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { success: false, error: "Transacción denegada: Sesión no válida o expirada." };
    }

    const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
    const email = jwtPayload.email as string;

    // 🛡️ 2. BARRERA ANTI-FRAUDE EN TIEMPO REAL (Consulta a Neon)
    const userCheck: any = await query(
      "SELECT is_active FROM public.users WHERE email = $1 LIMIT 1",
      [email]
    );
    const rows = Array.isArray(userCheck) ? userCheck : userCheck?.rows;
    
    // Verificamos si existe el usuario y si su estado es activo
    const isActive = rows && rows.length > 0 && (rows[0].is_active === true || rows[0].is_active === 't' || rows[0].is_active === 1);

    if (!isActive) {
      // 🚨 USUARIO INHABILITADO: Matamos las cookies desde el servidor y bloqueamos la operación
      cookieStore.set({ name: "auth_token", value: "", maxAge: 0, path: "/" });
      cookieStore.set({ name: "user_email", value: "", maxAge: 0, path: "/" });
      return { success: false, error: "TRANSACCION_DENEGADA: Tu cuenta ha sido inhabilitada por un administrador." };
    }

    // ✅ 3. LÓGICA DE NEGOCIO ORIGINAL (El usuario es legítimo y está activo)
    if (!payload.user_id || payload.send_amount <= 0) {
      return { success: false, error: "Datos de transferencia inválidos." };
    }

    const operationCode = `VT-${Math.floor(100000 + Math.random() * 900000)}`;

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
      payload.bank || "Cuenta Colectora Principal",
      payload.transfer_commission || 0,
      payload.commission_type || 'bank',
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