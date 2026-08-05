"use client";

import React, { useState, useMemo } from "react";
import { ClientOperation } from "@/src/types/admin";
import { AdminNavbar } from "@/app/admin/AdminNavbar";
import { getTreasuryOperationsAction } from "@/app/actions/treasury";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  Wallet, 
  DollarSign,
  Euro
} from "lucide-react";

export default function TreasuryClient({ initialOperations }: { initialOperations: ClientOperation[] }) {
  const [operations, setOperations] = useState<ClientOperation[]>(initialOperations);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await getTreasuryOperationsAction();
      if (res.success) {
        setOperations(res.operations);
      }
    } catch (err) {
      console.error("Error al refrescar tesorería:", err);
    } finally {
      setLoading(false);
    }
  };

const financialMetrics = useMemo(() => {
    // Normalizamos y filtramos para asegurarnos de capturar las operaciones exitosas o en curso
    const activeOps = operations.filter((o) => {
      const st = (o.status || "").toUpperCase().trim();
      // Incluimos completadas, en proceso o cualquier estado que no sea explícitamente rechazado
      return st !== "RECHAZADO" && st !== "RECHAZADA" && st !== "REJECTED" && st !== "CANCELADO";
    });

    console.log("Operaciones detectadas para tesorería:", activeOps);

    const inflowsEur = activeOps
      .filter((o) => o.send_currency === "EUR")
      .reduce((acc, curr) => acc + Number(curr.send_amount || 0), 0);

    const inflowsUsd = activeOps
      .filter((o) => o.send_currency === "USD")
      .reduce((acc, curr) => acc + Number(curr.send_amount || 0), 0);

    const inflowsPen = activeOps
      .filter((o) => o.send_currency === "PEN")
      .reduce((acc, curr) => acc + Number(curr.send_amount || 0), 0);

    const outflowsPen = activeOps
      .filter((o) => o.receive_currency === "PEN")
      .reduce((acc, curr) => acc + Number(curr.receive_amount || 0), 0);

    const outflowsUsd = activeOps
      .filter((o) => o.receive_currency === "USD")
      .reduce((acc, curr) => acc + Number(curr.receive_amount || 0), 0);

    const outflowsEur = activeOps
      .filter((o) => o.receive_currency === "EUR")
      .reduce((acc, curr) => acc + Number(curr.receive_amount || 0), 0);

    return {
      inflowsEur,
      inflowsUsd,
      inflowsPen,
      outflowsPen,
      outflowsUsd,
      outflowsEur,
      totalProcessed: activeOps.length,
    };
  }, [operations]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-6 space-y-8 pt-6">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                Módulo Financiero
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Flujos de Tesorería y Volumen Operativo
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Control analítico de capital recaudado en origen (Inflow) y capital desembolsado en destino (Outflow).
            </p>
          </div>

          <button
            onClick={fetchOperations}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Sincronizar Datos
          </button>
        </div>

        {/* SECCIÓN 1: INGRESOS EN ORIGEN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Ingresos en Origen (Fondos Recaudados de Clientes)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute right-4 top-4 p-3 rounded-2xl bg-teal-500/10 text-teal-400">
                <Euro className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">RECAUDACIÓN EUR (ORIGEN)</p>
              <p className="text-3xl font-extrabold text-teal-400 font-mono mt-2">
                €{financialMetrics.inflowsEur.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Total pagado por remitentes en cuentas europeas.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute right-4 top-4 p-3 rounded-2xl bg-sky-500/10 text-sky-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">RECAUDACIÓN USD (ORIGEN)</p>
              <p className="text-3xl font-extrabold text-sky-400 font-mono mt-2">
                ${financialMetrics.inflowsUsd.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Total pagado por remitentes en dólares.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute right-4 top-4 p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">RECAUDACIÓN PEN (ORIGEN)</p>
              <p className="text-3xl font-extrabold text-indigo-400 font-mono mt-2">
                S/ {financialMetrics.inflowsPen.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Total pagado en moneda local peruana.</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: ABONOS EN DESTINO */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Abonos en Destino (Desembolsos a Beneficiarios)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute right-4 top-4 p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">DESEMBOLSOS PEN (DESTINO)</p>
              <p className="text-3xl font-extrabold text-indigo-400 font-mono mt-2">
                S/ {financialMetrics.outflowsPen.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Capital requerido/pagado en cuentas bancarias peruanas.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute right-4 top-4 p-3 rounded-2xl bg-sky-500/10 text-sky-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">DESEMBOLSOS USD (DESTINO)</p>
              <p className="text-3xl font-extrabold text-sky-400 font-mono mt-2">
                ${financialMetrics.outflowsUsd.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Total abonado a cuentas en dólares de destino.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute right-4 top-4 p-3 rounded-2xl bg-teal-500/10 text-teal-400">
                <Euro className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">DESEMBOLSOS EUR (DESTINO)</p>
              <p className="text-3xl font-extrabold text-teal-400 font-mono mt-2">
                €{financialMetrics.outflowsEur.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Total abonado en Euros en destino.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}