"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Building2, 
  ArrowRightLeft, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Phone, 
  Lock,
  LayoutDashboard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TransferModal } from "@/components/ui/TransferModal";

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Estados de la Calculadora Bidireccional
  const [isSendingEUR, setIsSendingEUR] = useState(true);
  const [sendAmount, setSendAmount] = useState<string>("100");
  
  // Tasa de cambio dinámica obtenida desde Supabase
 /* const [exchangeRateEURtoPEN, setExchangeRateEURtoPEN] = useState<number>(4.05);
  const [loadingTasa, setLoadingTasa] = useState<boolean>(true);*/
  // Tasas independientes de Compra y Venta sincronizadas con Supabase
  const [buyRate, setBuyRate] = useState<number>(3.76);
  const [sellRate, setSellRate] = useState<number>(3.90);
  const [loadingTasa, setLoadingTasa] = useState<boolean>(true);

  // Estado para controlar la apertura del Modal de Transferencia (CRO UX)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Función centralizada para consultar la tasa activa desde site_config
  const fetchTasaActiva = async () => {
  try {
    const { data, error } = await supabase
      .from("site_config")
      .select("key, value")
      .in("key", ["exchange_rate_buy", "exchange_rate_sell"]);

    if (error) throw error;

    if (data && data.length > 0) {
      data.forEach((item) => {
        const val = Number(item.value);
        if (item.key === "exchange_rate_buy" && val) setBuyRate(val);
        if (item.key === "exchange_rate_sell" && val) setSellRate(val);
      });
    }
  } catch (err) {
    console.error("Error al obtener la tasa desde site_config en el Home:", err);
  } finally {
    setLoadingTasa(false);
  }
};

 // Cargar tasa al montar, al enfocar la pestaña y mediante polling automático en segundo plano
  useEffect(() => {
    fetchTasaActiva();

    // 1. Sincronización automática cuando el usuario regresa a la pestaña del navegador
    const handleFocus = () => {
      fetchTasaActiva();
    };
    window.addEventListener("focus", handleFocus);

    // 2. Escuchar evento personalizado por si están en la misma sesión de SPA
    const handleRateChangeEvent = () => {
      fetchTasaActiva();
    };
    window.addEventListener("rate-updated", handleRateChangeEvent);

    // 3. Polling de seguridad cada 10 segundos para buscar cambios en producción sin recargar
    const intervalId = setInterval(() => {
      fetchTasaActiva();
    }, 10000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("rate-updated", handleRateChangeEvent);
      clearInterval(intervalId);
    };
  }, []);

  const calculateReceive = () => {
  const cleanValue = sendAmount.trim() === "" ? 0 : parseFloat(sendAmount);
  if (isNaN(cleanValue)) return "0.00";

  if (isSendingEUR) {
    // Envía EUR -> Recibe PEN (Se multiplica por la tasa de compra del exchanger)
    return (cleanValue * buyRate).toFixed(2);
  } else {
    // Envía PEN -> Recibe EUR (Se divide entre la tasa de venta)
    return sellRate > 0 ? (cleanValue / sellRate).toFixed(2) : "0.00";
  }
};

  const receiveAmount = calculateReceive();

  useEffect(() => {
    async function getActiveSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoadingAuth(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    }
    getActiveSession();
  }, []);

  const handleToggleCurrency = () => {
  const currentSendVal = parseFloat(sendAmount) || 0;

  if (isSendingEUR) {
    const newPenAmount = (currentSendVal * buyRate).toFixed(2);
    setSendAmount(newPenAmount);
  } else {
    const newEurAmount = sellRate > 0 ? (currentSendVal / sellRate).toFixed(2) : "0.00";
    setSendAmount(newEurAmount);
  }
  setIsSendingEUR(!isSendingEUR);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 scroll-smooth">
      
      {/* HEADER EXACTO */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                VALORA <span className="text-emerald-400">TRANSFER</span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">PERÚ ⇄ ESPAÑA</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#calculadora" className="hover:text-emerald-400 transition-colors">Calculadora</a>
            <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">¿Cómo funciona?</a>
            <a href="#soporte" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Soporte
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!loadingAuth && (
              session ? (
                <a
                  href="/portal-cliente"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs font-bold text-white transition-all flex items-center gap-2 shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mi Portal</span>
                </a>
              ) : (
                <a
                  href="#calculadora"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Iniciar Envío</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Plataforma Financiera Regulada Perú ⇄ España
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            Envía dinero a casa con la <span className="text-emerald-400">tasa real</span> y sin sorpresas.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Transfiere de Euros a Soles (o viceversa) en minutos. Cuentas locales en BCP, Interbank y BBVA con cero comisiones ocultas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Velocidad garantizada</p>
                <p className="text-[11px] text-slate-400">Acreditado de 15 a 30 min.</p>
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
                <p className="text-[11px] text-slate-400">Cuentas BCP e Interbank.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CALCULADORA DE ENVÍOS CONECTADA A SUPABASE */}
        <div id="calculadora" className="lg:col-span-5 bg-[#0b101d] border border-slate-800/80 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative">
          
          <div className="space-y-5">
            {/* Cabecera con Tasa Dinámica en Tiempo Real */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Calculadora de Envíos</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tasa en tiempo real y garantizada</p>
              </div>
              
              <div className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 shadow-inner">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
  <span>
    {loadingTasa 
      ? "Cargando tasa..." 
      : isSendingEUR 
        ? `1 EUR = ${buyRate.toFixed(4)} PEN` 
        : `1 PEN = ${(1 / sellRate).toFixed(4)} EUR`}
  </span>
</div>

            </div>

            {/* Input Origen */}
            <div className="bg-[#070a13] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between focus-within:border-emerald-500/80 transition-colors shadow-sm">
              <div className="space-y-1.5 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                  {isSendingEUR ? "TÚ ENVÍAS DESDE ESPAÑA" : "TÚ ENVÍAS DESDE PERÚ"}
                </label>
                <input 
                  type="text"
                  inputMode="decimal"
                  value={sendAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setSendAmount(val);
                    }
                  }}
                  className="w-full bg-transparent text-white font-mono text-xl sm:text-2xl font-bold focus:outline-none tracking-tight"
                />
              </div>
              <div className="text-emerald-400 font-extrabold text-xs bg-[#0b101d] px-3.5 py-2.5 rounded-xl border border-slate-800 text-center leading-tight shrink-0 ml-3">
                {isSendingEUR ? (
                  <div className="flex flex-col items-center">
                    <span>EUR €</span>
                  </div>
                ) : (
                  <span>PEN S/</span>
                )}
              </div>
            </div>

            {/* BOTÓN DE INVERTIR TASA */}
            <div className="flex justify-center -my-4 relative z-10">
              <button 
                onClick={handleToggleCurrency}
                title="Invertir dirección"
                className="w-8 h-8 rounded-full bg-[#0b101d] border border-slate-800 hover:border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg hover:scale-110 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input Destino */}
            <div className="bg-[#070a13] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="space-y-1.5 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                  {isSendingEUR ? "EL DESTINATARIO RECIBE EN PERÚ" : "EL DESTINATARIO RECIBE EN ESPAÑA"}
                </label>
                <input 
                  disabled
                  type="text"
                  value={receiveAmount}
                  className="w-full bg-transparent text-emerald-400 font-mono text-xl sm:text-2xl font-black focus:outline-none tracking-tight"
                />
              </div>
              <div className="text-emerald-400 font-extrabold text-xs bg-[#0b101d] px-3.5 py-2.5 rounded-xl border border-slate-800 text-center leading-tight shrink-0 ml-3">
                {isSendingEUR ? "PEN S/" : "EUR €"}
              </div>
            </div>

            {/* Detalles de transferencia */}
            <div className="space-y-2 pt-1 text-xs text-slate-400 px-1">
              <div className="flex justify-between">
                <span>Comisión de transferencia:</span>
                <span className="text-emerald-400 font-bold">0.00 EUR (¡Gratis!)</span>
              </div>
              <div className="flex justify-between">
                <span>Tiempo estimado de abono:</span>
                <span className="text-white font-semibold">15 - 30 minutos</span>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <button 
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

      {/* SECCIÓN ¿CÓMO FUNCIONA? */}
      <section id="como-funciona" className="py-20 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-white">¿Cómo funciona Valora Transfer?</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">Envía dinero a tus familiares o cuentas propias en 3 simples pasos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</div>
              <h3 className="text-white font-bold text-base">Cotiza tu envío</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Usa nuestra calculadora para verificar la tasa exacta en tiempo real sin comisiones ocultas.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</div>
              <h3 className="text-white font-bold text-base">Transfiere localmente</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Realiza una transferencia bancaria desde tu cuenta en España o Perú hacia nuestras cuentas autorizadas.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</div>
              <h3 className="text-white font-bold text-base">Dinero acreditado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">El destinatario recibe los fondos directamente en su cuenta bancaria en un rango de 15 a 30 minutos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN SOPORTE */}
      <section id="soporte" className="py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">¿Necesitas ayuda con tu transferencia?</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">Nuestro equipo de soporte técnico y atención al cliente está disponible para ayudarte vía WhatsApp o correo electrónico.</p>
          <a 
            href="https://wa.me/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} VALORA TRANSFER. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL DE TRANSFERENCIA INTEGRADO */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        sendAmount={parseFloat(sendAmount) || 0}
        sendCurrency={isSendingEUR ? "EUR" : "PEN"}
        receiveAmount={receiveAmount}
        receiveCurrency={isSendingEUR ? "PEN" : "EUR"}
        userId={session?.user?.id}
      />
    </div>
  );
}