"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getAdminOperations, updateTransactionStatusAction } from "@/app/actions/admin-dashboard";
import { ClientOperation, TransactionStatus } from "@/src/types/admin";
import { AdminNavbar } from "@/app/admin/AdminNavbar";
import {
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminContentProps {
  userEmail?: string;
}

export function AdminContent({ userEmail }: AdminContentProps) {
  const [operations, setOperations] = useState<ClientOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [selectedOperation, setSelectedOperation] = useState<ClientOperation | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

// 🛡️ Estados para controlar el modal personalizado de rechazo
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [transactionToRejectId, setTransactionToRejectId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>("");


  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await getAdminOperations();
      if (!res.success || !res.transactions) {
        throw new Error(res.error || "Error al obtener operaciones");
      }

      const formattedData: ClientOperation[] = res.transactions.map((tx: any) => ({
        ...tx,
        full_name: tx.full_name || "Remitente no registrado",
        email: tx.email || "Sin correo",
        document_type: tx.document_type || "DNI",
        document_number: tx.document_number || "S/N",
        phone: tx.phone || "S/N",
        recipient_name: tx.recipient_name || "Destinatario no especificado",
        recipient_bank: tx.recipient_bank || "Banco no especificado",
        recipient_account: tx.recipient_account || "Sin cuenta",
        send_amount: Number(tx.send_amount || 0),
        receive_amount: Number(tx.receive_amount || 0),
        send_currency: tx.send_currency || "EUR",
        receive_currency: tx.receive_currency || "PEN",
        operation_code: tx.operation_code || tx.id?.slice(0, 8) || "N/A",
        status: (tx.status || "PENDIENTE") as TransactionStatus,
      }));

      setOperations(formattedData);
    } catch (err: any) {
      console.error("❌ Error crítico en fetchOperations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: TransactionStatus) => {
    // Si selecciona RECHAZADO, abrimos nuestro modal personalizado en vez del prompt nativo
    if (newStatus === "RECHAZADO") {
      setTransactionToRejectId(id);
      setRejectionReasonInput("");
      setRejectModalOpen(true);
      return;
    }

    // Para los demás estados, procesamos de forma habitual
    await executeStatusUpdate(id, newStatus, null);
  };

  const executeStatusUpdate = async (id: string, newStatus: TransactionStatus, internalNotes: string | null) => {
    const previousOperations = [...operations];
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, status: newStatus } : op))
    );

    if (selectedOperation?.id === id) {
      setSelectedOperation((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    setUpdatingId(id);

    try {
      const res = await updateTransactionStatusAction(id, newStatus, internalNotes);
      if (!res.success) {
        throw new Error(res.error || "Error al actualizar estado");
      }
      await fetchOperations();
    } catch (err: any) {
      alert(`Error actualizando estado: ${err.message}`);
      setOperations(previousOperations);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmRejection = async () => {
    if (!rejectionReasonInput || rejectionReasonInput.trim() === "") {
      alert("El motivo del rechazo es obligatorio.");
      return;
    }

    if (!transactionToRejectId) return;

    const id = transactionToRejectId;
    const reason = rejectionReasonInput.trim();

    setRejectModalOpen(false);
    setTransactionToRejectId(null);
    setRejectionReasonInput("");

    await executeStatusUpdate(id, "RECHAZADO", reason);
  };

  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        String(op.operation_code || op.id || "").toLowerCase().includes(query) ||
        String(op.full_name || "").toLowerCase().includes(query) ||
        String(op.email || "").toLowerCase().includes(query) ||
        String(op.document_number || "").toLowerCase().includes(query) ||
        String(op.recipient_name || "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "TODOS" || op.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [operations, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage) || 1;
  
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOperations.slice(start, start + itemsPerPage);
  }, [filteredOperations, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const totalCount = operations.length;
    const pendingCount = operations.filter((o) => o.status === "PENDIENTE").length;
    const completedOps = operations.filter((o) => o.status === "COMPLETADO");
    const completedCount = completedOps.length;
    const rejectedCount = operations.filter((o) => o.status === "RECHAZADO").length;
    const inProcessCount = operations.filter((o) => o.status === "EN_PROCESO").length;

    const totalEur = completedOps
      .filter((o) => o.send_currency === "EUR")
      .reduce((acc, curr) => acc + curr.send_amount, 0);

    const totalPen = completedOps
      .reduce((acc, curr) => {
        if (curr.receive_currency === "PEN") return acc + Number(curr.receive_amount || 0);
        if (curr.send_currency === "PEN") return acc + Number(curr.send_amount || 0);
        return acc;
      }, 0);

    return { totalCount, pendingCount, completedCount, rejectedCount, inProcessCount, totalEur, totalPen };
  }, [operations]);

  const exportToCSV = () => {
    const headers = ["Codigo,Fecha,Cliente,Email,Documento,Telefono,Destinatario,Banco,Cuenta,Enviado,MonedaEnvio,Recibido,MonedaRecibo,Estado"];
    const rows = filteredOperations.map((op) =>
      [
        op.operation_code || op.id,
        new Date(op.created_at).toLocaleString(),
        `"${op.full_name}"`,
        op.email,
        `${op.document_type}: ${op.document_number}`,
        op.phone || "",
        `"${op.recipient_name}"`,
        op.recipient_bank,
        `"${op.recipient_account}"`,
        op.send_amount,
        op.send_currency,
        op.receive_amount,
        op.receive_currency,
        op.status,
      ].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Altok€_Reporte_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETADA
          </span>
        );
      case "EN_PROCESO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> EN_PROCESO
          </span>
        );
      case "RECHAZADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> RECHAZADA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> PENDIENTE
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Pasamos el correo real recibido desde el servidor a la barra de navegación */}
      <AdminNavbar userEmail={userEmail} />

      <main className="max-w-7xl mx-auto px-6 space-y-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Control de Operaciones</h1>
            <p className="text-xs text-slate-400 mt-1">Monitoreo en tiempo real de remesas y estados de liquidación.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOperations}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              Actualizar
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* MÉTRICAS KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalCount}</span>
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Pendientes</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{stats.pendingCount}</span>
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">En Proceso</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">{stats.inProcessCount}</span>
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Completadas</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{stats.completedCount}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Rechazadas</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{stats.rejectedCount}</span>
              <div className="w-2 h-2 rounded-full bg-rose-400" />
            </div>
          </div>
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADO">Completada</option>
              <option value="RECHAZADO">Rechazada</option>
            </select>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-xl min-h-[520px] flex flex-col justify-between">
          <div className="overflow-x-auto p-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/50 rounded-t-3xl">
                  <th className="p-4">Código / Fecha</th>
                  <th className="p-4">Remitente</th>
                  <th className="p-4">Enviado</th>
                  <th className="p-4">Destinatario</th>
                  <th className="p-4">Recibe</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Cargando operaciones...
                    </td>
                  </tr>
                ) : paginatedOperations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-slate-500">
                      No se encontraron transacciones.
                    </td>
                  </tr>
                ) : (
                  paginatedOperations.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-emerald-400">{op.operation_code}</div>
                        <div className="text-[10px] text-slate-500">{new Date(op.created_at).toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{op.full_name}</div>
                        <div className="text-[11px] text-slate-400">{op.email}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">{op.send_amount} {op.send_currency}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{op.recipient_name}</div>
                        <div className="text-[11px] text-slate-400">{op.recipient_bank}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{op.receive_amount} {op.receive_currency}</td>
                      <td className="p-4">{getStatusBadge(op.status)}</td>
                      
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOperation(op)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                            title="Ver detalles"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <div className="relative">
                            <select
                              value={op.status}
                              disabled={updatingId === op.id}
                              onChange={(e) => handleStatusChange(op.id, e.target.value as TransactionStatus)}
                              className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/50 hover:border-emerald-400 text-xs font-semibold text-emerald-300 outline-none cursor-pointer shadow-lg transition-all appearance-none pr-8"
                            >
                              <option value="PENDIENTE" className="bg-slate-900 text-amber-400 font-semibold">PENDIENTE</option>
                              <option value="EN_PROCESO" className="bg-slate-900 text-sky-400 font-semibold">EN PROCESO</option>
                              <option value="COMPLETADO" className="bg-slate-900 text-emerald-400 font-semibold">COMPLETADA</option>
                              <option value="RECHAZADO" className="bg-slate-900 text-rose-400 font-semibold">RECHAZADA</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-400">
                              <span className="text-[10px] font-bold">▼</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN INFERIOR */}
          {!loading && filteredOperations.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 rounded-b-3xl mt-auto">
              <div>
                Mostrando <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                <span className="font-bold text-white">
                  {Math.min(currentPage * itemsPerPage, filteredOperations.length)}
                </span>{" "}
                de <span className="font-bold text-white">{filteredOperations.length}</span> operaciones
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>

                <div className="px-3 py-2 font-mono font-bold text-emerald-400 bg-slate-950 border border-slate-800 rounded-xl">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL DETALLE */}
        {selectedOperation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 text-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">ORDEN DE REMESA</span>
                  <h3 className="text-xl font-bold text-white">{selectedOperation.operation_code || selectedOperation.id}</h3>
                </div>
                <button onClick={() => setSelectedOperation(null)} className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-500 font-semibold uppercase tracking-wider mb-2">REMITENTE</p>
                  <p className="font-bold text-white text-sm">{selectedOperation.full_name}</p>
                  <p className="text-slate-400">{selectedOperation.email}</p>
                  <p className="text-slate-400">{selectedOperation.phone}</p>
                  <p className="text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
                    {selectedOperation.document_type}: {selectedOperation.document_number}
                  </p>
                </div>

                <div className="space-y-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-500 font-semibold uppercase tracking-wider mb-2">DESTINATARIO</p>
                  <p className="font-bold text-white text-sm">{selectedOperation.recipient_name}</p>
                  <p className="text-slate-400">Banco: <span className="text-white font-medium">{selectedOperation.recipient_bank}</span></p>
                  <p className="text-slate-400 font-mono select-all mt-1 pt-1 border-t border-slate-800/80">
                    Cuenta: <span className="text-emerald-400 font-bold">{selectedOperation.recipient_account}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🛡️ MODAL PROFESIONAL DE RECHAZO */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-5 text-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="text-base font-bold text-white tracking-wide">Motivo de Rechazo</h3>
                </div>
                <button 
                  onClick={() => {
                    setRejectModalOpen(false);
                    setTransactionToRejectId(null);
                  }} 
                  className="text-slate-400 hover:text-white cursor-pointer text-sm font-bold bg-slate-800/60 p-1.5 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Por favor, ingrese el motivo detallado del rechazo. Esta nota se registrará en el sistema para auditoría interna:
                </p>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Ej. Comprobante ilegible o monto transferido no coincide..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500 transition-all resize-none font-sans shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setTransactionToRejectId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmRejection}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}