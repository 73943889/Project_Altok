"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock } from "lucide-react";
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import {   LogOut,   Send,   Clock,  CheckCircle2,   User,   ShieldCheck,   Phone,  ChevronDown,  PlusCircle,   Search,  Filter,  Settings,  TrendingUp,  HelpCircle,  ArrowUpRight,  RefreshCw,  ShieldAlert} from "lucide-react";
import { getPortalData, updateUserProfileAndPasswordAction } from "@/app/actions/portalClient";

export default function PortalClientePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // 🛡️ Referencia mutable para que Pusher conozca al usuario sin re-ejecutar el useEffect en bucle
  const userRef = useRef<any>(null);
  userRef.current = user;

const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileName, setProfileName] = useState<string>("Cliente");
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  
  const [countryCodeInput, setCountryCodeInput] = useState("+34");
  const [phoneInput, setPhoneInput] = useState("");

  // Estados de Seguridad y Contraseñas
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [exchangeRates, setExchangeRates] = useState({
    eurToPen: "3.9687",
    usdToPen: "3.6841"
  });

  // 🔒 Función para calcular la fortaleza de la contraseña en tiempo real
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { level: 0, text: "", color: "bg-slate-800" };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    // Validar si solo tiene caracteres especiales
    const hasAlphanumeric = /[a-zA-Z0-9]/.test(pass);
    if (!hasAlphanumeric) {
      return { level: 1, text: "No válida (solo símbolos)", color: "bg-rose-500" };
    }

    if (score <= 2 || pass.length < 8) {
      return { level: 1, text: "Seguridad Baja", color: "bg-rose-500" };
    } else if (score === 3) {
      return { level: 2, text: "Seguridad Media", color: "bg-amber-500" };
    } else {
      return { level: 3, text: "Seguridad Alta", color: "bg-emerald-400" };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSignOut = async () => {
    await logoutAction();
  };

  const fetchPortalData = useCallback(async (isBackground = false) => {
    // 🛡️ Red de seguridad contra bloqueos (Timeout de 6 segundos)
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ [Portal Timeout] La consulta tardó demasiado. Forzando cierre de loader...");
      setLoading(false);
      setRefreshing(false);
    }, 6000);

    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const response = await getPortalData();

      clearTimeout(timeoutId); // Limpiamos el timeout si responde a tiempo

      if (!response || !response.success || !response.user) {
  if (response?.error === "cuenta_inhabilitada") {
    router.push("/login?error=cuenta_inhabilitada");
  } else if (response?.error === "sesion_expulsada") {
    router.push("/login?error=sesion_expulsada");
  } else {
    router.push("/login");
  }
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
        const parts = currentUser.phone.trim().split(" ");
        if (parts.length > 1 && parts[0].startsWith("+")) {
          setCountryCodeInput(parts[0]);
          setPhoneInput(parts.slice(1).join(""));
        } else {
          setPhoneInput(currentUser.phone);
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("❌ Error crítico al sincronizar el portal financiero:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]); // ✅ SOLUCIÓN: Eliminamos 'loading' de las dependencias

  // ⚡ Sincronización en Tiempo Real unificada con Pusher (Transacciones, Seguridad y Tasas)
  useEffect(() => {
    fetchPortalData();

    let pusherClient: Pusher | null = null;
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    if (pusherKey) {
      pusherClient = new Pusher(pusherKey, { cluster: pusherCluster });

      // 1. Canal de Operaciones y Seguridad de Usuario
      const opsChannel = pusherClient.subscribe("operations-channel");

      opsChannel.bind("transaction-updated", (data: any) => {
        console.log("⚡ [Portal Pusher] Transacción actualizada detectada:", data);
        fetchPortalData(true);
      });

      opsChannel.bind("user-status-changed", (data: any) => {
        console.log("🛡️ [Portal Seguridad Pusher] Evento de estado de usuario recibido:", data);
        
        const currentUser = userRef.current;
        if (currentUser && data.userId === currentUser.id && data.is_active === false) {
          console.warn("🚨 Tu cuenta ha sido inhabilitada por un administrador. Cerrando sesión...");
          router.push("/login?error=cuenta_inhabilitada");
        }
      });

      // 2. ⚡ Canal de Tasas de Cambio en Tiempo Real (Misma lógica que la Calculadora)
      const ratesChannel = pusherClient.subscribe("rates-channel");

      ratesChannel.bind("rates-updated", (data: any) => {
        console.log("⚡ [Portal Pusher] Tasas de cambio actualizadas recibidas:", data);
        
        // Si el evento trae el array de actualizaciones, actualizamos el estado inmediatamente
        if (data && Array.isArray(data.updates)) {
          setExchangeRates((prevRates) => {
            let newEur = prevRates.eurToPen;
            let newUsd = prevRates.usdToPen;

            data.updates.forEach((item: { key: string; value: number }) => {
              if (item.key === "exchange_rate_buy") {
                newEur = Number(item.value).toFixed(4);
              }
              if (item.key === "exchange_rate_buy_usd") {
                newUsd = Number(item.value).toFixed(4);
              }
            });

            return { eurToPen: newEur, usdToPen: newUsd };
          });
        } else {
          // Fallback: Si no viene payload formateado, re-consultamos los datos
          fetchPortalData(true);
        }
      });

    } else {
      console.warn("⚠️ NEXT_PUBLIC_PUSHER_KEY no está definida en el cliente.");
    }

    return () => {
      if (pusherClient) {
        pusherClient.unbind_all();
        pusherClient.unsubscribe("operations-channel");
        pusherClient.unsubscribe("rates-channel");
        pusherClient.disconnect();
      }
    };
  }, [fetchPortalData, router]);

  const completedTransfersCount = transfers.filter((tx) => {
    const status = (tx.status || "").toUpperCase();
    return status === "COMPLETADO" || status === "APROBADO";
  }).length;

  const filteredTransfers = transfers.filter((tx) => {
    const code = (tx.operation_code || tx.id || "").toLowerCase();
    const bank = (tx.recipient_bank || tx.bank || "").toLowerCase();
    const matchesSearch = code.includes(searchTerm.toLowerCase()) || bank.includes(searchTerm.toLowerCase());
    
    const status = (tx.status || "PENDIENTE").toUpperCase();
    const matchesStatus = statusFilter === "TODOS" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });


// 🛠️ HELPER: RENDERIZADO DINÁMICO DE OBSERVACIONES Y MOTIVO (CORREGIDO)
  const renderObservationBadge = (tx: any) => {
    const statusUpper = (tx.status || "PENDIENTE").toUpperCase();

    switch (statusUpper) {
      case "PENDIENTE":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
            Pago pendiente de validación
          </span>
        );

      case "EN_PROCESO":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
            En proceso de abono
          </span>
        );

      case "COMPLETADO":
      case "COMPLETADA":
      case "APROBADO":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {tx.internal_notes || "Transacción exitosa"}
          </span>
        );

      case "RECHAZADO":
      case "RECHAZADA":
      case "CANCELADO":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {tx.internal_notes || "Transferencia rechazada"}
          </span>
        );

      default:
        return (
          <span className="text-xs text-slate-500 italic">
            Sin observaciones
          </span>
        );
    }
  };


  if (loading) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-400 font-medium">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Cargando tu portal financiero...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
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
               <span className="hidden sm:inline">Salir</span>
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
                <span className="text-lg font-black text-white">{completedTransfersCount}</span>
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

                        {/* COLUMNA DINÁMICA CON HELPER DE OBSERVACIONES Y COLORES EN TIEMPO REAL */}
