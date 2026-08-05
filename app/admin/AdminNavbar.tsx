"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import { 
  LayoutDashboard, 
  Sliders, 
  ShieldCheck, 
  ExternalLink, 
  User as UserIcon, 
  LogOut,
  Zap,
  Globe2
} from "lucide-react";

interface AdminNavbarProps {
  userEmail?: string;
}

export const AdminNavbar = ({ userEmail }: AdminNavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 px-6 py-3.5 mb-8 sticky top-0 z-50 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Identidad Textual Enterprise & Módulo Backoffice */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white font-sans">
                  Altok<span className="text-emerald-400">€</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Panel de Control Seguro
              </span>
            </div>
          </Link>
        </div>

        {/* Enlaces de Navegación del Panel (Central) */}
        <nav className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive("/admin")
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Remesas y Operaciones</span>
          </Link>

          <Link
            href="/admin/tasa"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive("/admin/tasa")
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuración de Tasas</span>
          </Link>

          <Link
            href="/admin/treasury"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive("/admin/treasury")
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Tesorería y Liquidez</span>
          </Link>
        </nav>

        {/* Zona Derecha: Usuario, Logout y Sitio Público */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left font-mono">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Sesión Activa</p>
              {/* Dinámico con el correo recibido por prop */}
              <p className="text-[11px] text-slate-200 max-w-[180px] truncate" title={userEmail || "Administrador"}>
                {userEmail || "Administrador"}
              </p>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            title="Ver sitio público"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all group"
          >
            <Globe2 className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Sitio Público</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          <button
            onClick={handleSignOut}
            title="Cerrar Sesión"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-slate-400 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};