"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Phone, Landmark } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              VALORA <span className="text-emerald-400">TRANSFER</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1 tracking-widest uppercase font-mono">
              Perú ↔ España
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="#calculadora" className="hover:text-emerald-400 transition-colors">Calculadora</Link>
          <Link href="#como-funciona" className="hover:text-emerald-400 transition-colors">¿Cómo funciona?</Link>
          <Link href="#contacto" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-400" /> Soporte
          </Link>
        </nav>

        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
        >
          <span>Iniciar Envío</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};