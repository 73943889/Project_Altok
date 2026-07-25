"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Building2, User, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+51"); // Por defecto Perú
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: fullPhone,
            role: "client",
          },
        },
      });

      if (error) throw error;

      // Si Supabase requiere confirmación de email, data.session será null
      if (data.user && !data.session) {
        setSuccessMessage("¡Registro exitoso! Por favor verifica tu bandeja de correo para confirmar tu cuenta.");
        return;
      }

      setSuccessMessage("¡Cuenta creada con éxito! Redirigiendo...");
      setTimeout(() => {
        router.push("/portal-cliente");
      }, 1500);

    } catch (err: any) {
// Capturamos si hay un fallo por duplicidad en la base de datos
      if (err.message && (err.message.includes("unique_profile_email_phone") || err.message.includes("23505"))) {
        setErrorMessage("Ya existe un usuario registrado con este mismo correo y número de teléfono. Puedes usar el mismo correo con un número de teléfono diferente.");
      } else {
        setErrorMessage(err.message || "Ocurrió un error al registrarse.");
      }

      setErrorMessage(err.message || "Ocurrió un error al registrar la cuenta.");
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
          <h1 className="text-2xl font-black tracking-tight text-white">Crea tu cuenta</h1>
          <p className="text-xs text-slate-400">Regístrate para empezar a enviar dinero de forma rápida y segura</p>
        </div>

        {/* Alerta de Error */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Alerta de Éxito */}
        {successMessage && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulario de Registro */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Nombre Completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>


        {/* CAMPO DE CELULAR CON CÓDIGO DE PAÍS (PERÚ, ESPAÑA, USA) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
              TELÉFONO / CELULAR
            </label>
            <div className="bg-[#070a13] border border-slate-800/90 rounded-2xl flex items-center focus-within:border-emerald-500/80 transition-colors shadow-sm overflow-hidden">
              <div className="pl-3.5 flex items-center gap-2 border-r border-slate-800 text-slate-400">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent text-emerald-400 font-mono text-xs font-bold focus:outline-none cursor-pointer py-3 pr-1"
                >
                  <option value="+51" className="bg-slate-900 text-white">🇵🇪 +51</option>
                  <option value="+34" className="bg-slate-900 text-white">🇪🇸 +34</option>
                  <option value="+1" className="bg-slate-900 text-white">🇺🇸 +1</option>
                </select>
              </div>
              <input 
                type="tel"
                required
                placeholder="987 654 321"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setPhoneNumber(val);
                  }
                }}
                className="w-full bg-transparent text-white font-mono text-xs sm:text-sm font-medium focus:outline-none px-4 py-3"
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
            {loading ? "Creando cuenta..." : "Registrarse Gratis"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Enlace hacia el Login si ya tiene cuenta */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" className="text-emerald-400 font-semibold hover:underline">
              Ingresa aquí
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