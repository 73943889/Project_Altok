import { query } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import AdminTasaClient from "./AdminTasaClient";

export const dynamic = "force-dynamic";

export default async function AdminTasaPage() {
  noStore();
  
  let initialRates: any[] = [];
  try {
    const res = await query('SELECT key, value FROM public.site_config');
    initialRates = Array.isArray(res) ? res : res?.rows || [];
  } catch (err) {
    console.error("Error al obtener tasas en el Server Component:", err);
  }

  return <AdminTasaClient initialRates={initialRates} />;
}