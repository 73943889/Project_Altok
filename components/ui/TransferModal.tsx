"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTransactionAction, updateTransactionBankAction } from "@/app/actions/transaction";
import { ShieldAlert, Phone } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sendAmount: number;
  sendCurrency: "EUR" | "PEN" | "USD";
  receiveAmount: number | string;
  receiveCurrency: "EUR" | "PEN" | "USD";
  userId?: string;
  userEmail?: string;
  userFullName?: string;
}

interface DestinationOption {
  id: string;
  name: string;
  country: "PEN" | "EUR" | "USD";
  type: "bank" | "wallet";
}

const DESTINATION_OPTIONS: DestinationOption[] = [
  // --- PERÚ (PEN) - BANCOS ---
  { id: "BCP", name: "BCP (Banco de Crédito del Perú)", country: "PEN", type: "bank" },
  { id: "BBVA_PE", name: "BBVA Perú", country: "PEN", type: "bank" },
  { id: "Interbank", name: "Interbank", country: "PEN", type: "bank" },
  { id: "Scotiabank", name: "Scotiabank", country: "PEN", type: "bank" },
  // --- PERÚ (PEN) - WALLETS ---
  { id: "Yape", name: "Yape (Billetera Digital)", country: "PEN", type: "wallet" },
  { id: "Plin", name: "Plin (Billetera Digital)", country: "PEN", type: "wallet" },
  { id: "Bim", name: "Bim Monedero Móvil", country: "PEN", type: "wallet" },

  // --- EUROPA / ESPAÑA (EUR) - BANCOS ---
  { id: "CaixaBank", name: "CaixaBank", country: "EUR", type: "bank" },
  { id: "Santander", name: "Banco Santander", country: "EUR", type: "bank" },
  { id: "BBVA_ES", name: "BBVA España", country: "EUR", type: "bank" },
  { id: "Sabadell", name: "Banco Sabadell", country: "EUR", type: "bank" },
  // --- EUROPA / ESPAÑA (EUR) - WALLETS ---
  { id: "Bizum", name: "Bizum (Pago Móvil)", country: "EUR", type: "wallet" },

  // --- ESTADOS UNIDOS (USD) - BANCOS ---
  { id: "BankofAmerica", name: "Bank of America", country: "USD", type: "bank" },
  { id: "CapitalOne", name: "Capital One", country: "USD", type: "bank" },
  { id: "JPMorganChase", name: "JPMorgan Chase", country: "USD", type: "bank" },
  // --- ESTADOS UNIDOS (USD) - WALLETS ---
  { id: "Zelle", name: "Zelle Transfer", country: "USD", type: "wallet" },
];

interface CountryCodeOption {
  code: string;
  flag: string;
  label: string;
}

const COUNTRY_CODES: CountryCodeOption[] = [
  { code: "+51", flag: "🇵🇪", label: "+51" },
  { code: "+34", flag: "🇪🇸", label: "+34" },
  { code: "+1",  flag: "🇺🇸", label: "+1" },
];

interface DocumentTypeOption {
  id: string;
  label: string;
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  { id: "DNI", label: "DNI (Perú)" },
  { id: "NIE", label: "NIE (España)" },
  { id: "PASAPORTE", label: "Pasaporte" },
  { id: "CE", label: "Carné Extranj." },
];

interface CollectorAccount {
  id: string;
  name: string;
  type: "Banco" | "Wallet" | "IBAN";
  accountNumber: string;
  cci?: string;
  holder?: string;
}

