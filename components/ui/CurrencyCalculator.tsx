"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { rateChannel } from "@/lib/rateSync";

export function CurrencyCalculator() {
  const router = useRouter();

  const [direction, setDirection] = useState<"EUR_PEN" | "PEN_EUR">("EUR_PEN");
  const [sendAmount, setSendAmount] = useState<string>("100");
  
  const [buyRate, setBuyRate] = useState<number>(4.03); // Tasa Compra (EUR -> PEN)
  const [sellRate, setSellRate] = useState<number>(4.07); // Tasa Venta (PEN -> EUR Ref)
  const [loadingRate, setLoadingRate] = useState<boolean>(true);

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase
        .from("site_config")
        .select("key, value")
        .in("key", ["exchange_rate_buy", "exchange_rate_sell"]);

      if (error) throw error;

      if (data) {
        data.forEach((item) => {
          if (item.key === "exchange_rate_buy" && item.value) {
            setBuyRate(parseFloat(item.value));
          }
          if (item.key === "exchange_rate_sell" && item.value) {
            setSellRate(parseFloat(item.value));
          }
        });
      }
    } catch (err) {
      console.error("Error al obtener tasas en la calculadora:", err);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchRates();

    if (rateChannel) {
      rateChannel.onmessage = (event) => {
        if (event.data && event.data.type === "UPDATE_RATES") {
          fetchRates();
        }
      };
    }

    return () => {
      if (rateChannel) {
        rateChannel.onmessage = null;
      }
    };
  }, []);

  const numericSend = parseFloat(sendAmount) || 0;

  // Lógica de cálculo estricta
  const receiveAmount = direction === "EUR_PEN"
    ? (numericSend * buyRate).toFixed(2)
    : (numericSend / sellRate).toFixed(2);

  const toggleDirection = () => {
    setDirection((prev) => (prev === "EUR_PEN" ? "PEN_EUR" : "EUR_PEN"));
  };

  const inverseRateForBadge = sellRate > 0 ? (1 / sellRate).toFixed(4) : "0.0000";

  // 🚀 Manejador de transferencia robusto alineado a la arquitectura de la SPA
  const handleStartTransfer = () => {
    const fromCurrency = direction === "EUR_PEN" ? "EUR" : "PEN";
    const toCurrency = direction === "EUR_PEN" ? "PEN" : "EUR";
    
    // Almacenamos el estado transaccional para persistencia inmediata en el cliente
    const transferPayload = {
      amount: numericSend,
      from: fromCurrency,
      to: toCurrency,
      receive: receiveAmount,
      rate: direction === "EUR_PEN" ? buyRate : sellRate,
    };
    
    localStorage.setItem("pending_transfer", JSON.stringify(transferPayload));

    // Si posees una ruta específica de checkout/login (por ejemplo, /login o /auth), 
    // puedes cambiar esta línea. Por defecto, recargamos o llevamos a la raíz con estado activo.
    router.push("/#calculadora");
    
    // Disparador visual amigable para confirmar la captura de la tasa antes del login/registro
    window.dispatchEvent(new CustomEvent("open-transfer-flow", { detail: transferPayload }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative">
      
      {/* Cabecera con Tasa Dinámica */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-white">Calculadora de Envíos</h3>
          <p className="text-xs text-slate-400">Tasa en tiempo real y garantizada</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
          <RefreshCw className={`w-3.5 h-3.5 ${loadingRate ? "animate-spin" : ""}`} />
          <span>
            {direction === "EUR_PEN" 
              ? `1 EUR = ${buyRate.toFixed(2)} PEN` 
              : `1 PEN = ${inverseRateForBadge} EUR`}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Input de Envío */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {direction === "EUR_PEN" ? "Tú envías desde España" : "Tú envías desde Perú"}
          </span>
          <div className="flex items-center justify-between gap-2">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-extrabold font-mono text-white outline-none"
            />
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold font-mono text-emerald-400">
              {direction === "EUR_PEN" ? "EUR €" : "PEN S/"}
            </span>
          </div>
        </div>

        {/* Botón Central con Key Reactivo para asegurar la animación */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={toggleDirection}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer group"
            title="Invertir dirección"
          >
            <ArrowLeftRight 
              key={direction} 
              className="w-4 h-4 transition-transform duration-500 ease-in-out group-hover:rotate-180"
              style={{ animation: "spin 0.4s ease-in-out" }}
            />
          </button>
        </div>

        {/* Input de Destino */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {direction === "EUR_PEN" ? "El destinatario recibe en Perú" : "El destinatario recibe en Europa"}
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="w-full text-2xl font-extrabold font-mono text-emerald-400">
              {receiveAmount}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold font-mono text-emerald-400">
              {direction === "EUR_PEN" ? "PEN S/" : "EUR €"}
            </span>
          </div>
        </div>

      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Comisión de transferencia:</span>
          <span className="font-semibold text-emerald-400">0.00 EUR (¡Gratis!)</span>
        </div>
        <div className="flex justify-between">
          <span>Tiempo estimado de abono:</span>
          <span className="font-semibold text-white">15 - 30 minutos</span>
        </div>
      </div>

      {/* Botón de Iniciar Transferencia */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleStartTransfer}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <span>Iniciar Transferencia</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Transacción protegida con encriptación bancaria.</span>
      </div>

    </div>
  );
}