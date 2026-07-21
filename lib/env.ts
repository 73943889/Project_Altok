import { z } from "zod";

const envSchema = z.object({
// Supabase (Cliente y Servidor)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "La variable NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida.",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "La variable NEXT_PUBLIC_SUPABASE_ANON_KEY es obligatoria.",
  }),
  
  // Resend (Servidor)
  RESEND_API_KEY: z.string().startsWith("re_", {
    message: "La variable RESEND_API_KEY de Resend debe comenzar con 're_'.",
  }),
  RESEND_FROM_EMAIL: z.string().email({
    message: "La variable RESEND_FROM_EMAIL debe ser un correo electrónico válido.",
  }),
  
  // Entorno de ejecución
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// Parseo y validación contra process.env
const _env = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!_env.success) {
  console.error("❌ Error crítico: Configuración de variables de entorno inválida:");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  throw new Error("Variables de entorno mal configuradas. Revisa la consola para más detalles.");
}

export const env = _env.data;