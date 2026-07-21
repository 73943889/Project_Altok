import { createClient } from "@supabase/supabase-js";

// Sanitización de la URL base para asegurar que no contenga sufijos REST
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ [Supabase Warning]: Las variables de entorno de Supabase no están definidas correctamente."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});