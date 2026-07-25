// lib/rateSync.ts
/*export const RATE_CHANNEL_NAME = "valora_transfer_rates";

export const rateChannel = typeof window !== "undefined" 
  ? new BroadcastChannel(RATE_CHANNEL_NAME) 
  : null;

export const triggerRateUpdate = () => {
  if (rateChannel) {
    rateChannel.postMessage({ type: "UPDATE_RATES", timestamp: Date.now() });
  }
};*/

// lib/rateSync.ts

export const RATE_CHANNEL_NAME = "valora_transfer_rates";

// Instancia segura de BroadcastChannel para comunicación entre pestañas del navegador
export const rateChannel = typeof window !== "undefined" 
  ? new BroadcastChannel(RATE_CHANNEL_NAME) 
  : null;

/**
 * Dispara una actualización instantánea de tasas de cambio hacia:
 * 1. Todas las demás pestañas del navegador (vía BroadcastChannel).
 * 2. La propia pestaña activa (vía CustomEvent del DOM).
 */
export const triggerRateUpdate = () => {
  if (typeof window === "undefined") return;

  // 1. Notificar a otras pestañas
  if (rateChannel) {
    try {
      rateChannel.postMessage({ type: "UPDATE_RATES", timestamp: Date.now() });
    } catch (err) {
      console.error("Error al enviar mensaje por BroadcastChannel:", err);
    }
  }

  // 2. Notificar de forma inmediata a la pestaña actual mediante un evento del DOM
  try {
    const event = new CustomEvent("valora_rate_updated", { detail: { timestamp: Date.now() } });
    window.dispatchEvent(event);
  } catch (err) {
    console.error("Error al disparar el evento local de tasas:", err);
  }
};