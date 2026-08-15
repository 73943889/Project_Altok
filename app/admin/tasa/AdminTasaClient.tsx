"use client";

import React, { useState } from "react";
import { Save, RefreshCw, ShieldCheck, TrendingUp, Percent, Wallet, Building2 } from "lucide-react";
import { updateRatesAction } from "@/app/actions/rates";
import { AdminNavbar } from "@/app/admin/AdminNavbar";
import { triggerRateUpdate } from "@/lib/rateSync";

export default function AdminTasaClient({ initialRates, userEmail }: { initialRates: any[]; userEmail?: string }) {
  const getRateValue = (key: string, fallback: string) => {
    const found = initialRates.find((r) => r.key === key);
    if (!found || found.value === null || found.value === undefined) return fallback;
    const num = Number(found.value);
    return isNaN(num) ? fallback : num.toFixed(4);
  };

  const getCommissionValue = (key: string, fallback: string) => {
    const found = initialRates.find((r) => r.key === key);
    if (!found || found.value === null || found.value === undefined) return fallback;
    const num = Number(found.value);
    return isNaN(num) ? fallback : num.toFixed(2);
  };

  // 💶 Estados independientes para las 4 Tasas de Cambio Oficiales
  const [buyRateEur, setBuyRateEur] = useState<string>(getRateValue("exchange_rate_buy", "3.8900"));
  const [sellRateEur, setSellRateEur] = useState<string>(getRateValue("exchange_rate_sell", "3.9500"));
  const [buyRateUsd, setBuyRateUsd] = useState<string>(getRateValue("exchange_rate_buy_usd", "3.7000"));
  const [sellRateUsd, setSellRateUsd] = useState<string>(getRateValue("exchange_rate_sell_usd", "3.8200"));

  // 🏷️ Comisiones independientes
  const [commissionBank, setCommissionBank] = useState<string>(getCommissionValue("transfer_commission_bank", "0.00"));
  const [commissionWallet, setCommissionWallet] = useState<string>(getCommissionValue("transfer_commission_wallet", "0.00"));

  // ⚡ Estado para saber qué campo específico se está guardando
  const [savingKey, setSavingKey] = useState<string | null>(null);
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    let digits = e.target.value.replace(/\D/g, "");

    if (digits === "") {
      setter("");
      return;
    }

    digits = digits.slice(0, 5);

    if (digits.length === 1) {
      setter(digits);
    } else {
      setter(`${digits[0]}.${digits.slice(1)}`);
    }
  };

  const handleCommissionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    let val = e.target.value.replace(/,/g, ".");

    if (val === "") {
      setter("");
      return;
    }

    val = val.replace(/[^0-9.]/g, "");

    if (val.includes(".")) {
      const parts = val.split(".");
      if (parts.length > 2) return;
      setter(val);
      return;
    }

    if (val.length >= 2) {
      val = val.slice(0, -1) + "." + val.slice(-1);
    }

    setter(val);
  };

  // ⚡ GUARDADO ATÓMICO DE TASA INDIVIDUAL
  const handleSaveSingleRate = async (key: string, valueStr: string, label: string) => {
    setSavingKey(key);
    setMessage(null);

    try {
      const parsedValue = parseFloat(valueStr);
      if (isNaN(parsedValue)) throw new Error("Valor numérico no válido.");

      // Envia un arreglo con UN SOLO ELEMENTO para registrar 1 sola fila en auditoría
      const res = await updateRatesAction([{ key, value: parsedValue }]);
      if (!res.success) throw new Error(res.error);

      // Disparo de sincronización inmediata
      triggerRateUpdate();

      setMessage({ type: "success", text: `¡${label} actualizada con éxito!` });
    } catch (err: any) {
      setMessage({ type: "error", text: `Error al actualizar ${label}: ${err.message}` });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveCommissionBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey("transfer_commission_bank");
    setMessage(null);

    try {
      const parsed = parseFloat(Number(commissionBank).toFixed(2));
      if (isNaN(parsed)) throw new Error("Valor inválido.");

      const res = await updateRatesAction([{ key: "transfer_commission_bank", value: parsed }]);
      if (!res.success) throw new Error(res.error);

      triggerRateUpdate();

      setCommissionBank(parsed.toFixed(2));
      setMessage({ type: "success", text: "¡Comisión para Transferencias Bancarias actualizada con éxito!" });
    } catch (err: any) {
      setMessage({ type: "error", text: "Error al actualizar la comisión bancaria." });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveCommissionWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey("transfer_commission_wallet");
    setMessage(null);

    try {
      const parsed = parseFloat(Number(commissionWallet).toFixed(2));
      if (isNaN(parsed)) throw new Error("Valor inválido.");

      const res = await updateRatesAction([{ key: "transfer_commission_wallet", value: parsed }]);
      if (!res.success) throw new Error(res.error);

      triggerRateUpdate();

      setCommissionWallet(parsed.toFixed(2));
      setMessage({ type: "success", text: "¡Comisión para Billeteras Digitales actualizada con éxito!" });
    } catch (err: any) {
      setMessage({ type: "error", text: "Error al actualizar la comisión de wallets." });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <AdminNavbar userEmail={userEmail} />

      <div className="max-w-4xl mx-auto px-6 space-y-8 mt-8">
        <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Gestión de Tasas y Comisiones
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configura las tasas de cambio del sistema y las comisiones diferenciadas por canal de pago.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Servidor Conectado</span>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm border flex items-center gap-3 animate-fadeIn ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            <span>{message.text}</span>
          </div>
        )}

        {/* CONTENEDOR DE TASAS DE CAMBIO OFICIALES (CAMPOS CON GUARDADO ATÓMICO INDEPENDIENTE) */}
        <div className="space-y-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white">Tasas de Cambio Oficiales (EUR / USD ⇄ PEN)</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Actualización individual</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. EUR A SOLES (COMPRA) */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSingleRate("exchange_rate_buy", buyRateEur, "Tasa EUR a Soles (Compra)");
              }}
              className="space-y-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4 transition-all hover:border-slate-700/80"
            >
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                EUR a Soles (Compra)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={buyRateEur}
                onChange={(e) => handleRateChange(e, setBuyRateEur)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-base font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingKey === "exchange_rate_buy"}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingKey === "exchange_rate_buy" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar EUR Compra</span>
                </button>
              </div>
            </form>

            {/* 2. SOLES A EUR (VENTA) */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSingleRate("exchange_rate_sell", sellRateEur, "Tasa Soles a EUR (Venta)");
              }}
              className="space-y-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4 transition-all hover:border-slate-700/80"
            >
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Soles a EUR (Venta)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={sellRateEur}
                onChange={(e) => handleRateChange(e, setSellRateEur)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-base font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingKey === "exchange_rate_sell"}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingKey === "exchange_rate_sell" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar EUR Venta</span>
                </button>
              </div>
            </form>

            {/* 3. USD A SOLES (COMPRA) */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSingleRate("exchange_rate_buy_usd", buyRateUsd, "Tasa USD a Soles (Compra)");
              }}
              className="space-y-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4 transition-all hover:border-slate-700/80"
            >
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                USD a Soles (Compra)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={buyRateUsd}
                onChange={(e) => handleRateChange(e, setBuyRateUsd)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-base font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingKey === "exchange_rate_buy_usd"}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingKey === "exchange_rate_buy_usd" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar USD Compra</span>
                </button>
              </div>
            </form>

            {/* 4. SOLES A USD (VENTA) */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSingleRate("exchange_rate_sell_usd", sellRateUsd, "Tasa Soles a USD (Venta)");
              }}
              className="space-y-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4 transition-all hover:border-slate-700/80"
            >
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Soles a USD (Venta)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={sellRateUsd}
                onChange={(e) => handleRateChange(e, setSellRateUsd)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-base font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingKey === "exchange_rate_sell_usd"}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingKey === "exchange_rate_sell_usd" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar USD Venta</span>
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* COMISIONES DE TRANSFERENCIA */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-8">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Percent className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Configuración de Comisiones de Transferencia</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleSaveCommissionBank} className="space-y-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Transferencias Bancarias</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monto Comisión Banco (Ej. 0.00)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  maxLength={6}
                  value={commissionBank}
                  onChange={(e) => handleCommissionChange(e, setCommissionBank)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-base font-bold font-mono text-white outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="submit"
                  disabled={savingKey === "transfer_commission_bank"}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingKey === "transfer_commission_bank" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Actualizar Comisión Banco</span>
                </button>
              </div>
            </form>

            <form onSubmit={handleSaveCommissionWallet} className="space-y-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Billeteras Digitales (Wallets)</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monto Comisión Wallet (Ej. 0.00)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  maxLength={6}
                  value={commissionWallet}
                  onChange={(e) => handleCommissionChange(e, setCommissionWallet)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-base font-bold font-mono text-white outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="submit"
                  disabled={savingKey === "transfer_commission_wallet"}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingKey === "transfer_commission_wallet" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Actualizar Comisión Wallet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}