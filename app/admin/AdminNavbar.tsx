"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Sliders, 
  ShieldCheck, 
  ExternalLink, 
  User as UserIcon, 
  LogOut 
} from "lucide-react";

export const AdminNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;

  // Obtener de forma segura el correo del admin autenticado en la sesión actual
  useEffect(() => {
    async function fetchAdminUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
    fetchAdminUser();
  }, []);

  // Función de cierre de sesión seguro
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 mb-8 sticky top-0 z-40 backdrop-blur-xl">
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

        {/* Zona Derecha: Usuario, Logout y Sitio Público */}
        <div className="flex items-center gap-3">
          
          {/* Tarjeta de Identificación del Administrador */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left font-mono">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Admin</p>
              <p className="text-[11px] text-slate-200 max-w-[140px] truncate">{userEmail || "Cargando..."}</p>
            </div>
          </div>

          {/* Botón de Cerrar Sesión */}
          <button
            onClick={handleSignOut}
            title="Cerrar Sesión de Administrador"
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-slate-400 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Acceso Rápido a la Web Principal */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <span>Ver sitio público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </header>
  );
};