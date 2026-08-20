"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calculator, HelpCircle, Headphones, Building2, User, UserPlus, ShieldAlert } from "lucide-react";

interface NavbarProps {
  session: any;
  profileName: string;
  loadingAuth?: boolean;
}

export function Navbar({ session, profileName, loadingAuth = false }: NavbarProps) {
  // Extracción robusta compatible tanto con el viejo esquema como con el nuevo JWT o datos directos
  const userEmail = session?.user?.email || session?.email || "";
  const userRole = session?.user?.role || session?.role || "client";
  const isAdmin = userEmail === "terry@gmail.com" || userRole === "admin" || userEmail.toLowerCase().includes("admin");

return (
<header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
  <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    
    {/* Logo Corporativo Optimizado */}
    <Link 
      href="/" 
      className="group flex items-center shrink-0 select-none outline-none"
      aria-label="Ir al inicio de Altok€!"
    >
      <Image
        src="/logo.webp" /* Cambia a .webp si lo exportaste en ese formato */
        alt="Altok€! Envíos rápidos y seguros"
        width={350}
        height={90} /* Proporción real de tu nuevo recorte */
        priority
        /* 
          Al no tener espacios vacíos, una altura de 48px a 64px (h-12 a h-16) 
          se verá grande, nítida y perfectamente alineada.
        */
        className="w-auto h-12 sm:h-14 md:h-16 object-contain mix-blend-screen transition-all duration-300 group-hover:brightness-110"
      />
    </Link>

        {/* Enlaces de Navegación Central */}
        <nav className="hidden md:flex items-center gap-8 text-base font-semibold text-slate-200">
          <a href="/#calculadora" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer">
            <Calculator className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Calculadora</span>
          </a>
          <a href="/#nosotros" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer">
            <Building2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Nosotros</span>
          </a>
          <a href="/#como-funciona" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer">
            <HelpCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>¿Cómo funciona?</span>
          </a>
          <a href="/#soporte" className="hover:text-emerald-400 transition-colors flex items-center gap-2 group cursor-pointer">
            <Headphones className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Soporte</span>
          </a>
        </nav>

        {/* Acciones de Usuario y Accesos Rápidos */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Botón Admin Unificado */}
          {!loadingAuth && session && isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/50 text-xs text-slate-200 hover:border-emerald-400 hover:bg-slate-900 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer group"
              title="Panel de Control Administrativo"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[9px] text-emerald-400 block leading-tight uppercase tracking-wider font-bold">Gestión</span>
                <span className="font-bold text-white block leading-tight">Panel Admin</span>
              </div>
            </Link>
          )}

          {/* Botón Mi Portal o Acceder */}
          {!loadingAuth && session ? (
            <Link
              href="/portal-cliente"
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs text-slate-200 hover:border-emerald-500 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-[9px] text-slate-400 block leading-tight uppercase tracking-wider">Mi Portal</span>
                <span className="font-bold text-white truncate max-w-[120px] sm:max-w-[150px] block leading-tight">{profileName || "Cliente"}</span>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs hover:opacity-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>Acceder / Registrarme</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}