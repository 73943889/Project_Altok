"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/db";
import { rateChannel } from "@/lib/rateSync";

type OriginCurrency = "EUR" | "USD";

export function CurrencyCalculator() {
  const router = useRouter();

  const [originCurrency, setOriginCurrency] = useState<OriginCurrency>("EUR");
  const [direction, setDirection] = useState<"ORIGIN_PEN" | "PEN_ORIGIN">("ORIGIN_PEN");
  const [sendAmount, setSendAmount] = useState<string>("390.00");
  
  // Tasas independientes configurables
  const [buyRateEur, setBuyRateEur] = useState<number>(3.76);   // EUR -> PEN
  const [sellRateEur, setSellRateEur] = useState<number>(3.90);  // PEN -> EUR
  const [buyRateUsd, setBuyRateUsd] = useState<number>(3.70);   // USD -> PEN (Nueva tasa USD)
  const [sellRateUsd, setSellRateUsd] = useState<number>(3.82);  // PEN -> USD (Nueva tasa USD)
  
  const [loadingRate, setLoadingRate] = useState<boolean>(false);

  const fetchRates = async () => {
    try {
      setLoadingRate(true);
      const { data, error } = await supabase
        .from("site_config")
        .select("key, value")
        .in("key", [
          "exchange_rate_buy", 
          "exchange_rate_sell", 
          "exchange_rate_sale",
          "exchange_rate_buy_usd",
          "exchange_rate_sell_usd"
        ]);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach((item) => {
          const val = parseFloat(item.value);
          if (isNaN(val)) return;

          if (item.key === "exchange_rate_buy") setBuyRateEur(val);
          if (item.key === "exchange_rate_sell" || item.key === "exchange_rate_sale") setSellRateEur(val);
          if (item.key === "exchange_rate_buy_usd") setBuyRateUsd(val);
          if (item.key === "exchange_rate_sell_usd") setSellRateUsd(val);
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

    const handleLocalUpdate = () => { fetchRates(); };
    window.addEventListener("valora_rate_updated", handleLocalUpdate);

    if (rateChannel) {
      rateChannel.onmessage = (event) => {
        if (event.data && event.data.type === "UPDATE_RATES") {
          fetchRates();
        }
      };
    }

    const subscription = supabase
      .channel("public:site_config_calculator_multicurrency")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config" },
        () => { fetchRates(); }
      )
      .subscribe();

    return () => {
      window.removeEventListener("valora_rate_updated", handleLocalUpdate);
      if (rateChannel) { rateChannel.onmessage = null; }
      supabase.removeChannel(subscription);
    };
  }, []);

  // Seleccionar tasas activas según la moneda de origen elegida
  const activeBuyRate = originCurrency === "EUR" ? buyRateEur : buyRateUsd;
  const activeSellRate = originCurrency === "EUR" ? sellRateEur : sellRateUsd;

  const numericSend = parseFloat(sendAmount) || 0;

  // Cálculo financiero según dirección y moneda
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

  const handleStartTransfer = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert("Debes iniciar sesión para realizar una transferencia.");
        router.push("/login");
        return;
      }

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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative">
      
      {/* Cabecera con Selector de Moneda (EUR / USD) */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-white">Calculadora de Envíos</h3>
          <p className="text-xs text-slate-400">Tasa en tiempo real y garantizada</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch de Divisa de Origen */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(["EUR", "USD"] as OriginCurrency[]).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setOriginCurrency(cur)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  originCurrency === cur
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Badge de Tasa Actual */}
      <div className="flex items-center justify-between mb-4 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
        <span className="text-slate-400 text-[11px]">Tasa de referencia:</span>
        <div className="flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loadingRate ? "animate-spin" : ""}`} />
          <span>{badgeDisplay}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Bloque Origen */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {direction === "ORIGIN_PEN" 
              ? `Tú envías desde ${originCurrency === "EUR" ? "España" : "Estados Unidos"}` 
              : "Tú envías desde Perú"}
          </span>
          <div className="flex items-center justify-between gap-2">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-extrabold font-mono text-white outline-none"
            />
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold font-mono text-emerald-400">
              {direction === "ORIGIN_PEN" ? `${originCurrency} ${originCurrency === "EUR" ? "€" : "$"}` : "PEN S/"}
            </span>
          </div>
        </div>

        {/* Botón Invertir Dirección */}
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
            />
          </button>
        </div>

        {/* Input Bloque Destino */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {direction === "ORIGIN_PEN" ? "El destinatario recibe en Perú" : `El destinatario recibe en ${originCurrency === "EUR" ? "Europa" : "EE.UU."}`}
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="w-full text-2xl font-extrabold font-mono text-emerald-400">
              {receiveAmount}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold font-mono text-emerald-400">
              {direction === "ORIGIN_PEN" ? "PEN S/" : `${originCurrency} ${originCurrency === "EUR" ? "€" : "$"}`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Comisión de transferencia:</span>
          <span className="font-semibold text-emerald-400">0.00 {originCurrency} (¡Gratis!)</span>
        </div>
        <div className="flex justify-between">
          <span>Tiempo estimado de abono:</span>
          <span className="font-semibold text-white">15 - 30 minutos</span>
        </div>
      </div>

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