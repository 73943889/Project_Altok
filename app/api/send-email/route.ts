import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, operationCode, status, sendAmount, sendCurrency, receiveAmount, receiveCurrency } = body;

    if (!email || !operationCode || !status) {
      return NextResponse.json(
        { error: "Faltan parámetros obligatorios para el envío." },
        { status: 400 }
      );
    }

    // Instanciación Lazy: se ejecuta en runtime y no durante 'next build'
    const resend = new Resend(env.RESEND_API_KEY);

    // Configuración del contenido según el estado
    let subject = `Actualización de tu Remesa ${operationCode} - Altok€`;
    let statusMessage = "";
    let statusColor = "#10b981"; // Emerald-500

    switch (status) {
      case "PENDIENTE":
        subject = `📋 Orden Registrada (${operationCode}) - Altok€`;
        statusMessage = "Hemos registrado tu solicitud de remesa. Por favor realiza el depósito a nuestras cuentas oficiales para proceder con la validación.";
        statusColor = "#f59e0b"; // Amber-500
        break;
      case "EN_PROCESO":
        subject = `⏳ Orden en Proceso (${operationCode}) - Altok€`;
        statusMessage = "Hemos verificado tu depósito. Tu transferencia está siendo enviada a la cuenta de destino en Perú/España.";
        statusColor = "#3b82f6"; // Blue-500
        break;
      case "COMPLETADO":
        subject = `✅ ¡Transferencia Exitosa! (${operationCode}) - Altok€`;
        statusMessage = "¡Tu dinero ha sido abonado con éxito en la cuenta de destino! Gracias por confiar en Altok€.";
        statusColor = "#10b981"; // Emerald-500
        break;
      case "RECHAZADO":
        subject = `❌ Orden Incompleta/Rechazada (${operationCode}) - Altok€`;
        statusMessage = "No pudimos validar la transacción. Por favor comunícate con nuestro equipo de soporte por WhatsApp.";
        statusColor = "#ef4444"; // Red-500
        break;
    }

    // Plantilla HTML Responsive
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 20px; }
            .card { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 550px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px; }
            .brand { color: #10b981; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; background-color: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40; margin-bottom: 16px; }
            .details { background-color: #020617; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 14px; border: 1px solid #1e293b; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #0f172a; }
            .label { color: #94a3b8; }
            .value { color: #f8fafc; font-weight: 600; }
            .footer { text-align: center; font-size: 12px; color: #f8fafc; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">Altok€</div>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Plataforma de Remesas Perú ↔ España</p>
            </div>
            
            <div style="text-align: center;">
              <span class="badge">${status}</span>
              <h2 style="margin: 0 0 12px 0; font-size: 20px;">Hola, ${fullName}</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 0;">${statusMessage}</p>
            </div>

            <div class="details">
              <div class="row">
                <span class="label">Código de Operación:</span>
                <span class="value" style="color: #10b981; font-family: monospace;">${operationCode}</span>
              </div>
              <div class="row">
                <span class="label">Monto Enviado:</span>
                <span class="value">${sendAmount} ${sendCurrency}</span>
              </div>
              <div class="row">
                <span class="label">Monto a Recibir:</span>
                <span class="value">${receiveAmount} ${receiveCurrency}</span>
              </div>
            </div>

            <div class="footer">
              <p>Este es un correo automático generado por Altok€. No respondas a esta dirección.</p>
              <p>© 2026 Altok€ SAC. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL || "Altok€ <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlTemplate,
    });

    if (error) {
      console.error("❌ Error devuelto por la API de Resend:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Correo despachado con éxito. Resend ID:", data?.id);
    return NextResponse.json({ success: true, resendId: data?.id });
  } catch (error: any) {
    console.error("❌ Excepción en /api/send-email:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}