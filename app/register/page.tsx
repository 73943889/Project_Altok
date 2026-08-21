"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle2, Check, X, User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";
import { FormValidator, PHONE_LIMITS } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();

  // Estados de formulario
  const [firstName, setFirstName] = useState("");
  const [paternalSurname, setPaternalSurname] = useState("");
  const [maternalSurname, setMaternalSurname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️ Estado para mostrar/ocultar contraseña
  const [countryCode, setCountryCode] = useState("+51");
  const [phoneNumber, setPhoneNumber] = useState("");
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Evaluaciones reactivas
  const passwordRequirements = FormValidator.getPasswordRequirements(password);
  const passwordStrength = FormValidator.getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanFirstName = firstName.trim();
    const cleanPaternal = paternalSurname.trim();
    const cleanMaternal = maternalSurname.trim();

    if (cleanFirstName.length < 1 || cleanPaternal.length < 1 || cleanMaternal.length < 1) {
      setErrorMessage("Por favor ingresa un nombre y apellidos válidos.");
      setLoading(false);
      return;
    }

    if (!FormValidator.isValidEmail(email)) {
      setErrorMessage("Por favor ingresa un correo electrónico válido.");
      setLoading(false);
      return;
    }

    if (!FormValidator.isValidPhone(phoneNumber, countryCode)) {
      const limit = PHONE_LIMITS[countryCode]?.length || 9;
      setErrorMessage(`El número telefónico debe tener exactamente ${limit} dígitos para el país seleccionado.`);
      setLoading(false);
      return;
    }

    if (password.length < 8 || password.length > 64) {
      setErrorMessage("La contraseña debe tener entre 8 y 64 caracteres.");
      setLoading(false);
      return;
    }

    const combinedFullName = `${cleanFirstName} ${cleanPaternal} ${cleanMaternal}`;
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: combinedFullName,
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
      setTimeout(() => router.push("/portal-cliente"), 1500);

    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <Link href="/" className="inline-block transition-transform duration-300 hover:scale-105 mb-3 select-none outline-none">
            <Image
              src="/logo.webp"
              alt="Altok€!"
              width={350}
              height={100}
              priority
              className="w-56 sm:w-60 md:w-65 h-auto object-contain mix-blend-screen drop-shadow-[0_0_25px_rgba(16,185,129,0.2)]"
            />
          </Link>
          <p className="text-xs text-slate-400">Regístrate para empezar a enviar dinero de forma rápida y segura</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          
          {/* NOMBRES */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Nombres</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="text"
                maxLength={50}
                placeholder="Juan Carlos"
                value={firstName}
                onChange={(e) => setFirstName(FormValidator.filterNameInput(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* APELLIDOS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Apellido Paterno</label>
              <input 
                required
                type="text"
                maxLength={50}
                placeholder="Pérez"
                value={paternalSurname}
                onChange={(e) => setPaternalSurname(FormValidator.filterNameInput(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Apellido Materno</label>
              <input 
                required
                type="text"
                maxLength={50}
                placeholder="Gómez"
                value={maternalSurname}
                onChange={(e) => setMaternalSurname(FormValidator.filterNameInput(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* CORREO */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type="email"
                maxLength={100}
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* TELÉFONO */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">CÓDIGO DE PAÍS / TELÉFONO</label>
            <div className="bg-[#070a13] border border-slate-800/90 rounded-2xl flex items-center focus-within:border-emerald-500/80 transition-colors shadow-sm overflow-hidden">
              <div className="pl-3.5 flex items-center gap-2 border-r border-slate-800 text-slate-400">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setPhoneNumber("");
                  }}
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
                maxLength={PHONE_LIMITS[countryCode]?.length || 9}
                placeholder={PHONE_LIMITS[countryCode]?.placeholder}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(FormValidator.filterPhoneInput(e.target.value, countryCode))}
                className="w-full bg-transparent text-white font-mono text-xs sm:text-sm font-medium focus:outline-none px-4 py-2.5"
              />
            </div>
            <p className="text-[10px] text-slate-500 text-right">
              Requerido: {PHONE_LIMITS[countryCode]?.label}
            </p>
          </div>

          {/* CONTRASEÑA */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                required
                type={showPassword ? "text" : "password"}
                maxLength={64}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Medidor de Fuerza */}
          {password.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex gap-1 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${passwordStrength.level >= 1 ? passwordStrength.color : 'bg-slate-800'} w-1/3`} />
                <div className={`h-full transition-all duration-300 ${passwordStrength.level >= 2 ? passwordStrength.color : 'bg-slate-800'} w-1/3`} />
                <div className={`h-full transition-all duration-300 ${passwordStrength.level >= 3 ? passwordStrength.color : 'bg-slate-800'} w-1/3`} />
              </div>
              <p className="text-[10px] font-mono flex justify-between text-slate-400">
                <span>Nivel: <strong className={passwordStrength.level === 3 ? "text-emerald-400" : passwordStrength.level === 2 ? "text-amber-400" : "text-rose-400"}>{passwordStrength.text}</strong></span>
              </p>

              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800/80 text-[11px]">
                <div className={`flex items-center gap-1.5 ${passwordRequirements.length ? "text-emerald-400" : "text-slate-500"}`}>
                  {passwordRequirements.length ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-50" />}
                  <span>Mín. 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordRequirements.uppercase ? "text-emerald-400" : "text-slate-500"}`}>
                  {passwordRequirements.uppercase ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-50" />}
                  <span>Una mayúscula</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordRequirements.lowercase ? "text-emerald-400" : "text-slate-500"}`}>
                  {passwordRequirements.lowercase ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-50" />}
                  <span>Una minúscula</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordRequirements.number ? "text-emerald-400" : "text-slate-500"}`}>
                  {passwordRequirements.number ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-50" />}
                  <span>Un número</span>
                </div>
                <div className={`flex items-center gap-1.5 col-span-2 ${passwordRequirements.special ? "text-emerald-400" : "text-slate-500"}`}>
                  {passwordRequirements.special ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-50" />}
                  <span>Un carácter especial (!@#$%...)</span>
                </div>
              </div>
            </div>
          )}

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creando cuenta..." : "Registrarse Gratis"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/portal-cliente" className="text-emerald-400 font-semibold hover:underline">Ingresa aquí</Link>
          </p>
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Volver al sitio principal</Link>
          </div>
        </div>

      </div>
    </div>
  );
}