import { cookies } from "next/headers";
import { getAdminUsersAction } from "@/app/actions/users";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "danielgastelusotelo@gmail.com";

  const res = await getAdminUsersAction();
  const initialUsers = res.success ? res.users : [];

  return <AdminUsersClient initialUsers={initialUsers} userEmail={userEmail} />;
}