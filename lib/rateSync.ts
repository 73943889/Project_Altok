// lib/rateSync.ts
export const RATE_CHANNEL_NAME = "valora_transfer_rates";

export const rateChannel = typeof window !== "undefined" 
  ? new BroadcastChannel(RATE_CHANNEL_NAME) 
  : null;

export const triggerRateUpdate = () => {
  if (rateChannel) {
    rateChannel.postMessage({ type: "UPDATE_RATES", timestamp: Date.now() });
  }
};