const CORPORATE_COLLECTOR_ACCOUNTS: Record<string, CollectorAccount[]> = {
  PEN: [
    { id: "BCP", name: "BCP Perú (Cuenta Corriente)", type: "Banco", accountNumber: "191-98765432-0-12", cci: "00219100987654320123", holder: "Altok€ SAC" },
    { id: "BBVA_PE", name: "BBVA Perú", type: "Banco", accountNumber: "0011-0123-0200456789", cci: "011-123-000123456789-10", holder: "Altok€ SAC" },
    { id: "Interbank", name: "Interbank", type: "Banco", accountNumber: "200-3004567890", cci: "003-200-003004567890-31", holder: "Altok€ SAC" },
    { id: "Yape", name: "Yape Oficial", type: "Wallet", accountNumber: "987 408 496", holder: "Altok€ SAC" },
  ],
  EUR: [
    { id: "BBVA_ES", name: "BBVA España (IBAN)", type: "IBAN", accountNumber: "ES91 0182 2345 99 0123456789", holder: "Altok€ SAC" },
    { id: "CaixaBank", name: "CaixaBank", type: "IBAN", accountNumber: "ES91 0182 2345 99 0123456789", holder: "Altok€ SAC" },
    { id: "Santander", name: "Santander", type: "IBAN", accountNumber: "ES91 0182 2345 99 0123456789", holder: "Altok€ SAC" },
    { id: "Sabadell", name: "Banco Sabadell", type: "IBAN", accountNumber: "ES91 0182 2345 99 0123456789", holder: "Altok€ SAC" },
    { id: "Bizum", name: "Bizum corporativo", type: "Wallet", accountNumber: "+34 600 123 456", holder: "Altok€ SAC" },
  ],
  USD: [
    { id: "Chase", name: "JPMorgan Chase (USA)", type: "Banco", accountNumber: "US12CHAS30000012345678", holder: "Altok€ SAC" },
    { id: "Capital", name: "Capital One (USA)", type: "Banco", accountNumber: "US12CHAS30000012345678", holder: "Altok€ SAC" },
    { id: "BakAmer", name: "Bank of America (USA)", type: "Banco", accountNumber: "US12CHAS30000012345678", holder: "Altok€ SAC" },
    { id: "Zelle", name: "Zelle", type: "Wallet", accountNumber: "9874854225412545", holder: "Altok€ SAC" },
  ]
};

interface TransferFormData {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  documentType: string;
  documentNumber: string;
  countryCode: string;
  phone: string;
  recipientFirstName: string;
  recipientPaternalSurname: string;
  recipientMaternalSurname: string;
  destinationType: "bank" | "wallet";
  recipientDestinationId: string;
  recipientAccount: string;
}

