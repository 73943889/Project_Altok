"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { requestPasswordResetAction } from "@/app/actions/auth";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await requestPasswordResetAction(email);
      if (!res.success) {
        throw new Error(res.error || "Error desconocido");
      }
      // AQUÍ ESTABA EL ERROR: Aseguramos que siempre sea un string
      setSuccessMessage(res.message || "Instrucciones enviadas con éxito.");
    } catch (err: any) {
      setErrorMessage(err.message || "Error al solicitar recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-3">
                    <Link 
              href="/" 
              className="inline-block transition-transform duration-300 hover:scale-105 mb-3 select-none outline-none"
              aria-label="Volver al inicio"
            >
              <Image
                src="/logo.webp" /* Cambia a .webp si corresponde */
                alt="Altok€! Envíos rápidos y seguros"
                width={400}
                height={120}
                priority
                  className="w-56 sm:w-64 md:w-72 h-auto object-contain mix-blend-screen drop-shadow-[0_0_25px_rgba(16,185,129,0.2)]"
              />
            </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white tracking-tight">Recuperar Acceso</h1>
            <p className="text-xs text-slate-400">
              Ingresa tu correo electrónico registrado y te enviaremos las instrucciones.
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{successMessage}</p>
            </div>
            
            <Link 
              href="/login" 
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejm: pedro@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs hover:opacity-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Enviando instrucciones..." : "Enviar Enlace de Recuperación"}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}