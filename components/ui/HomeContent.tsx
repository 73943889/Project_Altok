"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  ArrowRightLeft, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Lock 
} from "lucide-react";
import { TransferModal } from "@/components/ui/TransferModal";
import { AboutSection } from "@/components/ui/AboutSection";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { SupportSection } from "@/components/ui/SupportSection";

type OriginCurrency = "EUR" | "USD";

interface HomeContentProps {
  initialSession: any;
  initialProfileName: string;
}

export function HomeContent({ initialSession, initialProfileName }: HomeContentProps) {
  const router = useRouter();
  const session = initialSession;

  const [originCurrency, setOriginCurrency] = useState<OriginCurrency>("USD");
  const [isSendingOrigin, setIsSendingOrigin] = useState(true); 
  const [sendAmount, setSendAmount] = useState<string>("100");
  
  const [buyRateEur, setBuyRateEur] = useState<number>(3.76);
  const [sellRateEur, setSellRateEur] = useState<number>(3.90);
  const [buyRateUsd, setBuyRateUsd] = useState<number>(3.70);
  const [sellRateUsd, setSellRateUsd] = useState<number>(3.82);
  
  const [loadingTasa, setLoadingTasa] = useState<boolean>(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 🚀 Función optimizada que actualiza estados y recalcula de inmediato
  const fetchTasaActiva = async () => {
    try {
      setLoadingTasa(true);
      const response = await fetch('/api/rates', { cache: 'no-store' });
      if (!response.ok) throw new Error("Error al obtener tasas");
      
      const data = await response.json();
      if (data && Array.isArray(data)) {
        data.forEach((item: { key: string; value: string }) => {
          const val = Number(item.value);
          if (!isNaN(val)) {
            if (item.key === "exchange_rate_buy") setBuyRateEur(val);
            if (item.key === "exchange_rate_sell") setSellRateEur(val);
            if (item.key === "exchange_rate_buy_usd") setBuyRateUsd(val);
            if (item.key === "exchange_rate_sell_usd") setSellRateUsd(val);
          }
        });
      }
    } catch (err) {
      console.error("Error al obtener la tasa:", err);
    } finally {
      setLoadingTasa(false);
    }
  };

  useEffect(() => {
    // 1. Carga inicial
    fetchTasaActiva();

    // 2. Conexión pasiva en tiempo real vía Server-Sent Events (Cero polling a la BD)
    const eventSource = new EventSource('/api/rates/stream');
    
    eventSource.onmessage = (event) => {
      if (event.data === 'update') {
        // Refrescamos las tasas inmediatamente desde el servidor sin tocar F5
        fetchTasaActiva();
      }
    };

    eventSource.onerror = (err) => {
      console.error("Error en la conexión SSE:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const activeBuyRate = originCurrency === "EUR" ? buyRateEur : buyRateUsd;
  const activeSellRate = originCurrency === "EUR" ? sellRateEur : sellRateUsd;

  const calculateReceive = () => {
    const cleanValue = sendAmount.trim() === "" ? 0 : parseFloat(sendAmount);
    if (isNaN(cleanValue)) return "0.00";
    return isSendingOrigin ? (cleanValue * activeBuyRate).toFixed(2) : (activeSellRate > 0 ? (cleanValue / activeSellRate).toFixed(2) : "0.00");
  };

  const receiveAmount = calculateReceive();

  const handleToggleCurrencyDirection = () => {
    const currentSendVal = parseFloat(sendAmount) || 0;
    if (isSendingOrigin) {
      setSendAmount((currentSendVal * activeBuyRate).toFixed(2));
    } else {
      setSendAmount(activeSellRate > 0 ? (currentSendVal / activeSellRate).toFixed(2) : "0.00");
    }
    setIsSendingOrigin(!isSendingOrigin);
  };

  const handleStartTransfer = () => {
    const numericAmount = parseFloat(sendAmount);
    if (!numericAmount || numericAmount <= 0) {
      alert("Por favor ingresa un monto válido para transferir.");
      return;
    }
    if (!session) {
      router.push("/login");
    } else {
      setIsTransferModalOpen(true);
    }
  };

  const userId = session?.user?.id || session?.userId;
  const userEmail = session?.user?.email || session?.email || "";
  const userFullName = initialProfileName || session?.user?.full_name || session?.full_name || "";

  // 🎨 Sistema de Identidad Cromática Dinámica & Micro-Corredor Integrado
  const isEur = originCurrency === "EUR";
  
  const theme = {
    borderGlow: isEur ? "border-blue-500/50 shadow-blue-500/10" : "border-emerald-500/50 shadow-emerald-500/10",
    textAccent: isEur ? "text-blue-400" : "text-emerald-400",
    bgBadge: isEur ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    dotPulse: isEur ? "bg-blue-400" : "bg-emerald-400",
    corridorFlag: isEur ? "🇪🇸" : "🇺🇸",
    corridorShort: isEur ? "Envío directo desde Europa a Perú" : "Envío directo desde EE.UU. a Perú",
    buttonBg: isEur 
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500" 
      : "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/25 hover:opacity-95",
  };

  return (
    <>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Plataforma Financiera Regulada Perú ⇄ España ⇄ EE.UU.
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            Envía dinero a casa con la <span className="text-emerald-400">tasa real</span> y sin sorpresas.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Transfiere de Euros o Dólares a Soles (o viceversa) en minutos. Cuentas locales en BCP, Interbank y BBVA con cero comisiones ocultas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Velocidad garantizada</p>
                <p className="text-[11px] text-slate-400">Acreditado de 00 a 05 min.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Verificación KYC</p>
                <p className="text-[11px] text-slate-400">Cumplimiento SBS/SEPBLAC.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Banca Directa</p>
                <p className="text-[11px] text-slate-400">Cuentas BCP - Interbank y muchas más.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🧮 Calculadora Compacta con Ancho Exacto (max-w-[410px]) y Corredor Integrado */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div 
            id="calculadora" 
            className={`w-full max-w-[410px] h-fit bg-[#0b101d] border rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl relative transition-all duration-300 scroll-mt-28 ${theme.borderGlow}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Calculadora de Envíos</h3>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1 border ${theme.bgBadge}`}>
                    <span>{theme.corridorFlag}</span>
                    <span>{theme.corridorShort}</span>
                  </div>
                </div>
                
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
                  {(["EUR", "USD"] as OriginCurrency[]).map((cur) => {
                    const active = originCurrency === cur;
                    return (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setOriginCurrency(cur)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? cur === "EUR"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-emerald-500 text-slate-950 shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {cur}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center justify-between shadow-inner ${theme.bgBadge}`}>
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.dotPulse}`}></span>
                  <span>Tasa de referencia:</span>
                </span>
                <span>
                  {loadingTasa 
                    ? "Cargando..." 
                    : isSendingOrigin 
                      ? `1 ${originCurrency} = ${activeBuyRate.toFixed(4)} PEN` 
                      : `1 PEN = ${(1 / activeSellRate).toFixed(4)} ${originCurrency}`}
                </span>
              </div>

              <div className="bg-[#070a13] border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div className="space-y-1 w-full">
                  <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                    {isSendingOrigin ? `TÚ ENVÍAS DESDE ${originCurrency}` : "TÚ ENVÍAS DESDE PERÚ"}
                  </label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={sendAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) setSendAmount(val);
                    }}
                    className="w-full bg-transparent text-white font-mono text-xl font-bold focus:outline-none"
                  />
                </div>
                <div className={`font-extrabold text-xs bg-[#0b101d] px-3 py-2 rounded-xl border border-slate-800 text-center shrink-0 ml-3 ${theme.textAccent}`}>
                  {isSendingOrigin ? originCurrency : "PEN"}
                </div>
              </div>

              <div className="flex justify-center -my-3.5 relative z-10">
                <button 
                  type="button"
                  onClick={handleToggleCurrencyDirection}
                  title="Invertir dirección"
                  className={`w-7 h-7 rounded-full bg-[#0b101d] border border-slate-800 hover:border-emerald-500 flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer ${theme.textAccent}`}
                >
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-[#070a13] border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div className="space-y-1 w-full">
                  <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                    {isSendingOrigin ? "EL DESTINATARIO RECIBE EN PERÚ" : `EL DESTINATARIO RECIBE EN ${originCurrency}`}
                  </label>
                  <input 
                    disabled
                    type="text"
                    value={receiveAmount}
                    className={`w-full bg-transparent font-mono text-xl font-black focus:outline-none ${theme.textAccent}`}
                  />
                </div>
                <div className={`font-extrabold text-xs bg-[#0b101d] px-3 py-2 rounded-xl border border-slate-800 text-center shrink-0 ml-3 ${theme.textAccent}`}>
                  {isSendingOrigin ? "PEN" : originCurrency}
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs text-slate-400 px-1">
                <div className="flex justify-between">
                  <span>Comisión de transferencia:</span>
                  <span className={`font-bold ${theme.textAccent}`}>0.00 {originCurrency} (¡Gratis!)</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo estimado de abono:</span>
                  <span className="text-white font-semibold">00 - 05 minutos</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleStartTransfer}
                className={`w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${theme.buttonBg}`}
              >
                <span>Iniciar Transferencia</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-0.5">
                <Lock className={`w-3 h-3 ${theme.textAccent}`} /> Transacción protegida con encriptación bancaria.
              </p>
            </div>
          </div>
        </div>
      </main>

      <AboutSection />

      <section id="como-funciona" className="py-20 border-t border-slate-900">
         <HowItWorks />
      </section>

      <section id="soporte" className="py-20 border-t border-slate-900">
        <SupportSection />
      </section>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        sendAmount={parseFloat(sendAmount) || 0}
        sendCurrency={isSendingOrigin ? originCurrency : "PEN"}
        receiveAmount={receiveAmount}
        receiveCurrency={isSendingOrigin ? "PEN" : originCurrency}
        userId={userId}
        userEmail={userEmail}
        userFullName={userFullName}
      />
    </>
  );
}