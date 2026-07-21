"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { CurrencyCalculator } from "@/components/ui/CurrencyCalculator";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { SupportSection } from "@/components/ui/SupportSection";
import { TransferModal } from "@/components/ui/TransferModal";
import { ShieldCheck, Zap, Lock, Building2 } from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    amount: 100,
    sendCurrency: "EUR" as "EUR" | "PEN",
    receiveAmount: 403,
    receiveCurrency: "PEN" as "EUR" | "PEN",
  });

  useEffect(() => {
    // Escucha el evento personalizado emitido por CurrencyCalculator
    const handleOpenFlow = (e: any) => {
      if (e.detail) {
        setTransferData({
          amount: e.detail.amount,
          sendCurrency: e.detail.from,
          receiveAmount: e.detail.receive,
          receiveCurrency: e.detail.to,
        });
      }
      setIsModalOpen(true);
    };

    window.addEventListener("open-transfer-flow", handleOpenFlow as EventListener);
    return () => {
      window.removeEventListener("open-transfer-flow", handleOpenFlow as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* Sección Hero & Calculadora Principal */}
        <section id="calculadora" className="relative pt-12 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Plataforma Financiera Perú ↔ España</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                  Envía dinero a casa con la <span className="text-emerald-400">tasa real</span> y sin sorpresas.
                </h1>

                <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0">
                  Transfiere de Euros a Soles (o viceversa) en minutos. Cuentas locales en BCP, Interbank y BBVA con cero comisiones ocultas.
                </p>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-slate-900">
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-white">Velocidad garantizada</h3>
                      <p className="text-[11px] text-slate-400">Acreditado de 15 a 30 min.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-white">Verificación KYC</h3>
                      <p className="text-[11px] text-slate-400">Cumplimiento SBS/SEPBLAC.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-white">Banca Directa</h3>
                      <p className="text-[11px] text-slate-400">Cuentas BCP e Interbank.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 w-full">
                <CurrencyCalculator />
              </div>

            </div>
          </div>
        </section>

        {/* Sección: ¿Cómo funciona? */}
        <HowItWorks />

        {/* Sección: Soporte y Contacto */}
        <SupportSection />
      </main>

      {/* Modal de Transferencia Integrado y Reactivo */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sendAmount={transferData.amount}
        sendCurrency={transferData.sendCurrency}
        receiveAmount={transferData.receiveAmount}
        receiveCurrency={transferData.receiveCurrency}
      />

      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} VALORA TRANSFER. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}