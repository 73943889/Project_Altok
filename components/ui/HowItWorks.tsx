import React from "react";
import { Calculator, ShieldCheck, Send } from "lucide-react";

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            ¿Cómo funciona <span className="text-emerald-400">ValoraTransfer</span>?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Envía dinero de España a Perú de forma rápida, segura y con la tasa real del mercado en solo 3 simples pasos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Paso 1 */}
          <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-2xl relative shadow-xl hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
              <Calculator className="w-6 h-6" />
            </div>
            <span className="absolute top-6 right-6 text-slate-800 font-mono text-3xl font-black">01</span>
            <h3 className="text-xl font-bold text-white mb-3">Cotiza al instante</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ingresa el monto que deseas enviar en nuestra calculadora. Verás la tasa de cambio transparente y el monto exacto que recibirá tu destinatario.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-2xl relative shadow-xl hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <span className="absolute top-6 right-6 text-slate-800 font-mono text-3xl font-black">02</span>
            <h3 className="text-xl font-bold text-white mb-3">Realiza la transferencia</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Transfiere desde tu cuenta bancaria en España hacia nuestra cuenta corporativa aliada y sube tu comprobante de pago de forma segura.
            </p>
          </div>

          {/* Paso 3 */}
          <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-2xl relative shadow-xl hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="absolute top-6 right-6 text-slate-800 font-mono text-3xl font-black">03</span>
            <h3 className="text-xl font-bold text-white mb-3">Recibe en Perú</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tu destinatario recibe los fondos directamente en su cuenta bancaria (BCP, BBVA, Interbank) o billetera digital (Yape/Plin) en minutos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};