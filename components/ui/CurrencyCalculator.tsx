'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, RefreshCw, ShieldCheck } from "lucide-react";
import { rateChannel } from "@/lib/rateSync";
import Pusher from "pusher-js";

type OriginCurrency = "EUR" | "USD";

export function CurrencyCalculator() {
  const router = useRouter();

  const [originCurrency, setOriginCurrency] = useState<OriginCurrency>("USD");
  const [direction, setDirection] = useState<"ORIGIN_PEN" | "PEN_ORIGIN">("ORIGIN_PEN");
  const [sendAmount, setSendAmount] = useState<string>("390.00");
  
  const [buyRateEur, setBuyRateEur] = useState<number>(3.76);
  const [sellRateEur, setSellRateEur] = useState<number>(3.90);
  const [buyRateUsd, setBuyRateUsd] = useState<number>(3.70);
  const [sellRateUsd, setSellRateUsd] = useState<number>(3.82);
  
  const [loadingRate, setLoadingRate] = useState<boolean>(false);

  const applyRatesArray = (rows: any[]) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    rows.forEach((item: any) => {
      const val = parseFloat(item.value);
      if (isNaN(val)) return;

      if (item.key === "exchange_rate_buy") setBuyRateEur(val);
      if (item.key === "exchange_rate_sell" || item.key === "exchange_rate_sale") setSellRateEur(val);
      if (item.key === "exchange_rate_buy_usd") setBuyRateUsd(val);
      if (item.key === "exchange_rate_sell_usd") setSellRateUsd(val);
    });
  };

  const fetchRates = async () => {
    try {
      setLoadingRate(true);
      const res = await fetch("/api/rates", { cache: "no-store" });
      if (!res.ok) throw new Error("Error en respuesta de API");

      const rows = await res.json();
      applyRatesArray(rows);
    } catch (err) {
      console.error("Error al obtener tasas en la calculadora:", err);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchRates();

    const handleLocalUpdate = () => { fetchRates(); };
    window.addEventListener("valora_rate_updated", handleLocalUpdate);

    if (rateChannel) {
      rateChannel.onmessage = (event) => {
        if (event.data && event.data.type === "UPDATE_RATES") {
          fetchRates();
        }
      };
    }

    // 📡 Conexión WebSocket para producción en Vercel
    let pusherClient: Pusher | null = null;
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    if (pusherKey) {
      pusherClient = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });

      const channel = pusherClient.subscribe("rates-channel");

      channel.bind("rates-updated", (data: any) => {
        console.log("⚡ [Pusher Client] Evento de nueva tasa recibido:", data);
        if (data && Array.isArray(data.updates)) {
          applyRatesArray(data.updates);
        } else {
          fetchRates();
        }
      });
    } else {
      console.warn("⚠️ [Pusher Client] NEXT_PUBLIC_PUSHER_KEY no está disponible en la app.");
    }

    return () => {
      window.removeEventListener("valora_rate_updated", handleLocalUpdate);
      if (rateChannel) { rateChannel.onmessage = null; }
      if (pusherClient) {
        pusherClient.unbind_all();
        pusherClient.unsubscribe("rates-channel");
        pusherClient.disconnect();
      }
    };
  }, []);

  const activeBuyRate = originCurrency === "EUR" ? buyRateEur : buyRateUsd;
  const activeSellRate = originCurrency === "EUR" ? sellRateEur : sellRateUsd;

  const numericSend = parseFloat(sendAmount) || 0;

  const receiveAmount = direction === "ORIGIN_PEN"
    ? (numericSend * activeBuyRate).toFixed(2)
    : (activeSellRate > 0 ? (numericSend / activeSellRate).toFixed(2) : "0.00");

  const toggleDirection = () => {
    if (direction === "ORIGIN_PEN") {
      setDirection("PEN_ORIGIN");
      setSendAmount((100 * activeSellRate).toFixed(2));
    } else {
      setDirection("ORIGIN_PEN");
      setSendAmount("100");
    }
  };

  const badgeDisplay = direction === "ORIGIN_PEN"
    ? `1 ${originCurrency} = ${activeBuyRate.toFixed(4)} PEN`
    : `1 ${originCurrency} = ${activeSellRate.toFixed(4)} PEN (Venta)`;

  const isEur = originCurrency === "EUR";

  const handleStartTransfer = async () => {
    try {
      const parsedSend = parseFloat(sendAmount);
      if (isNaN(parsedSend) || parsedSend <= 0) {
        alert("Por favor, ingresa un monto válido a enviar.");
        return;
      }

      const isSendingOrigin = direction === "ORIGIN_PEN";

      const queryParams = new URLSearchParams({
        sendAmount: parsedSend.toString(),
        sendCurrency: isSendingOrigin ? originCurrency : 'PEN',
        receiveAmount: receiveAmount,
        receiveCurrency: isSendingOrigin ? 'PEN' : originCurrency
      });

      router.push(`/portal/nuevo-envio?${queryParams.toString()}`);

    } catch (err: any) {
      console.error("Error en redirección de calculadora:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className={`w-full max-w-sm bg-slate-900/95 border rounded-xl p-4 shadow-xl backdrop-blur-xl relative transition-all duration-300 ${
      isEur ? "border-blue-500/60 shadow-blue-500/10" : "border-emerald-500/60 shadow-emerald-500/10"
    }`}>
      
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-white">Calculadora de Envíos</h3>
          <p className="text-[10px] text-slate-400">Tasa en tiempo real y garantizada</p>
        </div>

        <div className="flex bg-slate-950 p-0.5 rounded-md border border-slate-800">
          <button
            type="button"
            onClick={() => setOriginCurrency("EUR")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              isEur ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            EUR
          </button>
          <button
            type="button"
            onClick={() => setOriginCurrency("USD")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              !isEur ? "bg-emerald-500 text-slate-950 shadow font-extrabold" : "text-slate-400 hover:text-white"
            }`}
          >
            USD
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isEur ? "bg-blue-400" : "bg-emerald-400"}`} />
          Tasa:
        </span>
        <div className={`flex items-center gap-1 font-semibold ${isEur ? "text-blue-400" : "text-emerald-400"}`}>
          <RefreshCw className={`w-3 h-3 ${loadingRate ? "animate-spin" : ""}`} />
          <span>{badgeDisplay}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
            {direction === "ORIGIN_PEN" ? `Tu envías (${originCurrency})` : "Tu envías (PEN)"}
          </span>
          <div className="flex items-center justify-between gap-2">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="w-full bg-transparent text-lg font-bold font-mono text-white outline-none"
            />
            <span className={`px-2 py-0.5 rounded border text-[11px] font-bold font-mono bg-slate-900 border-slate-800 ${isEur ? "text-blue-400" : "text-emerald-400"}`}>
              {originCurrency}
            </span>
          </div>
        </div>

        <div className="flex justify-center -my-1 relative z-10">
          <button
            onClick={toggleDirection}
            type="button"
            className={`w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center transition-all shadow cursor-pointer ${
              isEur ? "hover:text-blue-400 hover:border-blue-500" : "hover:text-emerald-400 hover:border-emerald-500"
            }`}
            title="Invertir dirección"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
            El destinatario recibe
          </span>
          <div className="flex items-center justify-between gap-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={receiveAmount}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.15 }}
                className={`w-full text-lg font-bold font-mono ${isEur ? "text-blue-400" : "text-emerald-400"}`}
              >
                {receiveAmount}
              </motion.span>
            </AnimatePresence>
            <span className={`px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-bold font-mono ${isEur ? "text-blue-400" : "text-emerald-400"}`}>
              {direction === "ORIGIN_PEN" ? "PEN" : originCurrency}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
        <div className="flex justify-between">
          <span>Comisión:</span>
          <span className={`font-medium ${isEur ? "text-blue-400" : "text-emerald-400"}`}>0.00 {originCurrency} (¡Gratis!)</span>
        </div>
        <div className="flex justify-between">
          <span>Abono estimado:</span>
          <span className="font-medium text-white">00 - 05 min</span>
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={handleStartTransfer}
          className={`w-full py-2.5 px-3 rounded-lg shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider ${
            isEur 
              ? "bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-blue-500/20" 
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-emerald-500/20"
          }`}
        >
          <span>Iniciar Transferencia ➔</span>
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1 text-[9px] text-slate-500">
        <ShieldCheck className={`w-3 h-3 ${isEur ? "text-blue-400" : "text-emerald-400"}`} />
        <span>Transacción protegida con encriptación bancaria.</span>
      </div>

    </div>
  );
}