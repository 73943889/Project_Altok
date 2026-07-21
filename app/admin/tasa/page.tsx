"use client";

import React, { useState, useEffect } from "react";
import { Save, RefreshCw, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { triggerRateUpdate } from "@/lib/rateSync"; // Ajusta la ruta según tu estructura
import { AdminNavbar } from "@/app/admin/AdminNavbar";

export default function AdminTasaPage() {
  const [buyRate, setBuyRate] = useState<string>("4.02");
  const [sellRate, setSellRate] = useState<string>("4.08");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchConfigRates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("site_config")
          .select("key, value")
          .in("key", ["exchange_rate_buy", "exchange_rate_sell"]);

        if (error) throw error;

        if (data) {
          data.forEach((item) => {
            if (item.key === "exchange_rate_buy") setBuyRate(item.value);
            if (item.key === "exchange_rate_sell") setSellRate(item.value);
          });
        }
      } catch (err: any) {
        console.error("Error al obtener las tasas:", err);
        setMessage({ type: "error", text: "No se pudieron cargar las tasas desde Supabase." });
      } finally {
        setLoading(false);
      }
    };

    fetchConfigRates();
  }, []);

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error: errorBuy } = await supabase
        .from("site_config")
        .update({ value: buyRate, updated_at: new Date().toISOString() })
        .eq("key", "exchange_rate_buy");

      if (errorBuy) throw errorBuy;

      const { error: errorSell } = await supabase
        .from("site_config")
        .update({ value: sellRate, updated_at: new Date().toISOString() })
        .eq("key", "exchange_rate_sell");

      if (errorSell) throw errorSell;
        triggerRateUpdate();
      setMessage({ type: "success", text: "¡Tasas de cambio actualizadas y sincronizadas exitosamente!" });
    } catch (err: any) {
      console.error("Error al actualizar:", err);
      setMessage({ type: "error", text: "Hubo un error al guardar los cambios en la base de datos." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Menú de Navegación Superior del Backoffice */}
      <AdminNavbar />

      <div className="max-w-4xl mx-auto px-6 space-y-8">
        
        <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Gestión de Tasas de Cambio
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configura los valores de compra y venta en tiempo real para la calculadora de la plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Supabase Conectado</span>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm border flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSaveRates} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Eur a Soles (Compra)
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  Valor actual para 1 EUR en PEN:
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-mono font-bold">1€ =</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={buyRate}
                    onChange={(e) => setBuyRate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-14 pr-16 text-xl font-bold font-mono text-white outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <span className="absolute right-4 text-emerald-400 font-mono text-sm font-bold">PEN</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Soles a Eur (Venta)
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  Factor referencial de venta o base inversa:
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-mono font-bold">Ref</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={sellRate}
                    onChange={(e) => setSellRate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-14 pr-16 text-xl font-bold font-mono text-white outline-none focus:border-teal-500/50 transition-colors"
                  />
                  <span className="absolute right-4 text-teal-400 font-mono text-sm font-bold">PEN</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Actualizar Tasas en Producción</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}