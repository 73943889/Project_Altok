"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Building2, ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
// Inicialización segura del cliente de Supabase
/*const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);*/

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

 const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Autenticación con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("No se pudo obtener la sesión del usuario.");

      // 2. Verificación de rol en la tabla de perfiles (opcional pero recomendado)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // 3. Redirección inteligente basada en permisos y roles reales
      if (profile?.role === "admin" || email.toLowerCase().includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/portal-cliente"); // ✅ Redirección correcta al portal del cliente
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Credenciales inválidas o error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Header / Logo */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20 mx-auto">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Acceso a ValoraTransfer</h1>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        {/* Alerta de Error si existe */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="email"
                placeholder="admin@valoratransfer.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? "Verificando acceso..." : "Ingresar al Sistema"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-2">
  <p className="text-xs text-slate-400">
    ¿Aún no tienes cuenta?{" "}
    <a href="/register" className="text-emerald-400 font-semibold hover:underline">
      Regístrate aquí
    </a>
  </p>
  <div>
    <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
      ← Volver al sitio principal
    </a>
  </div>
</div>

      </div>
    </div>
  );
}