// Configuración de límites y tipos de documentos
export const DOCUMENT_RULES: Record<string, { maxLength: number; label: string; numericOnly: boolean }> = {
  DNI: { maxLength: 8, label: "DNI (8 dígitos)", numericOnly: true },
  NIE: { maxLength: 9, label: "NIE (9 caracteres)", numericOnly: false },
  CE: { maxLength: 9, label: "Carné Extranj. (9 dígitos)", numericOnly: true },
  PASAPORTE: { maxLength: 12, label: "Pasaporte (máx. 12)", numericOnly: false },
  ID: { maxLength: 15, label: "ID (máx. 15)", numericOnly: false },
};

// Configuración de límites por país (Existente)
export const PHONE_LIMITS: Record<string, { length: number; label: string; placeholder: string }> = {
  "+51": { length: 9, label: "Perú (9 dígitos)", placeholder: "987654321" },
  "+34": { length: 9, label: "España (9 dígitos)", placeholder: "987654321" },
  "+1": { length: 10, label: "EE.UU. (10 dígitos)", placeholder: "2015550123" },
};



export class FormValidator {
  // 1. Sanitizar y limitar nombres (Existente)
  static filterNameInput(value: string, maxLength: number = 50): string {
    const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    return onlyLetters.slice(0, maxLength);
  }

  // 2. Sanitizar y limitar teléfono por país (Existente)
  static filterPhoneInput(value: string, countryCode: string): string {
    const onlyDigits = value.replace(/\D/g, "");
    const limit = PHONE_LIMITS[countryCode]?.length || 9;
    return onlyDigits.slice(0, limit);
  }

  // 3. Validar longitud exacta de teléfono (Existente)
  static isValidPhone(phoneNumber: string, countryCode: string): boolean {
    const requiredLength = PHONE_LIMITS[countryCode]?.length || 9;
    return phoneNumber.trim().length === requiredLength;
  }

  // 🛡️ 4. NUEVO: Sanitizar entrada de documento según su tipo (DNI, NIE, Pasaporte, CE, ID)
  static filterDocumentInput(value: string, docType: string): string {
    const rule = DOCUMENT_RULES[docType] || { maxLength: 15, numericOnly: false };

    if (rule.numericOnly) {
      // Solo permite números (DNI y CE)
      return value.replace(/\D/g, "").slice(0, rule.maxLength);
    } else {
      // Permite alfanuméricos en mayúsculas (NIE, Pasaporte, ID)
      return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, rule.maxLength);
    }
  }

  // 🛡️ 5. NUEVO: Validar si el documento cumple con la longitud y formato correcto por tipo
  static isValidDocument(value: string, docType: string): boolean {
    const cleanVal = value.trim();
    if (!cleanVal) return false;

    switch (docType) {
      case "DNI":
        // Exactamente 8 dígitos numéricos
        return /^\d{8}$/.test(cleanVal);
      case "CE":
        // Exactamente 9 dígitos numéricos
        return /^\d{9}$/.test(cleanVal);
      case "NIE":
        // Exactamente 9 caracteres alfanuméricos
        return cleanVal.length === 9 && /^[A-Z0-9]{9}$/.test(cleanVal);
      case "PASAPORTE":
        // Entre 6 y 12 caracteres alfanuméricos
        return cleanVal.length >= 6 && cleanVal.length <= 12;
      case "ID":
        // Entre 5 y 15 caracteres alfanuméricos
        return cleanVal.length >= 5 && cleanVal.length <= 15;
      default:
        return cleanVal.length >= 3;
    }
  }

  // 6. Validar formato de Email (Existente)
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email.length >= 6 && email.length <= 100 && emailRegex.test(email);
  }


// 🛡️ NUEVO: Filtrado en tiempo real de la cuenta de destino según divisa y tipo
  static filterRecipientAccountInput(value: string, currency: string, destinationType: "bank" | "wallet"): string {
    const cleanVal = value.toUpperCase();

    if (destinationType === "wallet") {
      // Billeteras digitales (Yape, Plin, Zelle, Bizum): Solo números, máx 15 dígitos
      return cleanVal.replace(/\D/g, "").slice(0, 15);
    }

    if (currency === "PEN") {
      // Perú (PEN): Cuentas locales o CCI. Solo números, máx 20 dígitos
      return cleanVal.replace(/\D/g, "").slice(0, 20);
    }

    if (currency === "USD") {
      // EE. UU. (USD): Cuentas bancarias. Solo números, máx 17 dígitos
      return cleanVal.replace(/\D/g, "").slice(0, 17);
    }

    if (currency === "EUR") {
      // Europa / España (EUR): IBAN alfanumérico, máx 24 caracteres (ES + 22 dígitos)
      return cleanVal.replace(/[^A-Z0-9]/g, "").slice(0, 24);
    }

    return cleanVal.replace(/[^A-Z0-9]/g, "").slice(0, 34);
  }

  // 🛡️ NUEVO: Validación estricta de integridad de la cuenta de destino
  static isValidRecipientAccount(account: string, currency: string, destinationType: "bank" | "wallet"): boolean {
    const cleanAccount = account.trim().toUpperCase();

    if (destinationType === "wallet") {
      return cleanAccount.length >= 9 && cleanAccount.length <= 15;
    }

    if (currency === "PEN") {
      // Cuenta Local (10-20 dígitos) o CCI (20 dígitos exactos) - Solo números
      return /^\d{10,20}$/.test(cleanAccount);
    }

    if (currency === "USD") {
      // Cuenta Corriente / Ahorros EE.UU.: 8 a 17 dígitos - Solo números
      return /^\d{8,17}$/.test(cleanAccount);
    }

    if (currency === "EUR") {
      // IBAN España/Europa: Exactamente 24 caracteres (ES + 22 dígitos)
      return /^ES\d{22}$/.test(cleanAccount);
    }

    return cleanAccount.length >= 5 && cleanAccount.length <= 34;
  }

 // 🛡️ Validación detallada de requisitos de contraseña por criterio
  static getPasswordRequirements(password: string = "") {
    return {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      length: password.length >= 8,
    };
  }

  // 🛡️ Evaluación de fuerza de contraseña compatible con .level, .text, .score y .color
  static getPasswordStrength(password: string = "") {
    if (!password) return { score: 0, level: 0, label: "Vacía", text: "Vacía", color: "bg-slate-700" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];
    const colors = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-400"];

    return {
      score,
      level: score,
      label: labels[score] || "Débil",
      text: labels[score] || "Débil",
      color: colors[score] || "bg-slate-700",
    };
  }
}