// app/api/rates/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await query(
      `SELECT key, value FROM public.site_config WHERE key IN (
        'exchange_rate_buy', 
        'exchange_rate_sell', 
        'exchange_rate_buy_usd', 
        'exchange_rate_sell_usd',
        'transfer_commission_bank',
        'transfer_commission_wallet'
      )`
    );
    
    return NextResponse.json(result.rows || result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error al obtener tasas y comisiones de Neon:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}