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

  const [originCurrency, setOriginCurrency] = useState<OriginCurrency>("EUR");
  const [isSendingOrigin, setIsSendingOrigin] = useState(true); 
  const [sendAmount, setSendAmount] = useState<string>("100");
  
  const [buyRateEur, setBuyRateEur] = useState<number>(3.76);
  const [sellRateEur, setSellRateEur] = useState<number>(3.90);
  const [buyRateUsd, setBuyRateUsd] = useState<number>(3.70);
  const [sellRateUsd, setSellRateUsd] = useState<number>(3.82);
  
  const [loadingTasa, setLoadingTasa] = useState<boolean>(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const fetchTasaActiva = async (isInitial = false) => {
    try {
      if (isInitial) setLoadingTasa(true);

      const response = await fetch('/api/rates');
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
      console.error("Error al obtener la tasa desde el servidor:", err);
    } finally {
      if (isInitial) setLoadingTasa(false);
    }
  };

  useEffect(() => {
    fetchTasaActiva(true);
    const intervalId = setInterval(() => fetchTasaActiva(false), 15000);
    return () => clearInterval(intervalId);
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

  // Extraemos de forma segura los datos de sesión para pasarlos al modal
  const userId = session?.user?.id || session?.userId;
  const userEmail = session?.user?.email || session?.email || "";
  const userFullName = initialProfileName || session?.user?.full_name || session?.full_name || "";

  return (
    <>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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

        <div id="calculadora" className="lg:col-span-5 bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Calculadora de Envíos</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tasa en tiempo real y garantizada</p>
              </div>
              
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

            <div className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center justify-between shadow-inner">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
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

            <div className="bg-[#070a13] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="space-y-1.5 w-full">
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
                  className="w-full bg-transparent text-white font-mono text-xl sm:text-2xl font-bold focus:outline-none"
                />
              </div>
              <div className="text-emerald-400 font-extrabold text-xs bg-[#0b101d] px-3.5 py-2.5 rounded-xl border border-slate-800 text-center shrink-0 ml-3">
                {isSendingOrigin ? originCurrency : "PEN"}
              </div>
            </div>

            <div className="flex justify-center -my-4 relative z-10">
              <button 
                type="button"
                onClick={handleToggleCurrencyDirection}
                title="Invertir dirección"
                className="w-8 h-8 rounded-full bg-[#0b101d] border border-slate-800 hover:border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg hover:scale-110 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-[#070a13] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="space-y-1.5 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                  {isSendingOrigin ? "EL DESTINATARIO RECIBE EN PERÚ" : `EL DESTINATARIO RECIBE EN ${originCurrency}`}
                </label>
                <input 
                  disabled
                  type="text"
                  value={receiveAmount}
                  className="w-full bg-transparent text-emerald-400 font-mono text-xl sm:text-2xl font-black focus:outline-none"
                />
              </div>
              <div className="text-emerald-400 font-extrabold text-xs bg-[#0b101d] px-3.5 py-2.5 rounded-xl border border-slate-800 text-center shrink-0 ml-3">
                {isSendingOrigin ? "PEN" : originCurrency}
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs text-slate-400 px-1">
              <div className="flex justify-between">
                <span>Comisión de transferencia:</span>
                <span className="text-emerald-400 font-bold">0.00 {originCurrency} (¡Gratis!)</span>
              </div>
              <div className="flex justify-between">
                <span>Tiempo estimado de abono:</span>
                <span className="text-white font-semibold">00 - 05 minutos</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleStartTransfer}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm hover:opacity-95 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Iniciar Transferencia</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
              <Lock className="w-3 h-3 text-emerald-400" /> Transacción protegida con encriptación bancaria.
            </p>
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

      {/* 🚀 Modal de Transferencia con datos precargados del usuario logueado */}
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