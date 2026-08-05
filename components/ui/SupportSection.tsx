"use client";

import React from "react";
import { Headphones, MessageSquareText, Mail, Clock, ShieldAlert, ExternalLink } from "lucide-react";

export function SupportSection() {
  return (
    <section id="soporte" className="py-10 bg-slate-950 relative overflow-hidden">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Encabezado de la Sección */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <Headphones className="w-3 h-3" /> Centro de Atención al Cliente
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            ¿Necesitas ayuda con <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">tu transferencia?</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Nuestro equipo de soporte especializado está disponible para acompañarte en cada paso desde España, Estados Unidos y Perú.
          </p>
        </div>

        {/* Tarjetas de Canales de Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 max-w-4xl mx-auto">
          
          {/* Canal WhatsApp */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                <MessageSquareText className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">WhatsApp Prioritario</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-5">
                Respuesta inmediata para consultas sobre estado de transferencias, comprobantes y validaciones de tasas.
              </p>
            </div>
            
            <a 
              href="https://wa.me/51987408496" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer group/btn"
            >
              <span>Chatear por WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Canal Correo Electrónico */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Soporte por Correo</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-5">
                Ideal para envío de documentación formal, aclaración de cuentas corporativas y temas de cumplimiento KYC.
              </p>
            </div>

            <a 
              href="mailto:soporte@altoktransfer.com" 
              className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-extrabold text-xs hover:bg-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer group/btn"
            >
              <span>soporte@altoktransfer.com</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/btn:translate-x-0.5 transition-transform" />
            </a>
          </div>

        </div>

        {/* Información Adicional de Horarios y Seguridad */}
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-slate-900/30 border border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mx-auto sm:mx-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Horario de Atención Continuo</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Lunes a Domingo: 8:00 a.m. - 10:00 p.m. (Hora Perú / España)</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mx-auto sm:mx-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Canales Oficiales</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Nunca solicitamos contraseñas ni claves por chat.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}