<td className="py-4 px-6 font-sans">
  {renderObservationBadge(tx)}
</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MODAL DE CONFIGURACIÓN Y PERFIL DE CLIENTE */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 text-slate-200 shadow-2xl animate-fadeIn my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">Configuración de Perfil y Seguridad</h3>
                </div>
                <button 
                  onClick={() => setIsProfileOpen(false)} 
                  className="text-slate-400 hover:text-white cursor-pointer text-sm font-bold bg-slate-800/60 p-1.5 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setNameError("");
                setPasswordError("");

                const nameRegex = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/;
                if (!nameRegex.test(fullNameInput)) {
                  setNameError("El nombre completo solo debe contener letras y espacios.");
                  return;
                }

                if (newPassword && newPassword.trim() !== "") {
                  if (newPassword.length < 8) {
                    setPasswordError("La contraseña debe tener un mínimo de 8 caracteres.");
                    return;
                  }

                  const hasAlphanumeric = /[a-zA-Z0-9]/.test(newPassword);
                  if (!hasAlphanumeric) {
                    setPasswordError("La contraseña no puede estar compuesta únicamente por símbolos o caracteres especiales.");
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    setPasswordError("Las nuevas contraseñas no coinciden.");
                    return;
                  }
                }

                setUpdatingProfile(true);
                setUpdateSuccess(false);

                try {
                  const fullPhoneNumber = `${countryCodeInput} ${phoneInput.trim()}`;
                  const res = await updateUserProfileAndPasswordAction(
                    fullNameInput, 
                    fullPhoneNumber, 
                    currentPassword || undefined, 
                    newPassword || undefined
                  );

                  if (!res.success || !res.user) {
                    throw new Error(res.error || "Error al actualizar perfil");
                  }

                  setUser(res.user);
                  setProfileName(res.user.full_name);
                  setUpdateSuccess(true);
                  
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");

                  setTimeout(() => {
                    setUpdateSuccess(false);
                    setIsProfileOpen(false);
                  }, 1500);
                } catch (err: any) {
                  console.error("Error al actualizar perfil:", err);
                  setPasswordError(err.message || "Error al actualizar credenciales.");
                } finally {
                  setUpdatingProfile(false);
                }
              }} className="space-y-4">
                
                {/* NOMBRE COMPLETO */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Nombre Completo (Solo letras)
                  </label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, "");
                      setFullNameInput(val);
                      if(nameError) setNameError("");
                    }}
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
                  />
                  {nameError && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-sans">
                      <ShieldAlert className="w-3.5 h-3.5" /> {nameError}
                    </p>
                  )}
                </div>

                {/* TELÉFONO / CELULAR */}
