// app/api/rates/stream/route.ts
import { NextResponse } from 'next/server';
import { EventEmitter } from 'events';

export const dynamic = 'force-dynamic';

const globalEmitter = (globalThis as any).__ratesEmitter || new EventEmitter();
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).__ratesEmitter = globalEmitter;
}
globalEmitter.setMaxListeners(100);

// Emisor para tasas
export function notifyClientsRateChanged() {
  globalEmitter.emit('rate-updated');
}

// ⚡ NUEVO: Emisor específico para cambios de estado en transacciones
export function notifyClientsTransactionChanged(payload: string) {
  globalEmitter.emit('transaction-updated', payload);
}

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = () => {
        try {
          controller.enqueue(encoder.encode("data: update\n\n"));
        } catch (e) {}
      };

      // ⚡ NUEVO: Transmite el estado exacto de la transacción al cliente conectado
      const sendTxUpdate = (txData: string) => {
        try {
          controller.enqueue(encoder.encode(`data: update:${txData}\n\n`));
        } catch (e) {}
      };

      globalEmitter.on('rate-updated', sendUpdate);
      globalEmitter.on('transaction-updated', sendTxUpdate);

      request.signal.addEventListener("abort", () => {
        globalEmitter.off('rate-updated', sendUpdate);
        globalEmitter.off('transaction-updated', sendTxUpdate);
      });
    },
    cancel() {
      globalEmitter.removeAllListeners('rate-updated');
      globalEmitter.removeAllListeners('transaction-updated');
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}