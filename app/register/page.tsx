"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Building2, User, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import Image from "next/image";
export default function RegisterPage() {
  const router = useRouter();
  
  // 📝 Estados separados para la interfaz del Frontend
  const [firstName, setFirstName] = useState("");
  const [paternalSurname, setPaternalSurname] = useState("");
  const [maternalSurname, setMaternalSurname] = useState("");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+51"); // Por defecto Perú
  const [phoneNumber, setPhoneNumber] = useState("");
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // 🔒 Validación estricta en el frontend para el mínimo de 8 caracteres en la contraseña
    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    // 🔗 Consolidamos los 3 campos visuales en una sola cadena para el atributo full_name que espera tu BD
    const combinedFullName = `${firstName.trim()} ${paternalSurname.trim()} ${maternalSurname.trim()}`;
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: combinedFullName, // Se envía un único atributo como lo requiere la tabla actual
          email,
          password,
          phone: fullPhone,
          timezone: userTimeZone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo registrar la cuenta.");
      }

      setSuccessMessage("¡Cuenta creada con éxito! Redirigiendo...");
      setTimeout(() => {
        router.push("/portal-cliente");
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Header / Logo */}
        <div className="text-center space-y-2 mb-6">
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
          <h1 className="text-2xl font-black tracking-tight text-white">Crea tu usuario</h1>
          <p className="text-xs text-slate-400">Regístrate para empezar a enviar dinero de forma rápida y segura</p>
        </div>

        {/* Alerta de Error */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Alerta de Éxito */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulario de Registro */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          
          {/* NOMBRES */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Nombres</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="text"
                placeholder="Juan Carlos"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* APELLIDO PATERNO Y MATERNO EN DOS COLUMNAS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Apellido Paterno</label>
              <input 
                required
                type="text"
                placeholder="Pérez"
                value={paternalSurname}
                onChange={(e) => setPaternalSurname(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Apellido Materno</label>
              <input 
                required
                type="text"
                placeholder="Gómez"
                value={maternalSurname}
                onChange={(e) => setMaternalSurname(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* CORREO ELECTRÓNICO */}
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

          {/* CAMPO DE CELULAR CON CÓDIGO DE PAÍS */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
             CÓDIGO DE PAÍS / TELÉFONO 
            </label>
            <div className="bg-[#070a13] border border-slate-800/90 rounded-2xl flex items-center focus-within:border-emerald-500/80 transition-colors shadow-sm overflow-hidden">
              <div className="pl-3.5 flex items-center gap-2 border-r border-slate-800 text-slate-400">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent text-emerald-400 font-mono text-xs font-bold focus:outline-none cursor-pointer py-2.5 pr-1"
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
                className="w-full bg-transparent text-white font-mono text-xs sm:text-sm font-medium focus:outline-none px-4 py-2.5"
              />
            </div>
          </div>

          {/* CONTRASEÑA CON REQUISITO DE 8 CARACTERES */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contraseña (Mín. 8 caracteres)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="password"
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Debe contener al menos 8 caracteres de seguridad.</p>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creando cuenta..." : "Registrarse Gratis"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Enlace hacia el Login si ya tiene cuenta */}
        <div className="mt-5 pt-5 border-t border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/portal-cliente" className="text-emerald-400 font-semibold hover:underline">
              Ingresa aquí
            </Link>
          </p>
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Volver al sitio principal
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}