"use client";

import React from "react";
import { Building2, Calculator, HelpCircle, Headphones, UserPlus } from "lucide-react";

export function Navbar() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo y Marca */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              VALORA <span className="text-emerald-400">TRANSFER</span>
            </span>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">Perú ⇄ España</p>
          </div>
        </div>

        {/* Enlaces de Navegación Central con Iconos Profesionales */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#calculadora" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer">
            <Calculator className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Calculadora</span>
          </a>
          <a href="#como-funciona" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer">
            <HelpCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>¿Cómo funciona?</span>
          </a>
          <a href="#soporte" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer">
            <Headphones className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Soporte</span>
          </a>
        </nav>

        {/* Botón Registrarme que redirige al login */}
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs sm:text-sm font-extrabold hover:opacity-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 group cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
            <span>Registrarme</span>
          </a>
        </div>

      </div>
    </header>
  );
}