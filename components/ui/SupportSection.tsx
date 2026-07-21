import React from "react";
import { MessageCircle, Mail, Clock } from "lucide-react";

export const SupportSection = () => {
  return (
    <section id="contacto" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4">
              <Clock className="w-3.5 h-3.5" /> Atención personalizada
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
              ¿Tienes dudas o necesitas ayuda con tu transferencia?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              Nuestro equipo de operaciones está disponible para asistirte en tiempo real durante todo el proceso de envío de tus remesas España ↔ Perú.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">🟢 Operadores en línea</span>
              <span>•</span>
              <span>Respuesta estimada: &lt; 5 min</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 text-sm"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>Chatear por WhatsApp Directo</span>
            </a>

            <a
              href="mailto:soporte@valoratransfer.com"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm"
            >
              <Mail className="w-5 h-5 text-emerald-400" />
              <span>soporte@valoratransfer.com</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};