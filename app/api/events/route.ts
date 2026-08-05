// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { globalEmitter } from '@/lib/events-emitter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (e) {
          // Si el cliente se desconecta, evitamos excepciones de flujo
        }
      };

      // 1. Enviar evento inicial de conexión
      sendEvent('connected');

      // 2. Latido (Heartbeat) cada 15 segundos para mantener la conexión HTTP viva
      const heartbeat = setInterval(() => {
        sendEvent('ping');
      }, 15000);

      // 3. Escuchar la actualización de transacciones emitida por la Server Action
      const listener = (transactionId: string) => {
        sendEvent(`update:${transactionId}`);
      };

      globalEmitter.on('transactionUpdated', listener);

      // 4. Limpieza automática al cerrar la pestaña o desconectarse
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        globalEmitter.off('transactionUpdated', listener);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}