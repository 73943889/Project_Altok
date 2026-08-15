"use client";

import React from "react";
import { ShieldCheck, Globe, Zap, HeartHandshake, Award, Landmark } from "lucide-react";

export function AboutSection() {
  return (
    <section id="nosotros" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Elementos decorativos de fondo (Glow sutil) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Encabezado de Sección */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Landmark className="w-4 h-4" /> Orgullo Peruano Global
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Conectando tus raíces con <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">el mundo</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed text-justify">
            En <strong className="text-white">Altok€!</strong> somos una fintech peruana enfocada en hacer más simple el cambio de divisas y el envío de dinero.

Permitimos realizar operaciones de forma segura y transparente, con tasas competitivas, entre <span className="text-emerald-400 font-semibold">Perú y España, y Perú y Estados Unidos tanto de ida como de vuelta.</span><br />

 En <strong className="text-white">Altok€!</strong> buscamos que cambiar y enviar dinero sea fácil, rápido y claro, para que nuestros usuarios sepan exactamente cuánto envían, cuánto reciben y a qué tasa se realiza la operación.
          </p>
        </div>

        {/* Tarjetas Principales: Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* Misión */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative group hover:border-emerald-500/40 transition-all shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Nuestra Misión</h3>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              Simplificar la vida financiera de nuestra comunidad global mediante una plataforma digital ágil, sin comisiones ocultas y con depósitos directos a cuentas locales en minutos, garantizando seguridad absoluta en cada transacción.
            </p>
          </div>

          {/* Visión */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative group hover:border-emerald-500/40 transition-all shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Nuestra Visión</h3>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              Consolidarnos como la plataforma fintech de transferencias transfronterizas más confiable y elegida por los peruanos en el mundo, expandiendo nuestra red de valor con tecnología de punta y cumplimiento normativo internacional.
            </p>
          </div>

        </div>

        {/* Bloque de Pilares / Valores (Grid inferior) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1">Regulación y Confianza</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Operamos bajo estrictos estándares de cumplimiento normativo en cada país de operación.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1">Tasa Real Garantizada</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Sin sobreprecios en el tipo de cambio. Lo que ves en nuestra calculadora es lo que llega.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-4 sm:col-span-2 lg:col-span-1">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1">Cercanía con el Migrante</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Entendemos tu esfuerzo porque somos peruanos construyendo soluciones para nuestra gente.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}