<div className="space-y-1.5">
  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
    CÓDIGO DE PAÍS / TELÉFONO 
  </label>
  <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl focus-within:border-emerald-500 transition-all overflow-hidden shadow-inner">
    
    {/* Contenedor Estilizado del Selector de País */}
    <div className="relative flex items-center border-r border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition-colors">
      <span className="absolute left-3 text-slate-400 pointer-events-none">
        <Phone className="w-4 h-4 text-emerald-400" />
      </span>
      
      <select
  value={countryCodeInput}
  onChange={(e) => setCountryCodeInput(e.target.value)}
  className="bg-transparent text-emerald-400 text-xs font-bold pl-9 pr-7 py-3.5 outline-none cursor-pointer appearance-none z-10 font-mono"
>
        <option value="+51" className="bg-slate-900 text-white py-2">PE +51</option>
        <option value="+34" className="bg-slate-900 text-white py-2">ES +34</option>
        <option value="+1"  className="bg-slate-900 text-white py-2">US +1</option>
      </select>

      {/* Flecha personalizada */}
      <span className="absolute right-2.5 text-slate-500 pointer-events-none">
        <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
      </span>
    </div>

    {/* Input de Número Teléfonico */}
    <input
      type="text"
      inputMode="numeric"
      placeholder="987 654 321"
      value={phoneInput}
      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
      required
      className="w-full bg-transparent text-white text-xs font-mono px-4 py-3.5 outline-none placeholder:text-slate-600"
    />
  </div>
