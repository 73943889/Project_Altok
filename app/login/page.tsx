"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, ArrowRight, Building2, AlertCircle, Loader2,Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);    
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const result = await loginAction({ email, password });

      if (!result || !result.success) {
        setErrorMessage(result?.error || "Credenciales inválidas.");
        return;
      }

      // 🚀 Navegación SPA controlada: no aborta el stream de Next.js
      if (result.redirectTo) {
        startTransition(() => {
          router.push(result.redirectTo);
          router.refresh();
        });
      }
    } catch (err: any) {
      console.error("Error en login:", err);
      setErrorMessage("Error de conexión al intentar iniciar sesión.");
    }
  };

  return (
    <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
      
   {/* Header / Logo de Alto Impacto */}
<div className="flex flex-col items-center justify-center text-center mb-8">
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

  <p className="text-sm text-slate-400 mt-1">
    Ingresa tus credenciales para acceder al sistema
  </p>
</div>

      {/* Mensajes de Alerta */}
      {(errorType === "cuenta_inhabilitada" || errorMessage) && (
        <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>
            {errorType === "cuenta_inhabilitada" 
              ? "Cuenta inhabilitada, comunicarse con el administrador." 
              : errorMessage}
          </span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              required
              type="email"
              placeholder="ejm:pedro@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* CONTRASEÑA CON TOGGLE DE VISIBILIDAD */}
<div className="space-y-1.5">
  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
    CONTRASEÑA
  </label>

  <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl focus-within:border-emerald-500 transition-colors">
    {/* Ícono de Candado Izquierdo */}
    <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />

    {/* Input de Contraseña Dinámico */}
    <input
      required
      type={showPassword ? "text" : "password"}
      placeholder="••••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 outline-none font-mono"
    />

    {/* Botón Acción Mostrar / Ocultar */}
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-3 text-slate-500 hover:text-emerald-400 focus:text-emerald-400 transition-colors outline-none cursor-pointer p-1 rounded-lg"
      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {showPassword ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>
  </div>
</div>

        <div className="flex items-center justify-between text-xs mt-1 mb-4">
          <span className="text-slate-500">¿Problemas para acceder?</span>
          <Link href="/forgot-password" className="text-emerald-400 hover:underline font-semibold">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button 
          disabled={isPending}
          type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando acceso...
            </>
          ) : (
            <>
              Iniciar Sesión <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-2">
        <p className="text-xs text-slate-400">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="text-emerald-400 font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </p>
        <div>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Volver al sitio principal
          </Link>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Suspense fallback={
        <div className="flex items-center gap-3 text-emerald-400 font-medium text-xs bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando interfaz de acceso...</span>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}