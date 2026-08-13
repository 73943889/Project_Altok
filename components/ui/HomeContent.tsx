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

  // 🚀 Obtener las tasas activas desde la API
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

  const activeBuyRate = originCurrency === "EUR" ? buyRateEur : buyRateUsd;
  const activeSellRate = originCurrency === "EUR" ? sellRateEur : sellRateUsd;

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
      alert("Por favor ingresa un monto válido mayor a 0.");
      return;
    }
    setIsTransferModalOpen(true);
  };

  return (
    <div className="w-full flex flex-col space-y-16 py-8">
      {/* SECCIÓN CALCULADORA PRINCIPAL */}
      <section id="calculadora" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> Transferencias Inmediatas a Perú
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Envía dinero a Perú <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                al mejor tipo de cambio.
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Abonos directos a cuentas BCP, Interbank, BBVA, Scotiabank y Yape. Sin comisiones ocultas y con la tasa garantizada.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <span className="text-emerald-400 font-bold text-lg block">&lt; 5 min</span>
                <span className="text-xs text-slate-500">Tiempo estimado</span>
              </div>
              <div>
                <span className="text-white font-bold text-lg block">0%</span>
                <span className="text-xs text-slate-500">Comisión oculta</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold text-lg block">100%</span>
                <span className="text-xs text-slate-500">Garantizado</span>
              </div>
            </div>
          </div>

          {/* TARJETA CALCULADORA */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calculadora de Envío</span>
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setOriginCurrency("USD")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      originCurrency === "USD" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇺🇸 USD
                  </button>
                  <button
                    onClick={() => setOriginCurrency("EUR")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      originCurrency === "EUR" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇪🇸 EUR
                  </button>
                </div>
              </div>

              {/* INPUT MONTO ENVIADO */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Tú envías</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-colors">
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-white outline-none font-mono"
                    placeholder="100"
                  />
                  <span className="font-bold text-slate-300 text-sm px-3 font-mono">
                    {isSendingOrigin ? originCurrency : "PEN"}
                  </span>
                </div>
              </div>

              {/* BOTÓN CAMBIO DE DIRECCIÓN */}
              <div className="flex justify-center -my-3 z-10 relative">
                <button
                  onClick={handleToggleCurrencyDirection}
                  className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all shadow-md cursor-pointer"
                  title="Invertir conversión"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* INPUT MONTO RECIBIDO */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">El destinatario recibe</label>
                <div className="flex items-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                  <span className="w-full text-xl font-bold text-emerald-400 font-mono">
                    {receiveAmount}
                  </span>
                  <span className="font-bold text-slate-300 text-sm px-3 font-mono">
                    {isSendingOrigin ? "PEN" : originCurrency}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>Tasa Aplicada:</span>
                <span className="text-emerald-400 font-bold">
                  1 {originCurrency} = {activeBuyRate} PEN
                </span>
              </div>

              <button
                onClick={handleStartTransfer}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>INICIAR TRANSFERENCIA</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Transacción segura y encriptada punto a punto</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECCIONES SECUNDARIAS */}
      <HowItWorks />
      <AboutSection />
      <SupportSection />

      {/* MODAL DE TRANSFERENCIA */}
      {isTransferModalOpen && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          sendAmount={sendAmount}
          receiveAmount={receiveAmount}
          originCurrency={originCurrency}
          activeRate={activeBuyRate}
          session={session}
          initialProfileName={initialProfileName}
        />
      )}
    </div>
  );
}