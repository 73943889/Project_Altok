import { z } from 'zod';
import { DESTINATION_BANK_IDS, DESTINATION_OPTIONS } from '@/lib/constants';

// =============================================================================
// 1. ESQUEMAS DE AUTENTICACIÓN & SESIÓN
// =============================================================================

export const LoginRequestSchema = z.object({
  email: z
    .string({ message: 'El correo electrónico es obligatorio' })
    .email('Formato de correo electrónico inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const RegisterRequestSchema = z.object({
  fullName: z
    .string()
    .min(3, "El nombre completo debe tener al menos 3 caracteres")
    .max(150, "El nombre completo es demasiado largo"),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .max(100),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(64),
  phone: z
    .string()
    .regex(/^\+\d{1,4}\s?\d{6,14}$/, "Formato de teléfono no válido"),
  timezone: z
    .string()
    .optional(),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido').toLowerCase().trim(),
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().uuid('Token de recuperación inválido'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

// =============================================================================
// 2. ESQUEMAS DE TASAS DE CAMBIO (SITE_CONFIG)
// =============================================================================

export const UpdateRatesRequestSchema = z.object({
  key: z.enum(
    ['exchange_rate_buy', 'exchange_rate_sell_usd', 'transfer_commission_bank', 'transfer_commission_wallet'],
    { message: 'Clave de configuración no válida' }
  ),
  value: z
    .number({ message: 'El valor numérico es obligatorio' })
    .positive('El valor de la tasa debe ser mayor a 0')
    .max(10, 'Tasa fuera del rango operativo permitido'),
});

// =============================================================================
// 3. ESQUEMAS DE TRANSACCIONES / REMESAS
// =============================================================================

export const CreateTransactionRequestSchema = z
  .object({
    sendAmount: z
      .number({ message: 'El monto de envío es obligatorio' })
      .positive('El monto debe ser superior a 0')
      .min(10, 'El monto mínimo de envío es 10.00')
      .max(10000, 'El monto máximo por transacción KYC Estándar es 10,000.00'),

    sendCurrency: z.enum(['EUR', 'USD', 'PEN'], {
      message: 'Divisa de origen no soportada',
    }),

    receiveCurrency: z.enum(['EUR', 'USD', 'PEN'], {
      message: 'Divisa de destino no soportada',
    }),

    recipientName: z
      .string()
      .min(3, 'Nombre del destinatario obligatorio')
      .max(150)
      .trim(),

    recipientBank: z.enum(DESTINATION_BANK_IDS, {
      message: 'Banco o billetera de destino no válida',
    }),

    recipientAccount: z
      .string()
      .min(5, 'Número de cuenta inválido')
      .max(34, 'Número de cuenta demasiado largo')
      .trim(),

    commissionType: z.enum(['bank', 'wallet']).default('bank'),
  })
  .refine(
    (data) => {
      const validPairs = [
        ['EUR', 'PEN'],
        ['USD', 'PEN'],
        ['PEN', 'EUR'],
        ['PEN', 'USD'],
      ];
      return validPairs.some(
        ([send, receive]) => data.sendCurrency === send && data.receiveCurrency === receive
      );
    },
    {
      message: 'La combinación de divisas no está permitida',
      path: ['receiveCurrency'],
    }
  )
  .refine(
    (data) => {
      const destination = DESTINATION_OPTIONS.find((option) => option.id === data.recipientBank);
      if (!destination) return false;
      return destination.country === data.receiveCurrency;
    },
    {
      message: 'El banco o billetera seleccionada no corresponde a la divisa de destino',
      path: ['recipientBank'],
    }
  );

// =============================================================================
// 4. ESQUEMA DE ENVÍO DE CORREOS
// =============================================================================

export const SendEmailRequestSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido').toLowerCase().trim(),
  fullName: z.string().min(2, 'El nombre es obligatorio'),
  operationCode: z.string().min(4, 'Código de operación requerido'),
  status: z.enum(['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO']),
  sendAmount: z.number().positive(),
  sendCurrency: z.enum(['EUR', 'USD', 'PEN']),
  receiveAmount: z.number().positive(),
  receiveCurrency: z.enum(['EUR', 'USD', 'PEN']),
});

// Tipados exportados unificados (Única declaración de RegisterRequest)
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type UpdateRatesRequest = z.infer<typeof UpdateRatesRequestSchema>;
export type CreateTransactionRequest = z.infer<typeof CreateTransactionRequestSchema>;
export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}