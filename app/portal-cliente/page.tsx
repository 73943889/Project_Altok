"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  LogOut, 
  Send, 
  Clock, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  PlusCircle 
} from "lucide-react";

export default function PortalClientePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>("Cliente");
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    let channel: any = null;

    async function loadUserData() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profileData && profileData.full_name) {
        setProfileName(profileData.full_name);
      } else if (session.user.user_metadata?.full_name) {
        setProfileName(session.user.user_metadata.full_name);
      }

      const fetchTransfers = async () => {
        const { data: userTransfers, error: err } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", session.user.id) 
          .order("created_at", { ascending: false });

        if (!err && userTransfers) {
          setTransfers(userTransfers); 
        } else {
          setTransfers([]); 
        }
      };

      await fetchTransfers();
      setLoading(false);

      // --- CONFIGURACIÓN OPTIMIZADA DE SUPABASE REALTIME ---
      channel = supabase
        .channel('client-transactions-channel')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', // Escuchamos específicamente actualizaciones del Admin
            schema: 'public',
            table: 'transactions',
          },
          (payload) => {
            console.log("¡Evento Realtime recibido en el cliente!", payload);
            // Si la transacción actualizada pertenece a este usuario, recargamos
            if (payload.new && payload.new.user_id === session.user.id) {
              fetchTransfers();
            }
          }
        )
        .subscribe((status) => {
          console.log("Estado de suscripción Realtime:", status);
        });
    }

    loadUserData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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
      
      {/* Navbar del Portal */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                VALORA <span className="text-emerald-400">TRANSFER</span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">Portal de Cliente</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white">{profileName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Cuenta Verificada KYC
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ¡Hola de nuevo, {profileName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gestiona tus envíos de España a Perú de forma rápida, transparente y segura.
            </p>
          </div>
          <div>
            <a
              href="/#calculadora"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm hover:opacity-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Nuevo Envío
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" /> Historial de Transferencias
          </h2>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
            {transfers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Send className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">Aún no tienes transferencias registradas.</p>
                <a href="/#calculadora" className="text-xs font-semibold text-emerald-400 hover:underline inline-block">Realiza tu primera cotización aquí</a>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    {transfers.map((tx, idx) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py8 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} VALORA TRANSFER. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}