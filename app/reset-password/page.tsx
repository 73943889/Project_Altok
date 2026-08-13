"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";

// 1. Componente que contiene toda tu lógica y UI original
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setErrorMessage("El enlace de recuperación es inválido o no contiene un token.");
    }
  }, [token]);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-800" };
    
    const hasAlphanumeric = /[a-zA-Z0-9]/.test(pass);
    if (!hasAlphanumeric) {
      return { score: 1, label: "Inválida (Solo caracteres especiales)", color: "bg-rose-500" };
    }

    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Débil", color: "bg-rose-500" };
    if (score === 2 || score === 3) return { score: 2, label: "Seguridad Media", color: "bg-amber-500" };
    return { score: 3, label: "Contraseña Fuerte", color: "bg-emerald-500" };
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const hasAlphanumeric = /[a-zA-Z0-9]/.test(password);
    if (!hasAlphanumeric) {
      setErrorMessage("La contraseña no puede consistir únicamente de caracteres especiales. Debe incluir letras o números.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await resetPasswordAction(token, password);
      if (!res.success) {
        throw new Error(res.error || "Error desconocido");
      }
      setSuccessMessage(res.message || "Contraseña actualizada con éxito.");
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-3">
        <Link href="/" className="inline-block transition-opacity hover:opacity-90">
          <Image
            src="/logo.png"
            alt="Altok€!"
            width={180}
            height={60}
            priority
            className="mx-auto h-12 w-auto object-contain"
          />
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl font-black text-white tracking-tight">Nueva Contraseña</h1>
          <p className="text-xs text-slate-400">
            Ingresa tu nueva contraseña segura para tu cuenta de Altok€!
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMessage} Redirigiendo al login...</p>
          </div>
          
          <Link 
            href="/login" 
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Ir al Inicio de Sesión ahora
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, letras y números"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'} w-1/3`} />
                  <div className={`h-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'} w-1/3`} />
                  <div className={`h-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'} w-1/3`} />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Seguridad:</span>
                  <span className={`font-bold ${strength.score === 1 ? 'text-rose-400' : strength.score === 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {strength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
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
            disabled={loading || !token}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs hover:opacity-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Actualizando contraseña..." : "Restablecer Contraseña"}
          </button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

// 2. Componente de página principal que envuelve al contenido dentro de <Suspense>
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl text-center text-slate-400 text-xs animate-pulse">
            Cargando módulo de seguridad...
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}