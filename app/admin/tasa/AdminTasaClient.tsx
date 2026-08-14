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

  // 💶 Tasas de Cambio Oficiales
  const [buyRateEur, setBuyRateEur] = useState<string>(getRateValue("exchange_rate_buy", "3.8900"));
  const [sellRateEur, setSellRateEur] = useState<string>(getRateValue("exchange_rate_sell", "3.9500"));
  const [buyRateUsd, setBuyRateUsd] = useState<string>(getRateValue("exchange_rate_buy_usd", "3.7000"));
  const [sellRateUsd, setSellRateUsd] = useState<string>(getRateValue("exchange_rate_sell_usd", "3.8200"));

  // 🏷️ Comisiones independientes
  const [commissionBank, setCommissionBank] = useState<string>(getCommissionValue("transfer_commission_bank", "0.00"));
  const [commissionWallet, setCommissionWallet] = useState<string>(getCommissionValue("transfer_commission_wallet", "0.00"));

  const [savingRates, setSavingRates] = useState<boolean>(false);
  const [savingCommissionBank, setSavingCommissionBank] = useState<boolean>(false);
  const [savingCommissionWallet, setSavingCommissionWallet] = useState<boolean>(false);
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRateChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (val: string) => void
) => {
  // Tomamos únicamente los números que el usuario ha escrito
  let digits = e.target.value.replace(/\D/g, "");

  // Permitir borrar completamente el campo
  if (digits === "") {
    setter("");
    return;
  }

  // Máximo 5 dígitos:
  // 1 antes del decimal + 4 después
  digits = digits.slice(0, 5);

  // Insertar automáticamente el punto después del primer dígito
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

  // Solo números y punto
  val = val.replace(/[^0-9.]/g, "");

  // Si ya tiene punto decimal, no agregar otro
  if (val.includes(".")) {
    const parts = val.split(".");
    if (parts.length > 2) return;

    setter(val);
    return;
  }

  // A partir de 2 dígitos, insertar el punto antes del último dígito
  if (val.length >= 2) {
    val = val.slice(0, -1) + "." + val.slice(-1);
  }

  setter(val);
};

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRates(true);
    setMessage(null);

    try {
      const updates = [
        { key: "exchange_rate_buy", value: parseFloat(buyRateEur) },
        { key: "exchange_rate_sell", value: parseFloat(sellRateEur) },
        { key: "exchange_rate_buy_usd", value: parseFloat(buyRateUsd) },
        { key: "exchange_rate_sell_usd", value: parseFloat(sellRateUsd) },
      ];

      const res = await updateRatesAction(updates);
      if (!res.success) throw new Error(res.error);

      // ⚡ DISPARO LOCAL INMEDIATO (Sincroniza pestañas y ventana activa)
      triggerRateUpdate();

      setMessage({ type: "success", text: "¡Tasas de cambio actualizadas con éxito!" });
    } catch (err: any) {
      setMessage({ type: "error", text: "Error al actualizar las tasas." });
    } finally {
      setSavingRates(false);
    }
  };

  const handleSaveCommissionBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCommissionBank(true);
    setMessage(null);

    try {
      const parsed = parseFloat(Number(commissionBank).toFixed(2));
      if (isNaN(parsed)) throw new Error("Valor inválido.");

      const res = await updateRatesAction([{ key: "transfer_commission_bank", value: parsed }]);
      if (!res.success) throw new Error(res.error);

      // ⚡ DISPARO LOCAL INMEDIATO
      triggerRateUpdate();

      setCommissionBank(parsed.toFixed(2));
      setMessage({ type: "success", text: "¡Comisión para Transferencias Bancarias actualizada con éxito!" });
    } catch (err: any) {
      setMessage({ type: "error", text: "Error al actualizar la comisión bancaria." });
    } finally {
      setSavingCommissionBank(false);
    }
  };

  const handleSaveCommissionWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCommissionWallet(true);
    setMessage(null);

    try {
      const parsed = parseFloat(Number(commissionWallet).toFixed(2));
      if (isNaN(parsed)) throw new Error("Valor inválido.");

      const res = await updateRatesAction([{ key: "transfer_commission_wallet", value: parsed }]);
      if (!res.success) throw new Error(res.error);

      // ⚡ DISPARO LOCAL INMEDIATO
      triggerRateUpdate();

      setCommissionWallet(parsed.toFixed(2));
      setMessage({ type: "success", text: "¡Comisión para Billeteras Digitales actualizada con éxito!" });
    } catch (err: any) {
      setMessage({ type: "error", text: "Error al actualizar la comisión de wallets." });
    } finally {
      setSavingCommissionWallet(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <AdminNavbar userEmail={userEmail} />

      <div className="max-w-4xl mx-auto px-6 space-y-10 mt-8">
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
          <div className={`p-4 rounded-2xl text-sm border flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveRates} className="space-y-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white">Tasas de Cambio Oficiales (EUR / USD ⇄ PEN)</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">EUR a Soles (Compra)</label>
              <input
                type="text"
                inputMode="decimal"
                value={buyRateEur}
                onChange={(e) => handleRateChange(e, setBuyRateEur)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-lg font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Soles a EUR (Venta)</label>
              <input
                type="text"
                inputMode="decimal"
                value={sellRateEur}
                onChange={(e) => handleRateChange(e, setSellRateEur)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-lg font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">USD a Soles (Compra)</label>
              <input
                type="text"
                inputMode="decimal"
                value={buyRateUsd}
                onChange={(e) => handleRateChange(e, setBuyRateUsd)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-lg font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Soles a USD (Venta)</label>
              <input
                type="text"
                inputMode="decimal"
                value={sellRateUsd}
                onChange={(e) => handleRateChange(e, setSellRateUsd)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-lg font-bold font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingRates}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 px-6 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingRates ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Actualizar Tasas</span>
            </button>
          </div>
        </form>

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
                  disabled={savingCommissionBank}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingCommissionBank ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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
                  disabled={savingCommissionWallet}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingCommissionWallet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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