// lib/eventsStore.ts
class ServerEventStore {
  private clients: Set<ReadableStreamDefaultController> = 
    (global as any).__sseClients || ((global as any).__sseClients = new Set());

  addClient(controller: ReadableStreamDefaultController) {
    this.clients.add(controller);
  }

  removeClient(controller: ReadableStreamDefaultController) {
    this.clients.delete(controller);
  }

  broadcast(data: string) {
    const encoder = new TextEncoder();
    const payload = encoder.encode(`data: ${data}\n\n`);
    for (const client of this.clients) {
      try {
        client.enqueue(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }
}

export const globalEventStore = new ServerEventStore();