</div>

                {/* CORREO ELECTRÓNICO */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Correo Electrónico (No modificable)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>

                {/* SECCIÓN DE CAMBIO DE CONTRASEÑA */}
<div className="pt-3 border-t border-slate-800 space-y-3">
  <p className="text-xs font-bold text-emerald-400">Seguridad: Cambiar Contraseña</p>
  
  {/* Contraseña Actual */}
  <div>
    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
      Contraseña Actual (Requerida si deseas cambiar clave)
    </label>
    <div className="relative flex items-center bg-slate-950 border border-slate-700 rounded-xl focus-within:border-emerald-500 transition-all overflow-hidden shadow-inner">
      <input
        type={showCurrentPassword ? "text" : "password"}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="••••••••"
        className="w-full bg-transparent px-3.5 py-2 pr-10 text-xs text-white outline-none font-mono"
      />
      <button
        type="button"
        onClick={() => setShowCurrentPassword((prev) => !prev)}
        className="absolute right-2.5 text-slate-500 hover:text-emerald-400 focus:text-emerald-400 transition-colors outline-none cursor-pointer p-1 rounded-lg"
        aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
      >
        {showCurrentPassword ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  </div>

  {/* Nueva Contraseña y Confirmar Clave */}
  <div className="grid grid-cols-2 gap-2">
    
    {/* Nueva Contraseña */}
    <div>
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        Nueva Contraseña
      </label>
      <div className="relative flex items-center bg-slate-950 border border-slate-700 rounded-xl focus-within:border-emerald-500 transition-all overflow-hidden shadow-inner">
        <input
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          placeholder="Mín. 8 caracteres"
          className="w-full bg-transparent px-3.5 py-2 pr-9 text-xs text-white outline-none font-mono"
        />
        <button
          type="button"
          onClick={() => setShowNewPassword((prev) => !prev)}
          className="absolute right-2 text-slate-500 hover:text-emerald-400 focus:text-emerald-400 transition-colors outline-none cursor-pointer p-1 rounded-lg"
          aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
        >
          {showNewPassword ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>

    {/* Confirmar Clave */}
    <div>
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        Confirmar Clave
      </label>
      <div className="relative flex items-center bg-slate-950 border border-slate-700 rounded-xl focus-within:border-emerald-500 transition-all overflow-hidden shadow-inner">
        <input
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          placeholder="Repetir clave"
          className="w-full bg-transparent px-3.5 py-2 pr-9 text-xs text-white outline-none font-mono"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="absolute right-2 text-slate-500 hover:text-emerald-400 focus:text-emerald-400 transition-colors outline-none cursor-pointer p-1 rounded-lg"
          aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
        >
          {showConfirmPassword ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>

  </div>

  {/* Medidor de Fuerza de Contraseña */}
  {newPassword.length > 0 && (
    <div className="space-y-1 pt-1">
      <div className="flex gap-1 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${passwordStrength.level >= 1 ? passwordStrength.color : 'bg-slate-800'} w-1/3`} />
        <div className={`h-full transition-all duration-300 ${passwordStrength.level >= 2 ? passwordStrength.color : 'bg-slate-800'} w-1/3`} />
        <div className={`h-full transition-all duration-300 ${passwordStrength.level >= 3 ? passwordStrength.color : 'bg-slate-800'} w-1/3`} />
      </div>
      <p className="text-[10px] font-mono flex justify-between text-slate-400">
        <span>Nivel: <strong className={passwordStrength.level === 3 ? "text-emerald-400" : passwordStrength.level === 2 ? "text-amber-400" : "text-rose-400"}>{passwordStrength.text}</strong></span>
        <span>Mín. 8 caracteres (Letras, Números y Símbolos)</span>
      </p>
    </div>
  )}

  {/* Mensaje de Error */}
  {passwordError && (
    <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans mt-2 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
      <ShieldAlert className="w-4 h-4 shrink-0" /> {passwordError}
    </p>
  )}
</div>

                {updateSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
                    ¡Perfil y contraseña actualizados con éxito! ✓
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {updatingProfile ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} Altok€. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}