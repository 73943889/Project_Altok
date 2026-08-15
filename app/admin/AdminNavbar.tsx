"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { 
  LayoutDashboard, 
  Sliders, 
  Landmark, 
  Users, 
  ExternalLink, 
  User as UserIcon, 
  LogOut,
  Zap,
  Globe2,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";

interface AdminNavbarProps {
  userEmail?: string;
}

export const AdminNavbar = ({ userEmail }: AdminNavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
  await logoutAction();
};

  const navLinks = [
    { href: "/admin", label: "Remesas y Operaciones", icon: LayoutDashboard },
    { href: "/admin/tasa", label: "Configuración de Tasas", icon: Sliders },
    { href: "/admin/treasury", label: "Tesorería y Liquidez", icon: Landmark },
    { href: "/admin/users", label: "Usuarios y Roles", icon: Users },
  ];

  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 px-4 md:px-6 py-3.5 mb-8 sticky top-0 z-50 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Identidad Textual Enterprise & Módulo Backoffice */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
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
              <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Panel de Control Seguro
              </span>
            </div>
          </Link>
        </div>

        {/* Enlaces de Navegación de Escritorio (Desktop Navigation) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Zona Derecha: Usuario, Logout, Sitio Público y Botón Hamburguesa Móvil */}
        <div className="flex items-center gap-2.5">
          
          {/* Badge de Sesión (Oculto en pantallas muy pequeñas, visible en sm+) */}
          <div className="hidden md:flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left font-mono">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Sesión</p>
              <p className="text-[11px] text-slate-200 max-w-[140px] truncate" title={userEmail || "Administrador"}>
                {userEmail || "Admin"}
              </p>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            title="Ver sitio público"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all group"
          >
            <Globe2 className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="hidden sm:inline">Web</span>
            <ExternalLink className="w-3 h-3 text-slate-500 hidden sm:inline" />
          </Link>

           <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-2 cursor-pointer"
            >
               <span className="hidden sm:inline">Salir</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>

          {/* Botón Menú Hamburguesa Móvil */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Menú Desplegable Vertical Móvil (Responsive drawer) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/60 mb-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <UserIcon className="w-3 h-3" />
            </div>
            <span className="text-[11px] text-slate-300 truncate font-mono">{userEmail || "Administrador"}</span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-300 bg-slate-900/60 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};