// app/api/events/route.ts
import { NextRequest } from 'next/server';
import { globalEventStore } from '@/lib/eventsStore';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      globalEventStore.addClient(controller);
      const encoder = new TextEncoder();
      
      // Mensaje inicial de conexión
      controller.enqueue(encoder.encode('data: connected\n\n'));

      // Heartbeat pasivo de red cada 30 segundos (NO consulta la base de datos)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: ping\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        globalEventStore.removeClient(controller);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}