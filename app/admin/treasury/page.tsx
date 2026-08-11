import { cookies } from "next/headers";
import { getTreasuryOperationsAction } from "@/app/actions/treasury";
import TreasuryClient from "./AdminTreasuryClient";

export const dynamic = "force-dynamic";

export default async function TreasuryDashboardPage() {
  // 1. Extraemos las cookies en el Server Component
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "danielgastelusotelo@gmail.com";

  const res = await getTreasuryOperationsAction();
  const initialOperations = res.success ? res.operations : [];

  // 2. Pasamos el userEmail al componente cliente
  return <TreasuryClient initialOperations={initialOperations} userEmail={userEmail} />;
}