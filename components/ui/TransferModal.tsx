import React, { useState } from "react";
import { supabase } from "@/lib/supabase"; // Asegúrate de que la ruta coincida con tu cliente de Supabase

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sendAmount: number;
  sendCurrency: "EUR" | "PEN";
  receiveAmount: number | string; // Soporta number o string sin errores de TS
  receiveCurrency: "EUR" | "PEN";
}

interface TransferFormData {
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  recipientName: string;
  recipientBank: string;
  recipientAccount: string;
}

// Valores iniciales limpios para el reseteo
const INITIAL_FORM_DATA: TransferFormData = {
  fullName: "",
  email: "",
  documentType: "DNI",
  documentNumber: "",
  phone: "",
  recipientName: "",
  recipientBank: "CaixaBank",
  recipientAccount: "",
};

// Configuración de las cuentas corporativas de recaudo de VALORA TRANSFER
const BANK_ACCOUNTS = {
  EUR: {
    titular: "VALORA TRANSFER SAC",
    bank: "BBVA España (IBAN)",
    accountNumber: "ES91 0182 2345 99 0123456789",
  },
  PEN: {
    titular: "VALORA TRANSFER SAC",
    bank: "BCP Perú (Cuenta Corriente Soles)",
    accountNumber: "191-98765432-0-12 / CCI: 00219100987654320123",
  },
};

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  sendAmount,
  sendCurrency,
  receiveAmount,
  receiveCurrency,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [operationCode, setOperationCode] = useState("");
  const [formData, setFormData] = useState<TransferFormData>(INITIAL_FORM_DATA);

  if (!isOpen) return null;

  // Selección dinámica de la cuenta bancaria para el depósito según la moneda de origen[cite: 5]
  const bankDetails = BANK_ACCOUNTS[sendCurrency] || BANK_ACCOUNTS.EUR;

  // 🧹 FUNCIÓN DE RESETEO INTEGRAL POST-OPERACIÓN O AL CERRAR
  const handleFullReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setOperationCode("");
    setIsCompleted(false);
    setIsSubmitting(false);
    onClose(); // Ejecuta el cierre enviado desde el padre[cite: 5]
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Generar código de operación único[cite: 5]
      const generatedCode = `VT-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. REGISTRO/ACTUALIZACIÓN DEL CLIENTE[cite: 5]
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .upsert(
          [
            {
              full_name: formData.fullName,
              email: formData.email,
              document_type: formData.documentType,
              document_number: formData.documentNumber,
              phone: formData.phone,
            },
          ],
          { onConflict: "document_number" }
        )
        .select("id")
        .single();

      if (clientError) {
        console.error("Error al registrar cliente en Supabase:", clientError);
        alert(`Error al guardar datos del remitente: ${clientError.message}`);
        return;
      }

      // 3. REGISTRO DE LA TRANSACCIÓN[cite: 5]
      const { error: txError } = await supabase.from("transactions").insert([
        {
          client_id: clientData.id,
          operation_code: generatedCode,
          send_amount: sendAmount,
          send_currency: sendCurrency,
          receive_amount: receiveAmount,
          receive_currency: receiveCurrency,
          recipient_name: formData.recipientName,
          recipient_bank: formData.recipientBank,
          recipient_account: formData.recipientAccount,
          status: "PENDIENTE",
        },
      ]);

      if (txError) {
        console.error("Error al registrar transacción en Supabase:", txError);
        alert(`Error al crear la orden de transferencia: ${txError.message}`);
        return;
      }

      // 4. Éxito[cite: 5]
      setOperationCode(generatedCode);
      setIsCompleted(true);
    } catch (err: any) {
      console.error("Error inesperado en el servidor:", err);
      alert("Error inesperado al procesar la transferencia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generación del enlace dinámico hacia WhatsApp[cite: 5]
  const handleWhatsAppRedirect = () => {
    const whatsappPhone = "51987408496";

    const lines = [
      "\uD83D\uDE80 \u00A1Hola Valora Transfer!",
      `Acabo de generar la orden de transferencia *${operationCode}*.`,
      "",
      "\uD83D\uDCCD *Detalles del Env\u00EDo:*",
      `- Monto Enviado: ${sendAmount} ${sendCurrency}`,
      `- Monto a Recibir: ${receiveAmount} ${receiveCurrency}`,
      `- Remitente: ${formData.fullName} (${formData.documentType}: ${formData.documentNumber})`,
      `- Destinatario: ${formData.recipientName}`,
      `- Banco Destino: ${formData.recipientBank}`,
      `- N\u00B0 Cuenta / CCI / IBAN: ${formData.recipientAccount}`,
      "",
      "Adjunto mi comprobante de pago realizado a la cuenta de recaudo:",
      `\uD83C\uDFE6 ${bankDetails.bank}`,
      `\uD83D\uDCB3 ${bankDetails.accountNumber}`,
    ];

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

      // 1. Abrir WhatsApp[cite: 5]
      window.open(url, "_blank", "noopener,noreferrer");

      // 2. ⚡ RESETEAR Y CERRAR EL MODAL TRAS ENVIAR A WHATSAPP
      handleFullReset();
    } catch (error) {
      console.error("Error al abrir WhatsApp:", error);
      const fallbackUrl = `https://wa.me/${whatsappPhone}?text=Hola%20Valora%20Transfer,%20orden%20*${operationCode}*`;
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      
      // ⚡ RESETEAR EN CASO DE FALLBACK
      handleFullReset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 p-6 text-white shadow-2xl">
        {/* Botón X de Cierre con Reseteo Garantizado */}
        <button
          onClick={handleFullReset}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {!isCompleted ? (
          /* PASO 1: FORMULARIO DE REGISTRO */
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center">Datos de la Remesa</h2>
            <p className="text-center text-emerald-400 text-sm font-medium">
              Enviarás {sendAmount} {sendCurrency} para abonar {receiveAmount} {receiveCurrency}
            </p>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                1. Tus Datos (Remitente)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nombre y Apellidos"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
                >
                  <option value="DNI">DNI (Perú)</option>
                  <option value="NIE">NIE (España)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="CE">Carné Extranjería</option>
                </select>
                <input
                  type="text"
                  name="documentNumber"
                  placeholder="N° Documento"
                  required
                  value={formData.documentNumber}
                  onChange={handleChange}
                  className="col-span-2 rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <input
                type="tel"
                name="phone"
                placeholder="Teléfono / WhatsApp (+51... / +34...)"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
              />

              <h3 className="text-xs font-semibold text-emerald-400 tracking-wider uppercase pt-2">
                2. Datos del Destinatario
              </h3>
              <input
                type="text"
                name="recipientName"
                placeholder="Nombre completo del beneficiario"
                required
                value={formData.recipientName}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
              />

              <div className="grid grid-cols-3 gap-2">
                <select
                  name="recipientBank"
                  value={formData.recipientBank}
                  onChange={handleChange}
                  className="rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
                >
                  <option value="BCP">BCP</option>
                  <option value="BBVA">BBVA</option>
                  <option value="Interbank">Interbank</option>
                  <option value="CaixaBank">CaixaBank</option>
                  <option value="Santander">Santander</option>
                  <option value="Sabadell">Sabadell</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                </select>
                <input
                  type="text"
                  name="recipientAccount"
                  placeholder="N° Cuenta / IBAN / CCI"
                  required
                  value={formData.recipientAccount}
                  onChange={handleChange}
                  className="col-span-2 rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 rounded-xl bg-emerald-500 py-3 font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Procesando..." : "🚀 Generar Orden de Transferencia"}
            </button>
          </form>
        ) : (
          /* PASO 2: PANTALLA DE ÉXITO CON DATOS DE CUENTA DINÁMICOS */
          <div className="flex flex-col items-center text-center space-y-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xl font-bold">
              ✓
            </div>

            <div>
              <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                ¡Orden Creada con Éxito!
              </p>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Código: <span className="text-emerald-400">{operationCode}</span>
              </h2>
            </div>

            <p className="text-sm text-slate-300">
              Realiza el depósito por{" "}
              <strong className="text-white">
                {sendAmount} {sendCurrency}
              </strong>{" "}
              a la siguiente cuenta oficial corporativa de VALORA TRANSFER:
            </p>

            <div className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-2 text-left text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Titular:</span>
                <span className="font-bold text-white">{bankDetails.titular}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Banco Recaudador:</span>
                <span className="font-bold text-white">{bankDetails.bank}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">N° Cuenta Depósito:</span>
                <span className="font-bold text-emerald-400 select-all">
                  {bankDetails.accountNumber}
                </span>
              </div>
            </div>

            <button
              onClick={handleWhatsAppRedirect}
              className="w-full rounded-xl bg-emerald-500 py-3.5 font-semibold text-slate-950 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              Enviar Comprobante por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};