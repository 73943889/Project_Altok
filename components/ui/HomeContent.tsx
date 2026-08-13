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

  const [buyRateEur, setBuyRateEur] = useState<number>(3.7600);
  const [sellRateEur, setSellRateEur] = useState<number>(3.9000);
  const [buyRateUsd, setBuyRateUsd] = useState<number>(3.3800);
  const [sellRateUsd, setSellRateUsd] = useState<number>(3.8200);

  const [loadingTasa, setLoadingTasa] = useState<boolean>(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 🚀 Control Dinámico de Temas (EUR = Azul | USD = Esmeralda)
  const isEur = originCurrency === "EUR";

  // Helper para garantizar formateo estricto a 4 decimales
  const formatRate4 = (rate: number): string => {
    if (isNaN(rate) || rate === undefined || rate === null) return "0.0000";
    return Number(rate).toFixed(4);
  };

  // Carga inicial de tasas vía API
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
    fetchTasaActiva();

    const eventSource = new EventSource('/api/rates');

    eventSource.onmessage = (event) => {
      if (event.data === 'update') {
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

  const activeBuyRate = isEur ? buyRateEur : buyRateUsd;
  const activeSellRate = isEur ? sellRateEur : sellRateUsd;

  const calculateReceive = () => {
    const cleanValue = sendAmount.trim() === "" ? 0 : parseFloat(sendAmount);
    if (isNaN(cleanValue)) return "0.00";
    return isSendingOrigin 
      ? (cleanValue * activeBuyRate).toFixed(2) 
      : (activeSellRate > 0 ? (cleanValue / activeSellRate).toFixed(2) : "0.00");
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

  return (
    <>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LADO IZQUIERDO: HERO */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-semibold transition-all duration-300 ${
            isEur 
              ? "bg-blue-950/70 border-blue-500/30 text-blue-400" 
              : "bg-emerald-950/70 border-emerald-500/30 text-emerald-400"
          }`}>
            <ShieldCheck className={`w-4 h-4 ${isEur ? "text-blue-400" : "text-emerald-400"}`} />
            <span>Plataforma Financiera Regulada Perú ⇄ España ⇄ EE.UU.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
            Envía dinero a casa con la{" "}
            <span className={isEur ? "text-blue-400" : "text-emerald-400"}>
              tasa real
            </span>{" "}
            y sin sorpresas.
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
            Transfiere de Euros o Dólares a Soles (o viceversa) en minutos. Cuentas locales en BCP, Interbank y BBVA con cero comisiones ocultas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-900">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isEur ? "bg-blue-950/60 border-blue-800/40 text-blue-400" : "bg-emerald-950/60 border-emerald-800/40 text-emerald-400"
              }`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Velocidad garantizada</p>
                <p className="text-[11px] text-slate-400">Acreditado de 00 a 05 min.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isEur ? "bg-blue-950/60 border-blue-800/40 text-blue-400" : "bg-emerald-950/60 border-emerald-800/40 text-emerald-400"
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Verificación KYC</p>
                <p className="text-[11px] text-slate-400">Cumplimiento SBS/SEPBLAC.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isEur ? "bg-blue-950/60 border-blue-800/40 text-blue-400" : "bg-emerald-950/60 border-emerald-800/40 text-emerald-400"
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Banca Directa</p>
                <p className="text-[11px] text-slate-400">Cuentas BCP - Interbank y muchas más.</p>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: CALCULADORA DINÁMICA */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div 
            id="calculadora" 
            className={`w-full max-w-[420px] bg-[#0a0f1d]/90 border rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-4 scroll-mt-28 transition-all duration-300 ${
              isEur 
                ? "border-blue-500/40 shadow-blue-500/10" 
                : "border-emerald-500/40 shadow-emerald-500/10"
            }`}
          >
            {/* ENCABEZADO Y SELECTOR DE MONEDA */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Calculadora de Envíos</h3>
              <div className="flex bg-[#050811] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOriginCurrency("EUR")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isEur
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  EUR
                </button>
                <button
                  type="button"
                  onClick={() => setOriginCurrency("USD")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isEur
                      ? "bg-emerald-400 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  USD
                </button>
              </div>
            </div>

            {/* BADGE DE CORREDOR PAÍS */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
              isEur 
                ? "bg-blue-950/60 border-blue-800/40 text-blue-400" 
                : "bg-[#06201b] border-emerald-800/40 text-emerald-400"
            }`}>
              <span className="font-bold lowercase">{isEur ? "es" : "us"}</span>
              <span>
                Envío directo desde {isEur ? "España / Europa" : "EE.UU."} a Perú
              </span>
            </div>

            {/* BARRA TASA DE REFERENCIA CON 4 DECIMALES OBLIGATORIOS */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono transition-colors ${
              isEur 
                ? "bg-blue-950/60 border-blue-800/40 text-blue-400" 
                : "bg-[#06201b] border-emerald-800/40 text-emerald-400"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isEur ? "bg-blue-400" : "bg-emerald-400"}`} />
                <span>Tasa de referencia:</span>
              </div>
              <span className="font-bold">
                {loadingTasa 
                  ? "Cargando..." 
                  : isSendingOrigin 
                    ? `1 ${originCurrency} = ${formatRate4(activeBuyRate)} PEN` 
                    : `1 PEN = ${formatRate4(activeSellRate > 0 ? 1 / activeSellRate : 0)} ${originCurrency}`}
              </span>
            </div>

            {/* INPUT TÚ ENVÍAS */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                {isSendingOrigin ? `TÚ ENVÍAS DESDE ${originCurrency}` : "TÚ ENVÍAS DESDE PERÚ"}
              </label>
              <div className={`bg-[#050811] border border-slate-800 rounded-xl p-3 flex items-center justify-between transition-colors ${
                isEur ? "focus-within:border-blue-500/50" : "focus-within:border-emerald-500/50"
              }`}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sendAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) setSendAmount(val);
                  }}
                  className="w-full bg-transparent text-2xl font-bold font-mono text-white outline-none"
                />
                <span className={`px-3 py-1 rounded-lg bg-[#0a0f1d] border border-slate-800 text-xs font-bold font-mono shrink-0 ml-2 ${
                  isEur ? "text-blue-400" : "text-emerald-400"
                }`}>
                  {isSendingOrigin ? originCurrency : "PEN"}
                </span>
              </div>
            </div>

            {/* BOTÓN CAMBIO DE DIRECCIÓN */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                type="button"
                onClick={handleToggleCurrencyDirection}
                title="Invertir dirección"
                className={`w-7 h-7 rounded-full bg-[#0a0f1d] border border-slate-800 text-slate-300 flex items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-105 ${
                  isEur ? "hover:border-blue-500 hover:text-blue-400" : "hover:border-emerald-500 hover:text-emerald-400"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* INPUT DESTINATARIO RECIBE */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                {isSendingOrigin ? "EL DESTINATARIO RECIBE EN PERÚ" : `EL DESTINATARIO RECIBE EN ${originCurrency}`}
              </label>
              <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <span className={`text-2xl font-bold font-mono ${isEur ? "text-blue-400" : "text-emerald-400"}`}>
                  {receiveAmount}
                </span>
                <span className={`px-3 py-1 rounded-lg bg-[#0a0f1d] border border-slate-800 text-xs font-bold font-mono shrink-0 ml-2 ${
                  isEur ? "text-blue-400" : "text-emerald-400"
                }`}>
                  {isSendingOrigin ? "PEN" : originCurrency}
                </span>
              </div>
            </div>

            {/* DETALLES DE COMISIÓN Y TIEMPO */}
            <div className="space-y-1 pt-1 text-xs text-slate-400">
              <div className="flex justify-between items-center">
                <span>Comisión de transferencia:</span>
                <span className={`font-bold ${isEur ? "text-blue-400" : "text-emerald-400"}`}>
                  0.00 {originCurrency} (¡Gratis!)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tiempo estimado de abono:</span>
                <span className="text-white font-bold">00 - 05 minutos</span>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL */}
            <button
              type="button"
              onClick={handleStartTransfer}
              className={`w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                isEur
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                  : "bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              <span>INICIAR TRANSFERENCIA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* NOTA DE SEGURIDAD */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <Lock className={`w-3.5 h-3.5 ${isEur ? "text-blue-400" : "text-emerald-400"}`} />
              <span>Transacción protegida con encriptación bancaria.</span>
            </div>

          </div>
        </div>

      </main>

      <AboutSection />

      <section id="como-funciona" className="py-12 border-t border-slate-900">
        <HowItWorks />
      </section>

      <section id="soporte" className="py-12 border-t border-slate-900">
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