const INITIAL_FORM_DATA: TransferFormData = {
  firstName: "",
  paternalSurname: "",
  maternalSurname: "",
  email: "",
  documentType: "",
  documentNumber: "",
  countryCode: "",
  phone: "",
  recipientFirstName: "",
  recipientPaternalSurname: "",
  recipientMaternalSurname: "",
  destinationType: "bank",
  recipientDestinationId: "",
  recipientAccount: "",
};

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  sendAmount,
  sendCurrency,
  receiveAmount,
  receiveCurrency,
  userId,
  userEmail,
  userFullName,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [operationCode, setOperationCode] = useState("");
  const [formData, setFormData] = useState<TransferFormData>(INITIAL_FORM_DATA);
  
  const [commissionBankVal, setCommissionBankVal] = useState<string>("0.00");
  const [commissionWalletVal, setCommissionWalletVal] = useState<string>("0.00");

  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
  const [isDocTypeOpen, setIsDocTypeOpen] = useState(false);
  
  const destinationDropdownRef = useRef<HTMLDivElement>(null);
  const countryCodeDropdownRef = useRef<HTMLDivElement>(null);
  const docTypeDropdownRef = useRef<HTMLDivElement>(null);

  const documentNumberInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const recipientAccountInputRef = useRef<HTMLInputElement>(null);

  const [formErrors, setFormErrors] = useState<{
    documentType?: string;
    documentNumber?: string;
    countryCode?: string;
    phone?: string;
    recipientDestinationId?: string;
    recipientAccount?: string;
    general?: string;
  }>({});

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedCollectorAccount, setSelectedCollectorAccount] = useState<CollectorAccount | null>(null);

  // 🎨 PALETA DINÁMICA DE COLORES SEGÚN LA MONEDA DE ENVÍO
  const isEuro = sendCurrency === "EUR";

  const themeColors = {
    textAccent: isEuro ? "text-blue-400" : "text-emerald-400",
    bgAccent: isEuro ? "bg-blue-600 hover:bg-blue-500" : "bg-emerald-500 hover:bg-emerald-400",
    bgAccentSoft: isEuro ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400",
    borderFocus: isEuro ? "focus:border-blue-500" : "focus:border-emerald-500",
    borderFocusGroup: isEuro ? "focus-within:border-blue-500" : "focus-within:border-emerald-500",
    ringAccent: isEuro ? "border-blue-500 ring-1 ring-blue-500/50" : "border-emerald-500 ring-1 ring-emerald-500/50",
    badgeAccent: isEuro ? "bg-blue-500 text-slate-950" : "bg-emerald-500 text-slate-950",
    scrollbarThumb: isEuro ? "hover:bg-blue-400" : "hover:bg-emerald-400",
  };

  useEffect(() => {
    if (!isCompleted) {
      setSelectedCollectorAccount(null);
    }
  }, [sendCurrency, formData.destinationType, isCompleted]);

  const handleCopy = async (textToCopy: string, fieldKey: string, accountObj: CollectorAccount) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(fieldKey);
      setSelectedCollectorAccount(accountObj);

      if (operationCode) {
        await updateTransactionBankAction(operationCode, accountObj.name);
      }

      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      let fName = "";
      let pSurname = "";
      let mSurname = "";

      if (userFullName) {
        const parts = userFullName.trim().split(" ");
        if (parts.length === 1) {
          fName = parts[0];
        } else if (parts.length === 2) {
          fName = parts[0];
          pSurname = parts[1];
        } else if (parts.length >= 3) {
          fName = parts.slice(0, parts.length - 2).join(" ");
          pSurname = parts[parts.length - 2];
          mSurname = parts[parts.length - 1];
        }
      }

      setFormData((prev) => ({
        ...prev,
        firstName: fName || prev.firstName,
        paternalSurname: pSurname || prev.paternalSurname,
        maternalSurname: mSurname || prev.maternalSurname,
        email: userEmail || prev.email,
      }));
      setFormErrors({});
    }
  }, [isOpen, userFullName, userEmail]);

  const fetchCommissions = async () => {
    try {
      const res = await fetch("/api/rates", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const bankItem = data.find((item: any) => item.key === "transfer_commission_bank");
          const walletItem = data.find((item: any) => item.key === "transfer_commission_wallet");
          
          if (bankItem && bankItem.value !== null && bankItem.value !== undefined) {
            setCommissionBankVal(Number(bankItem.value).toFixed(2));
          }
          if (walletItem && walletItem.value !== null && walletItem.value !== undefined) {
            setCommissionWalletVal(Number(walletItem.value).toFixed(2));
          }
        }
      }
    } catch (err) {
      console.error("Error al sincronizar comisiones:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchCommissions();
    const handleFocus = () => fetchCommissions();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isOpen]);

  const filteredDestinations = DESTINATION_OPTIONS.filter(
    (item) => item.country === receiveCurrency && item.type === formData.destinationType
  );

  useEffect(() => {
    if (formData.recipientDestinationId) {
      const isValid = filteredDestinations.some((d) => d.id === formData.recipientDestinationId);
      if (!isValid) {
        setFormData((prev) => ({ ...prev, recipientDestinationId: "" }));
      }
    }
  }, [formData.destinationType, receiveCurrency]);

  const activeCommission = formData.destinationType === "bank" ? commissionBankVal : commissionWalletVal;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationDropdownRef.current && !destinationDropdownRef.current.contains(event.target as Node)) {
        setIsDestinationOpen(false);
      }
      if (countryCodeDropdownRef.current && !countryCodeDropdownRef.current.contains(event.target as Node)) {
        setIsCountryCodeOpen(false);
      }
      if (docTypeDropdownRef.current && !docTypeDropdownRef.current.contains(event.target as Node)) {
        setIsDocTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleFullReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setOperationCode("");
    setIsCompleted(false);
    setIsSubmitting(false);
    setFormErrors({});
    setIsDestinationOpen(false);
    setIsCountryCodeOpen(false);
    setIsDocTypeOpen(false);
    onClose();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const cleanedValue = value.replace(/[0-9]/g, "");
    setFormData({ ...formData, [name]: cleanedValue });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({ ...formErrors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {};

    if (!formData.documentType) {
      errors.documentType = "Por favor selecciona un tipo de documento.";
    }
    if (!formData.documentNumber.trim()) {
      errors.documentNumber = "Por favor ingresa tu número de documento.";
    }
    if (!formData.countryCode) {
      errors.countryCode = "Por favor selecciona un código de teléfono.";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Por favor ingresa tu número de teléfono.";
    }
    if (!formData.recipientDestinationId) {
      errors.recipientDestinationId = "Por favor selecciona una entidad de destino válida.";
    }
    if (!formData.recipientAccount.trim()) {
      errors.recipientAccount = "Por favor ingresa el número de cuenta o celda de destino.";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.documentType || errors.documentNumber) {
        documentNumberInputRef.current?.focus();
      } else if (errors.countryCode || errors.phone) {
        phoneInputRef.current?.focus();
      } else if (errors.recipientDestinationId || errors.recipientAccount) {
        recipientAccountInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      if (!userId) {
        setFormErrors({ general: "Debes iniciar sesión para realizar una transferencia." });
        setIsSubmitting(false);
        return;
      }

      const parsedReceive = typeof receiveAmount === "string" ? parseFloat(receiveAmount) : receiveAmount;
      const calculatedRate = sendAmount > 0 ? parsedReceive / sendAmount : 0;

      const consolidatedSender = `${formData.firstName.trim()} ${formData.paternalSurname.trim()} ${formData.maternalSurname.trim()}`;
      const consolidatedRecipient = `${formData.recipientFirstName.trim()} ${formData.recipientPaternalSurname.trim()} ${formData.recipientMaternalSurname.trim()}`;
      
      const selectedDestObj = DESTINATION_OPTIONS.find((d) => d.id === formData.recipientDestinationId);
      const recipientBankString = selectedDestObj ? `${selectedDestObj.name} (${formData.destinationType.toUpperCase()})` : formData.destinationType;

      const collectorList = CORPORATE_COLLECTOR_ACCOUNTS[sendCurrency] || CORPORATE_COLLECTOR_ACCOUNTS.EUR;
      const filteredAccounts = collectorList.filter((acc) => {
        if (formData.destinationType === "bank") {
          return acc.type === "Banco" || acc.type === "IBAN";
        } else {
          return acc.type === "Wallet";
        }
      });
      
      const resolvedBank = selectedCollectorAccount || filteredAccounts[0] || collectorList[0];
      const finalBankName = resolvedBank.name;

      const result = await createTransactionAction({
        user_id: userId,
        send_amount: sendAmount,
        send_currency: sendCurrency,
        receive_amount: parsedReceive,
        receive_currency: receiveCurrency,
        exchange_rate_applied: Number(calculatedRate.toFixed(4)),
        recipient_name: consolidatedRecipient,
        recipient_bank: recipientBankString,
        recipient_account: formData.recipientAccount,
        bank: finalBankName,
        transfer_commission: Number(activeCommission),
        commission_type: formData.destinationType,
        client_data: {
          full_name: consolidatedSender,
          email: formData.email,
          document_type: formData.documentType,
          document_number: formData.documentNumber,
          phone: `${formData.countryCode} ${formData.phone}`,
        }
      });

      if (!result.success) {
        if (result.error && result.error.includes("TRANSACCION_DENEGADA")) {
          onClose();
          router.push('/login?error=cuenta_inhabilitada');
          router.refresh();
          return;
        }
        throw new Error(result.error || "Error al procesar la orden.");
      }

      setOperationCode(result.data.operation_code);
      setIsCompleted(true);
    } catch (err: any) {
      console.error("Error crítico al procesar transferencia:", err);
      setFormErrors({ general: err.message || "Error inesperado al procesar la solicitud." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const whatsappPhone = "51987408496";
    const collectorList = CORPORATE_COLLECTOR_ACCOUNTS[sendCurrency] || CORPORATE_COLLECTOR_ACCOUNTS.EUR;
    
    const filteredCollectorAccounts = collectorList.filter((acc) => {
      if (formData.destinationType === "bank") {
        return acc.type === "Banco" || acc.type === "IBAN";
      } else {
        return acc.type === "Wallet";
      }
    });

    const primaryAccount = selectedCollectorAccount || filteredCollectorAccounts[0] || collectorList[0];

    const consolidatedSender = `${formData.firstName} ${formData.paternalSurname} ${formData.maternalSurname}`;
    const consolidatedRecipient = `${formData.recipientFirstName} ${formData.recipientPaternalSurname} ${formData.recipientMaternalSurname}`;
    const selectedDestObj = DESTINATION_OPTIONS.find((d) => d.id === formData.recipientDestinationId);

    const lines = [
      "¡Hola Altok€!",
      `Acabo de generar la orden de transferencia *${operationCode}*.`,
      "",
      "*Detalles del Envío:*",
      `- Monto Enviado: ${sendAmount} ${sendCurrency}`,
      `- Comisión (${formData.destinationType.toUpperCase()}): ${activeCommission} ${sendCurrency}`,
      `- *Total a Depositar: ${totalDepositAmount} ${sendCurrency}*`,
      `- Monto a Recibir: ${receiveAmount} ${receiveCurrency}`,
      `- Remitente: ${consolidatedSender} (${formData.documentType}: ${formData.documentNumber})`,
      `- Destinatario: ${consolidatedRecipient}`,
      `- Destino: ${selectedDestObj?.name || ""}`,
      `- N° Cuenta / Celular: ${formData.recipientAccount}`,
      "",
      "Adjunto mi comprobante de pago realizado a la cuenta de recaudo:",
      `> Cuenta: ${primaryAccount.name}`,
      `> Número: ${primaryAccount.accountNumber}`,
      primaryAccount.cci ? `> CCI: ${primaryAccount.cci}` : "",
    ].filter(Boolean);

    const rawText = lines.join("\n");

    try {
      const safeText =
        typeof rawText.toWellFormed === "function"
          ? rawText.toWellFormed()
          : rawText.replace(
              /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
              ""
            );

      const encodedText = encodeURIComponent(safeText);
      const url = `https://wa.me/${whatsappPhone}?text=${encodedText}`;

      window.open(url, "_blank", "noopener,noreferrer");
      handleFullReset();
      window.location.href = "/portal-cliente";
    } catch (error) {
      console.error("Error al abrir WhatsApp:", error);
      const fallbackUrl = `https://wa.me/${whatsappPhone}?text=Hola%20Altok€,%20orden%20*${operationCode}*`;
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      
      handleFullReset();
      window.location.href = "/portal-cliente";
    }
  };

  const selectedDestinationObj = DESTINATION_OPTIONS.find((d) => d.id === formData.recipientDestinationId);
  const selectedCountryObj = COUNTRY_CODES.find((c) => c.code === formData.countryCode);
  const selectedDocTypeObj = DOCUMENT_TYPES.find((d) => d.id === formData.documentType);

  const numericSendAmount = Number(sendAmount) || 0;
  const numericCommission = Number(activeCommission) || 0;
  const totalDepositAmount = (numericSendAmount + numericCommission).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
     <div className="relative w-full max-w-lg max-h-[88vh] rounded-3xl bg-slate-900/95 border border-slate-800/90 p-6 sm:p-8 text-white shadow-2xl flex flex-col my-auto overflow-hidden backdrop-blur-xl">
        
        <button
          type="button"
          onClick={handleFullReset}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer z-20 bg-[#0f172a]/90 p-1.5 rounded-lg backdrop-blur-sm border border-slate-800"
        >
          ✕
        </button>

        <div className="overflow-y-auto pr-3 pl-1 my-1 custom-scrollbar space-y-4 flex-1 scroll-smooth">
          {!isCompleted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-center">Datos de la Remesa</h2>
              <p className={`text-center text-sm font-medium ${themeColors.textAccent}`}>
                Enviarás {sendAmount} {sendCurrency} para abonar {receiveAmount} {receiveCurrency}
              </p>

              {/* Error General */}
              {formErrors.general && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              <div className="space-y-3">
                <h3 className={`text-xs font-semibold tracking-wider uppercase ${themeColors.textAccent}`}>
                  1. Tus Datos (Remitente)
                </h3>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombres</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="Ej. Juan Carlos"
                    value={formData.firstName}
                    onChange={handleNameChange}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${themeColors.borderFocus} transition-all`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Apellido Paterno</label>
                    <input
                      type="text"
                      name="paternalSurname"
                      required
                      placeholder="Ej. Pérez"
                      value={formData.paternalSurname}
                      onChange={handleNameChange}
                      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${themeColors.borderFocus} transition-all`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Apellido Materno</label>
                    <input
                      type="text"
                      name="maternalSurname"
                      required
                      placeholder="Ej. Gómez"
                      value={formData.maternalSurname}
                      onChange={handleNameChange}
                      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${themeColors.borderFocus} transition-all`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="tucorreo@ejemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${themeColors.borderFocus} transition-all font-mono`}
                  />
                </div>

                {/* TIPO DE DOCUMENTO Y NÚMERO */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative" ref={docTypeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDocTypeOpen(!isDocTypeOpen);
                        setIsCountryCodeOpen(false);
                        setIsDestinationOpen(false);
                      }}
                      className={`w-full h-[42px] px-3 rounded-lg bg-slate-900 border border-slate-700 text-left text-xs flex items-center justify-between text-slate-200 ${themeColors.borderFocus} outline-none cursor-pointer`}
                    >
                      <span className="truncate">{selectedDocTypeObj ? selectedDocTypeObj.label : "Elegir Documento"}</span>
                      <span className="text-[10px] text-slate-400 ml-1">▼</span>
                    </button>

                    {isDocTypeOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-1.5 space-y-1">
                        {DOCUMENT_TYPES.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, documentType: item.id });
                              setIsDocTypeOpen(false);
                              if (formErrors.documentType) setFormErrors({ ...formErrors, documentType: undefined });
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                              formData.documentType === item.id
                                ? `${themeColors.bgAccentSoft} font-semibold`
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <span>{item.label}</span>
                            {formData.documentType === item.id && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    ref={documentNumberInputRef}
                    type="text"
                    name="documentNumber"
                    placeholder="N° Documento"
                    value={formData.documentNumber}
                    onChange={handleChange}
                    className={`col-span-2 rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm ${themeColors.borderFocus} outline-none`}
                  />
                </div>

                {/* ERROR INLINE DOCUMENTO */}
                {(formErrors.documentType || formErrors.documentNumber) && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {formErrors.documentType || formErrors.documentNumber}
                  </p>
                )}

                {/* CÓDIGO DE PAÍS / TELÉFONO */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    CÓDIGO DE PAÍS / TELÉFONO
                  </label>
                  
                  <div className={`relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl ${themeColors.borderFocusGroup} transition-all shadow-inner`}>
                    
                    {/* Contenedor del Dropdown de País */}
                    <div className="relative flex items-center border-r border-slate-800 bg-slate-900/60 rounded-l-2xl z-30 shrink-0" ref={countryCodeDropdownRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsCountryCodeOpen((prev) => !prev);
                          setIsDestinationOpen(false);
                          setIsDocTypeOpen(false);
                        }}
                        className={`flex flex-row items-center gap-1.5 px-3 py-3 text-xs font-bold ${themeColors.textAccent} font-mono cursor-pointer outline-none hover:bg-slate-800/50 transition-colors rounded-l-2xl whitespace-nowrap`}
                      >
                        <Phone className={`w-3.5 h-3.5 ${themeColors.textAccent} shrink-0`} />
                        <span className="text-sm leading-none">{selectedCountryObj?.flag || "🇵🇪"}</span>
                        <span className="leading-none">{formData.countryCode || "+51"}</span>
                        <span className={`text-[10px] ${themeColors.textAccent} leading-none`}>▼</span>
                      </button>

                      {/* Menú Desplegable flotante */}
                      {isCountryCodeOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-36 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1.5 space-y-1 font-mono">
                          {COUNTRY_CODES.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFormData((prev) => ({ ...prev, countryCode: item.code }));
                                setIsCountryCodeOpen(false);
                                if (formErrors.countryCode) {
                                  setFormErrors((prev) => ({ ...prev, countryCode: undefined }));
                                }
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer flex flex-row items-center justify-between ${
                                formData.countryCode === item.code
                                  ? `${themeColors.bgAccentSoft} font-bold`
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{item.flag}</span>
                                <span>{item.code}</span>
                              </span>
                              {formData.countryCode === item.code && <span className={`${themeColors.textAccent} font-bold`}>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      ref={phoneInputRef}
                      type="tel"
                      name="phone"
                      placeholder="987 654 321"
                      value={formData.phone}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/\D/g, "");
                      }}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full bg-transparent text-xs text-white placeholder-slate-600 px-4 py-3 outline-none font-mono rounded-r-2xl"
                    />
                  </div>
                </div>

                {/* ERROR INLINE TELÉFONO */}
                {(formErrors.countryCode || formErrors.phone) && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {formErrors.countryCode || formErrors.phone}
                  </p>
                )}

                {/* 2. DATOS DEL DESTINATARIO */}
                <h3 className={`text-xs font-semibold tracking-wider uppercase pt-2 ${themeColors.textAccent}`}>
                  2. Datos del Destinatario
                </h3>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombres</label>
                  <input
                    type="text"
                    name="recipientFirstName"
                    required
                    placeholder="Ej. María Luisa"
                    value={formData.recipientFirstName}
                    onChange={handleNameChange}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${themeColors.borderFocus} transition-all`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Apellido Paterno</label>
                    <input
                      type="text"
                      name="recipientPaternalSurname"
                      required
                      placeholder="Ej. Quispe"
                      value={formData.recipientPaternalSurname}
                      onChange={handleNameChange}
                      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${themeColors.borderFocus} transition-all`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Apellido Materno</label>
                    <input
                      type="text"
                      name="recipientMaternalSurname"
                      required
                      placeholder="Ej. Torres"
                      value={formData.recipientMaternalSurname}
                      onChange={handleNameChange}
                      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${themeColors.borderFocus} transition-all`}
                    />
                  </div>
                </div>

                {/* PESTAÑAS: BANCOS Y BILLETERAS */}
                <div className="pt-2 space-y-2">
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, destinationType: "bank", recipientDestinationId: "" })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        formData.destinationType === "bank"
                          ? `${themeColors.bgAccent} text-slate-950 shadow-sm`
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🏦 Bancos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, destinationType: "wallet", recipientDestinationId: "" })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        formData.destinationType === "wallet"
                          ? `${themeColors.bgAccent} text-slate-950 shadow-sm`
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📱 Billeteras (Wallet)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 relative pt-1">
                    <div className="relative" ref={destinationDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDestinationOpen(!isDestinationOpen);
                          setIsCountryCodeOpen(false);
                          setIsDocTypeOpen(false);
                        }}
                        className={`w-full h-[42px] px-3 rounded-lg bg-slate-900 border border-slate-700 text-left text-xs flex items-center justify-between text-slate-200 ${themeColors.borderFocus} outline-none cursor-pointer`}
                      >
                        <span className="truncate">
                          {selectedDestinationObj ? selectedDestinationObj.name : (formData.destinationType === "bank" ? "Elegir Banco" : "Elegir Wallet")}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">▼</span>
                      </button>

                      {isDestinationOpen && (
                        <div className="absolute left-0 bottom-full mb-1.5 w-72 max-h-56 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-1.5 space-y-1 custom-scrollbar">
                          {filteredDestinations.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, recipientDestinationId: item.id });
                                setIsDestinationOpen(false);
                                if (formErrors.recipientDestinationId) setFormErrors({ ...formErrors, recipientDestinationId: undefined });
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                                formData.recipientDestinationId === item.id
                                  ? `${themeColors.bgAccentSoft} font-semibold`
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <span className="truncate">{item.name}</span>
                              {formData.recipientDestinationId === item.id && <span>✓</span>}
                            </button>
                          ))}
                          {filteredDestinations.length === 0 && (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No hay opciones disponibles para {receiveCurrency}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <input
                      ref={recipientAccountInputRef}
                      type="text"
                      name="recipientAccount"
                      placeholder={
                        formData.destinationType === "bank"
                          ? "N° Cuenta / IBAN / CCI"
                          : "N° Celular / Wallet"
                      }
                      minLength={9}
                      maxLength={34}
                      value={formData.recipientAccount}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        handleChange({
                          target: { name: "recipientAccount", value }
                        } as unknown as React.ChangeEvent<HTMLInputElement>);
                      }}
                      className={`col-span-2 rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm ${themeColors.borderFocus} outline-none`}
                    />
                  </div>

                  {/* ERROR INLINE DESTINO Y CUENTA */}
                  {(formErrors.recipientDestinationId || formErrors.recipientAccount) && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      {formErrors.recipientDestinationId || formErrors.recipientAccount}
                    </p>
                  )}

                  {/* LABEL DE COMISIÓN DINÁMICO */}
                  <div className="flex justify-between items-center px-1 pt-1 text-[11px] font-medium text-slate-400">
                    <span>Comisión de transferencia ({formData.destinationType === "bank" ? "Banco" : "Wallet"}):</span>
                    <span className={`${themeColors.textAccent} font-bold`}>
                      {activeCommission} {sendCurrency} {Number(activeCommission) === 0 ? "(¡Gratis!)" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-4 rounded-xl ${themeColors.bgAccent} py-3 font-semibold text-slate-950 transition-colors disabled:opacity-50 cursor-pointer`}
              >
                {isSubmitting ? "Procesando..." : "💳 Siguiente: Ver Datos de Pago"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center space-y-3 py-1">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${themeColors.bgAccentSoft} text-lg font-bold`}>
                ✓
              </div>

              <div>
                <p className={`text-[11px] font-bold tracking-widest uppercase ${themeColors.textAccent}`}>
                  ¡Casi listo! Falta tu pago
                </p>
                <h2 className="text-xl font-extrabold text-white mt-0.5">
                  Código: <span className={themeColors.textAccent}>{operationCode}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Realiza tu depósito o transferencia por el monto total de{" "}
                <strong className={`${themeColors.textAccent} font-extrabold text-sm`}>
                  {totalDepositAmount} {sendCurrency}
                </strong>{" "}
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  (Incluye {sendAmount} {sendCurrency} de envío + {activeCommission} {sendCurrency} de comisión)
                </span>
                eligiendo cualquiera de nuestras cuentas oficiales:
              </p>

              {/* CUENTAS COLECTORAS */}
              <div className="w-full max-h-72 overflow-y-auto space-y-2.5 pr-2 text-left text-xs font-mono custom-scrollbar">
                {(() => {
                  const allAccounts = CORPORATE_COLLECTOR_ACCOUNTS[sendCurrency] || CORPORATE_COLLECTOR_ACCOUNTS.EUR;
                  
                  const filteredAccounts = allAccounts.filter((acc) => {
                    if (formData.destinationType === "bank") {
                      return acc.type === "Banco" || acc.type === "IBAN";
                    } else {
                      return acc.type === "Wallet";
                    }
                  });

                  const accountsToDisplay = filteredAccounts.length > 0 ? filteredAccounts : allAccounts;

                  return accountsToDisplay.map((acc) => {
                    const isSelected = selectedCollectorAccount?.id === acc.id;

                    return (
                      <div 
                        key={acc.id} 
                        className={`rounded-xl bg-slate-950/90 border p-3 space-y-2 transition-all shadow-inner ${
                          isSelected ? themeColors.ringAccent : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
                          <span className={`font-bold ${themeColors.textAccent} flex items-center gap-1.5`}>
                            <span>{acc.type === "Wallet" ? "[Wallet]" : "[Banco]"}</span> {acc.name}
                            {isSelected && <span className={`text-[9px] ${themeColors.badgeAccent} px-1.5 py-0.5 rounded font-sans font-bold ml-1`}>SELECCIONADA</span>}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                            {acc.holder}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-400 text-[11px]">{acc.type === "Wallet" ? "N° Celular:" : "N° Cuenta / IBAN:"}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white select-all text-xs bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 font-mono">
                              {acc.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc.accountNumber, `${acc.id}-acc`, acc)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                copiedKey === `${acc.id}-acc`
                                  ? themeColors.badgeAccent
                                  : `bg-slate-900 hover:bg-slate-800 ${themeColors.textAccent} border border-slate-700`
                              }`}
                            >
                              {copiedKey === `${acc.id}-acc` ? "¡Copiado! ✓" : "Copiar"}
                            </button>
                          </div>
                        </div>

                        {acc.cci && (
                          <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                            <span className="text-slate-400 text-[11px]">CCI Interbancario:</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${themeColors.textAccent} select-all text-[11px] bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 font-mono`}>
                                {acc.cci}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(acc.cci!, `${acc.id}-cci`, acc)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  copiedKey === `${acc.id}-cci`
                                    ? themeColors.badgeAccent
                                    : `bg-slate-900 hover:bg-slate-800 ${themeColors.textAccent} border border-slate-700`
                                }`}
                              >
                                {copiedKey === `${acc.id}-cci` ? "¡Copiado! ✓" : "Copiar"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <button
                type="button"
                onClick={handleWhatsAppRedirect}
                className={`w-full rounded-xl ${themeColors.bgAccent} py-3 font-semibold text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2`}
              >
                Enviar Comprobante por WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};