// lib/events-emitter.ts
import { EventEmitter } from 'events';

const globalForEmitter = global as unknown as { globalEmitter: EventEmitter };

export const globalEmitter = globalForEmitter.globalEmitter || new EventEmitter();
globalEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  globalForEmitter.globalEmitter = globalEmitter;
}