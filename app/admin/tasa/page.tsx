import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import AdminTasaClient from "./AdminTasaClient";

export const dynamic = "force-dynamic";

export default async function AdminTasaPage() {
  noStore();
  
  // 1. Extraemos las cookies en el Server Component
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "danielgastelusotelo@gmail.com";

  let initialRates: any[] = [];
  try {
    const res = await query('SELECT key, value FROM public.site_config');
    initialRates = Array.isArray(res) ? res : res?.rows || [];
  } catch (err) {
    console.error("Error al obtener tasas en el Server Component:", err);
  }

  // 2. Pasamos el userEmail al componente cliente
  return <AdminTasaClient initialRates={initialRates} userEmail={userEmail} />;
}