// app/api/rates/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { UpdateRatesRequestSchema } from '@/lib/validations/api-contracts';
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
    
    const rows = result.rows || result;
    
    return NextResponse.json(rows || [], {
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = UpdateRatesRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de tasa o comisión no válidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { key, value } = validation.data;

    await query(
      `INSERT INTO public.site_config (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );

    return NextResponse.json({ success: true, message: 'Tasa/comisión actualizada correctamente.' });
  } catch (error) {
    console.error("Error al actualizar tasa/comisión:", error);
    return NextResponse.json({ error: "Error interno al actualizar la configuración." }, { status: 500 });
  }
}