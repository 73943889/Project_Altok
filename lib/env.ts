import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

const envSchema = z.object({
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(1, { message: "DATABASE_URL es obligatoria para conectar a Neon SQL." })
  ),

  JWT_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(1, { message: "JWT_SECRET es obligatoria para la autenticación." })
  ),

  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().catch("http://localhost:3000")
  ),

  RESEND_API_KEY: z.preprocess(
    emptyToUndefined,
    z.string().startsWith("re_").catch("re_dummy_key_for_build_purposes")
  ),

  RESEND_FROM_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().catch("onboarding@resend.dev")
  ),

  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(["development", "test", "production"]).default("development")
  ),
});

const _env = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!_env.success) {
  console.error("❌ Error crítico en variables obligatorias (DATABASE_URL / JWT_SECRET):");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  throw new Error("Variables de entorno críticas mal configuradas. Revisa la consola.");
}

export const env = _env.data;