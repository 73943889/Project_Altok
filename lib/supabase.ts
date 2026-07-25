import { createBrowserClient } from '@supabase/ssr'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "")
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ [Supabase Warning]: Las variables de entorno de Supabase no están definidas correctamente."
  );
}

export const supabase = createBrowserClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);