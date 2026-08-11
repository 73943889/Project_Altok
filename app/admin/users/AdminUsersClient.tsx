"use client";

import React, { useState, useMemo } from "react";
import { AdminNavbar } from "@/app/admin/AdminNavbar";
import { updateUserRoleAction, toggleUserStatusAction } from "@/app/actions/users";
import { Users, Shield, UserCheck, UserX, Search, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  role: string; // Permitimos flexibilidad para aceptar tanto 'admin', 'client', 'ADMIN' o 'CLIENTE'
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersClient({ initialUsers, userEmail }: { initialUsers: UserItem[]; userEmail?: string }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    const previous = [...users];
    
    const normalizedRole = newRole.toUpperCase() as "ADMIN" | "CLIENTE";
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: normalizedRole } : u));

    // Aserción estricta de tipo para cumplir con el contrato de la Server Action
    const res = await updateUserRoleAction(userId, normalizedRole);
    if (!res.success) {
      alert("Error al actualizar el rol del usuario.");
      setUsers(previous);
    }
    setLoadingId(null);
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    const previous = [...users];
    
    // El nuevo estado es estrictamente lo opuesto al estado actual que tiene el usuario
    const targetStatus = !currentStatus;

    // Actualización optimista local de la UI
    setUsers((prev) => 
      prev.map((u) => (u.id === userId ? { ...u, is_active: targetStatus } : u))
    );

    // Llamada a la Server Action enviando el estado actual para que el backend lo invierta de forma segura
    const res = await toggleUserStatusAction(userId, currentStatus);
    
    if (!res.success) {
      alert("Error al actualizar el estado del usuario en la base de datos.");
      setUsers(previous); // Revertir en caso de fallo
    }
    
    setLoadingId(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      return (
        String(u.full_name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <AdminNavbar userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-6 space-y-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                Seguridad & Accesos
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Gestión de Usuarios y Roles (RBAC)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Administra los permisos de acceso al backoffice y habilita o inhabilita cuentas de clientes de forma instantánea.
            </p>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto p-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/50">
                  <th className="p-4">Usuario / Correo</th>
                  <th className="p-4">Fecha de Registro</th>
                  <th className="p-4">Rol Asignado</th>
                  <th className="p-4">Estado de Cuenta</th>
                  <th className="p-4 text-right">Acciones de Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-slate-500">
                      No se encontraron usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    // Normalizamos el rol actual del usuario para que coincida con las opciones del selector
                    const currentRoleNormalized = (u.role || "CLIENTE").toUpperCase();
                    const isAdmin = currentRoleNormalized === "ADMIN";

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-white">{u.full_name || "Sin nombre"}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/D"}
                        </td>
                        <td className="p-4">
                          <select
                            value={isAdmin ? "ADMIN" : "CLIENTE"}
                            disabled={loadingId === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`px-3 py-2 rounded-xl bg-slate-900 border text-xs font-semibold outline-none cursor-pointer shadow-lg transition-all ${
                              isAdmin
                                ? "border-emerald-500/50 text-emerald-300"
                                : "border-slate-700 text-slate-300"
                            }`}
                          >
                            <option value="CLIENTE" className="bg-slate-900 text-slate-300">CLIENTE</option>
                            <option value="ADMIN" className="bg-slate-900 text-emerald-400">ADMIN</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <UserCheck className="w-3.5 h-3.5" /> ACTIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <UserX className="w-3.5 h-3.5" /> INHABILITADO
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleStatusToggle(u.id, u.is_active)}
                            disabled={loadingId === u.id}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              u.is_active
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {u.is_active ? "Inhabilitar Cuenta" : "Habilitar Cuenta"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}