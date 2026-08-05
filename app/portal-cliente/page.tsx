"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Send, 
  Clock, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  PlusCircle, 
  Search,
  Filter,
  Settings,
  X,
  Save,
  Check,
  TrendingUp,
  HelpCircle,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { getPortalData } from "@/app/actions/portalClient";

export default function PortalClientePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>("Cliente");
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de control para filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Estados para el Modal de Configuración / Perfil
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Estado dinámico para las tasas de cambio
  const [exchangeRates, setExchangeRates] = useState({
    eurToPen: "3.9687",
    usdToPen: "3.6841"
  });

const handleSignOut = async () => {
    await logoutAction();
  };

  const fetchPortalData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const response = await getPortalData();

      if (!response.success || !response.user) {
        router.push("/login");
        return;
      }

      const currentUser = response.user;
      setUser(currentUser);
      setTransfers(response.transactions || []);

      if (response.siteConfig && response.siteConfig.length > 0) {
        let eurValue = "3.9688";
        let usdValue = "3.6845";

        response.siteConfig.forEach((row: any) => {
          if (row.key === "exchange_rate_buy" && row.value) {
            eurValue = Number(row.value).toFixed(4);
          }
          if (row.key === "exchange_rate_buy_usd" && row.value) {
            usdValue = Number(row.value).toFixed(4);
          }
        });

        setExchangeRates({
          eurToPen: eurValue,
          usdToPen: usdValue
        });
      }

      if (currentUser.full_name) {
        setProfileName(currentUser.full_name);
        setFullNameInput(currentUser.full_name);
      }
      if (currentUser.phone) {
        setPhoneInput(currentUser.phone);
      }
    } catch (err) {
      console.error("❌ Error al sincronizar el portal:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // Carga inicial y sincronización en tiempo real basada en SSE (Server-Sent Events)
  useEffect(() => {
    fetchPortalData(false);

    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = async (event) => {
      if (
        event.data === 'ping' || 
        event.data === 'connected' || 
        event.data === 'update' || 
        event.data.startsWith('update:')
      ) {
        console.log("⚡ Señal SSE recibida! Actualizando datos...");
        // 1. Traemos la data fresca
        await fetchPortalData(true);
        // 2. FUNDAMENTAL: Obligamos a Next.js a destruir su caché visual del lado del cliente
        router.refresh(); 
      }
    };

    eventSource.onerror = (err) => {
      console.error("⚠️ Error SSE. Reconectando...", err);
      eventSource.close();
      // Pequeño timeout para reconectar automáticamente si se cae la conexión
      setTimeout(() => fetchPortalData(true), 5000); 
    };

    const handleFocus = () => {
      fetchPortalData(true);
      router.refresh();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      eventSource.close();
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchPortalData, router]);

  const handleLogout = async () => {
    document.cookie = "auth_token=; path=/; max-age=0;";
    router.push("/login");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    setUpdateSuccess(false);

    try {
      setProfileName(fullNameInput);
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setIsProfileOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      alert("Hubo un error al actualizar tus datos.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Filtrado de transferencias en memoria local (Frontend puro)
  const filteredTransfers = transfers.filter((tx) => {
    const code = (tx.operation_code || tx.id || "").toLowerCase();
    const bank = (tx.recipient_bank || tx.bank || "").toLowerCase();
    const matchesSearch = code.includes(searchTerm.toLowerCase()) || bank.includes(searchTerm.toLowerCase());
    
    const status = (tx.status || "PENDIENTE").toUpperCase();
    const matchesStatus = statusFilter === "TODOS" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-400 font-medium">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Cargando tu portal financiero...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Header Corporativo */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-90 py-1" aria-label="Ir al inicio">
              <div className="relative flex items-center">
                <Image
                  src="/logo.png"
                  alt="Altok€!"
                  width={240}
                  height={80}
                  priority
                  className="object-contain w-auto h-14 sm:h-16 md:h-[4.5rem]"
                />
              </div>
            </Link>
            <div className="hidden sm:block h-8 w-px bg-slate-800" />
            <div>
              <p className="text-[11px] text-slate-400 tracking-widest uppercase font-semibold">Portal de Cliente</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPortalData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Sincronizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-emerald-500/50 transition-all shadow-sm cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white">{profileName}</span>
              <Settings className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </button>
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Banner de Bienvenida */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Cuenta Verificada KYC
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ¡Hola de nuevo, {profileName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gestiona tus envíos de España y Estados Unidos a Perú de forma rápida, transparente y segura.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.href = "/#calculadora"; }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm hover:opacity-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Nuevo Envío
            </button>
          </div>
        </div>

        {/* Módulos Estratégicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tasas de Referencia</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono animate-pulse">
                <TrendingUp className="w-3 h-3" /> En vivo
              </span>
            </div>
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/50">
                <span className="text-xs text-slate-400">1 EUR ➔ PEN</span>
                <span className="text-sm font-bold text-emerald-400">{exchangeRates.eurToPen} S/.</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/50">
                <span className="text-xs text-slate-400">1 USD ➔ PEN</span>
                <span className="text-sm font-bold text-emerald-400">{exchangeRates.usdToPen} S/.</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 text-center">Tasa garantizada sin comisiones ocultas.</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Actividad del Mes</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center my-auto">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/50">
                <span className="text-xs text-slate-400 block mb-1">Envíos Realizados</span>
                <span className="text-lg font-black text-white">{transfers.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/50">
                <span className="text-xs text-slate-400 block mb-1">Velocidad Abono</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-1 block">&lt; 5 min</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-4 text-center block">Transacciones 100% cifradas y seguras</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Soporte Altok€!</span>
              <HelpCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-300">¿Tienes dudas con la validación de tu voucher o abono?</p>
              <a 
                href="https://wa.me/51987408496" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Chat con Asesor VIP</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <span className="text-[10px] text-slate-500 mt-4 text-center">Atención Lunes a Domingo</span>
          </div>
        </div>

        {/* Historial de Transferencias */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" /> Historial de Transferencias
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por ID o banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>

              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-sans appearance-none cursor-pointer"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
            {filteredTransfers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Send className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No se encontraron transferencias con los criterios indicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/40">
                      <th className="py-4 px-6">ID / Fecha</th>
                      <th className="py-4 px-6">Envíos</th>
                      <th className="py-4 px-6">Destino Recibe</th>
                      <th className="py-4 px-6">Banco Destino</th>
                      <th className="py-4 px-6">Estado</th>
                      <th className="p-4">Observaciones / Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    {filteredTransfers.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-white block">{tx.operation_code || tx.id}</span>
                          <span className="text-[10px] text-slate-500">{new Date(tx.created_at || Date.now()).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-white">
                          {tx.send_amount} {tx.send_currency || "EUR"}
                        </td>
                        <td className="py-4 px-6 text-emerald-400 font-bold">
                          {tx.receive_amount} {tx.receive_currency || "PEN"}
                        </td>
                        <td className="py-4 px-6 text-slate-400">
                          {tx.recipient_bank || tx.bank || "BCP / Interbank"}
                        </td>
                        <td className="py-4 px-6">
                          {(() => {
                            const status = (tx.status || "PENDIENTE").toUpperCase();
                            let badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                            
                            if (status === "COMPLETADO" || status === "APROBADO") {
                              badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                            } else if (status === "RECHAZADO" || status === "CANCELADO") {
                              badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                            } else if (status === "EN_PROCESO") {
                              badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                            }

                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold border ${badgeStyle}`}>
                                <CheckCircle2 className="w-3.5 h-3.5" /> {status}
                              </span>
                            );
                          })()}
                        </td>

                        {/* 🛡️ NUEVA CELDA: Muestra el motivo del rechazo o nota interna */}
                        <td className="py-4 px-6 font-sans">
                          {tx.internal_notes ? (
                            <span 
                              className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium max-w-xs truncate ${
                                (tx.status || "").toUpperCase() === "RECHAZADO" || (tx.status || "").toUpperCase() === "CANCELADO"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                                  : "bg-slate-800/60 text-slate-300 border border-slate-700/50"
                              }`} 
                              title={tx.internal_notes}
                            >
                              {tx.internal_notes}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px] italic">Sin observaciones</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer corporativo */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} Altok€. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}