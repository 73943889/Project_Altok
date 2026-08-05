import { getTreasuryOperationsAction } from "@/app/actions/treasury";
import TreasuryClient from "./AdminTreasuryClient";

export const dynamic = "force-dynamic";

export default async function TreasuryDashboardPage() {
  const res = await getTreasuryOperationsAction();
  const initialOperations = res.success ? res.operations : [];
  return <TreasuryClient initialOperations={initialOperations} />;
}