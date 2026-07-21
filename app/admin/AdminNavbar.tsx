"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sliders, ShieldCheck, ExternalLink } from "lucide-react";

export const AdminNavbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Identidad del Backoffice */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            VT
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">
              ValoraTransfer Admin
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Panel de Control Seguro
            </p>
          </div>
        </div>

        {/* Enlaces de Navegación del Panel */}
        <nav className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive("/admin")
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Remesas y Operaciones</span>
          </Link>

          <Link
            href="/admin/tasa"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive("/admin/tasa")
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuración de Tasas</span>
          </Link>
        </nav>

        {/* Acceso Rápido a la Web Principal */}
        <div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <span>Ver sitio público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </header>
  );
};