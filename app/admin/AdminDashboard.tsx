'use server';

import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/db";
import { ClientOperation, TransactionStatus } from "@/src/types/admin";
import { AdminNavbar } from "@/app/admin/AdminNavbar";
import {
  Search,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminDashboard() {
  const [operations, setOperations] = useState<ClientOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [selectedOperation, setSelectedOperation] = useState<ClientOperation | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estados para la Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cierra el menú desplegable al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      // 1. Consulta relacional: Trae las transacciones combinadas con la tabla de clientes
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select(`
          *,
          clients (
            id,
            full_name,
            email,
            document_type,
            document_number,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (txError) {
        console.error("❌ Error al obtener transacciones:", txError.message);
        throw txError;
      }

      // 2. Mapeo estructural blindado contra valores nulos o estructuras antiguas
      const formattedData: ClientOperation[] = (txData || []).map((tx: any) => {
        const rawClient = tx.clients;
        const client = Array.isArray(rawClient) ? rawClient[0] : rawClient;

        return {
          ...tx,
          // Mapeo del Remitente (Soporta tabla relacional + columnas viejas como sender_name)
          full_name: client?.full_name || tx.full_name || tx.sender_name || "Remitente no registrado",
          email: client?.email || tx.email || tx.sender_email || "Sin correo",
          document_type: client?.document_type || tx.document_type || "DNI",
          document_number: client?.document_number || tx.document_number || "S/N",
          phone: client?.phone || tx.phone || "S/N",

          // Mapeo del Destinatario (Soporta receiver_name, bank_name y account)
          recipient_name: tx.recipient_name || tx.receiver_name || "Destinatario no especificado",
          recipient_bank: tx.recipient_bank || tx.bank_name || "Banco no especificado",
          recipient_account: tx.recipient_account || tx.account_number || "Sin cuenta",

          send_amount: Number(tx.send_amount || 0),
          receive_amount: Number(tx.receive_amount || 0),
          send_currency: tx.send_currency || "EUR",
          receive_currency: tx.receive_currency || "PEN",
          operation_code: tx.operation_code || tx.id?.slice(0, 8) || "N/A",
          status: (tx.status || "PENDIENTE") as TransactionStatus,
        };
      });

      setOperations(formattedData);
    } catch (err: any) {
      console.error("❌ Error crítico en fetchOperations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial y suscripción WebSocket para actualizaciones en vivo
  useEffect(() => {
    fetchOperations();

    const channel = supabase
      .channel("admin_transactions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchOperations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Resetear a la página 1 cuando cambie el buscador o el filtro de estado
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Actualización de estado en base de datos, interfaz y disparo de correo electrónico
  // Actualización de estado en base de datos, interfaz de forma inmediata (Optimistic Update)
  const handleStatusChange = async (id: string, newStatus: TransactionStatus) => {
    setUpdatingId(id);
    setOpenDropdownId(null);

    // 1. ACTUALIZACIÓN OPTIMISTA INMEDIATA EN EL FRONTEND
    // Actualizamos tanto la lista completa como la operación seleccionada al instante para cero latencia visual
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, status: newStatus } : op))
    );

    if (selectedOperation?.id === id) {
      setSelectedOperation((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      // 2. Actualizar el estado en la base de datos de Supabase
      const { error } = await supabase
        .from("transactions")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // 3. Extraer la operación actual para enviar la notificación por correo (en segundo plano)
      const currentOp = operations.find((op) => op.id === id);

      if (currentOp && currentOp.email && currentOp.email !== "Sin correo") {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: currentOp.email,
            fullName: currentOp.full_name,
            operationCode: currentOp.operation_code || currentOp.id.slice(0, 8),
            status: newStatus,
            sendAmount: currentOp.send_amount,
            sendCurrency: currentOp.send_currency,
            receiveAmount: currentOp.receive_amount,
            receiveCurrency: currentOp.receive_currency,
          }),
        }).catch((emailErr) => {
          console.error("⚠️ Excepción al intentar conectar con /api/send-email:", emailErr);
        });
      }
    } catch (err: any) {
      console.error("❌ Error actualizando estado en BD:", err);
      alert(`Error actualizando estado: ${err.message}`);
      // Revertir cambios locales si falla la BD recargando los datos reales
      await fetchOperations();
    } finally {
      setUpdatingId(null);
    }
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

  // Lógica de Paginación sobre los elementos filtrados
  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage) || 1;
  
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOperations.slice(start, start + itemsPerPage);
  }, [filteredOperations, currentPage, itemsPerPage]);

  // Modificación del cálculo de métricas para separar EUR y PEN de transacciones completadas
  const stats = useMemo(() => {
    const totalCount = operations.length;
    
    const pendingCount = operations.filter(
      (o) => o.status === "PENDIENTE" || (o.status as string) === "PENDING"
    ).length;

    const completedOps = operations.filter(
      (o) => 
        o.status === "COMPLETADO" || 
        (o.status as string) === "COMPLETADA" || 
        (o.status as string) === "COMPLETED"
    );

    const completedCount = completedOps.length;

    const totalEur = completedOps
      .filter((o) => o.send_currency === "EUR")
      .reduce((acc, curr) => acc + curr.send_amount, 0);

    const totalPen = completedOps
      .reduce((acc, curr) => {
        if (curr.receive_currency === "PEN") {
          return acc + Number(curr.receive_amount || 0);
        }
        if (curr.send_currency === "PEN") {
          return acc + Number(curr.send_amount || 0);
        }
        return acc;
      }, 0);

    return { totalCount, pendingCount, completedCount, totalEur, totalPen };
  }, [operations]);

  const exportToCSV = () => {
    const headers = [
      "Codigo,Fecha,Cliente,Email,Documento,Telefono,Destinatario,Banco,Cuenta,Enviado,MonedaEnvio,Recibido,MonedaRecibo,Estado",
    ];
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
      case "COMPLETADA":
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completada
          </span>
        );
      case "EN_PROCESO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> En Proceso
          </span>
        );
      case "RECHAZADO":
      case "RECHAZADA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rechazada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-6 space-y-8 pt-6">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Control de Operaciones
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitoreo en tiempo real de remesas, estados de liquidación y seguimiento de clientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOperations}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-2 cursor-pointer"
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

        {/* METRICAS KPI */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">TOTAL TRANSACCIONES</p>
            <p className="text-3xl font-extrabold text-white font-mono mt-1">{stats.totalCount}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-wider block mb-1">POR PROCESAR</p>
            <p className="text-3xl font-extrabold text-amber-400 font-mono mt-1">{stats.pendingCount}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider block mb-1">COMPLETADAS</p>
            <p className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">{stats.completedCount}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-medium text-teal-400 uppercase tracking-wider block mb-1">VOLUMEN (EUR)</p>
            <p className="text-3xl font-extrabold text-teal-400 font-mono mt-1">€{stats.totalEur.toFixed(2)}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl col-span-2 md:col-span-1">
            <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider block mb-1">VOLUMEN (PEN)</p>
            <p className="text-3xl font-extrabold text-indigo-400 font-mono mt-1">S/ {stats.totalPen.toFixed(2)}</p>
          </div>
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por código, cliente, correo o destinatario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value={5}>5 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
                <option value={50}>50 por pág.</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 hidden md:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="COMPLETADO">Completada</option>
                <option value="RECHAZADO">Rechazada</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl min-h-[420px] flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/50">
                  <th className="p-4">Código / Fecha</th>
                  <th className="p-4">Remitente</th>
                  <th className="p-4">Monto Enviado</th>
                  <th className="p-4">Destinatario</th>
                  <th className="p-4">Monto a Abonar</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Cargando operaciones en tiempo real...
                    </td>
                  </tr>
                ) : paginatedOperations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      No se encontraron transacciones registradas que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  paginatedOperations.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-emerald-400 max-w-[180px] truncate" title={op.operation_code}>
                          {op.operation_code || op.id?.slice(0, 8)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(op.created_at).toLocaleString()}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white">{op.full_name}</div>
                        <div className="text-[11px] text-slate-400">{op.email}</div>
                        <div className="text-[10px] text-slate-500">
                          {op.document_type}: {op.document_number}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-white whitespace-nowrap">
                        {op.send_amount} {op.send_currency}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white">{op.recipient_name}</div>
                        <div className="text-[11px] text-slate-400">{op.recipient_bank}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {op.recipient_account}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {op.receive_amount} {op.receive_currency}
                      </td>

                      <td className="p-4 whitespace-nowrap">{getStatusBadge(op.status)}</td>

                      <td className="p-4 text-right relative whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOperation(op)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Ver detalles completos"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <div className="relative inline-block text-left" ref={openDropdownId === op.id ? dropdownRef : null}>
                            <button
                              onClick={() =>
                                setOpenDropdownId(openDropdownId === op.id ? null : op.id)
                              }
                              disabled={updatingId === op.id}
                              className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/50 hover:border-emerald-400 text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                            >
                              <span>{updatingId === op.id ? "Actualizando..." : "Cambiar Estado"}</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {openDropdownId === op.id && (
                              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden py-1">
                                <button
                                  onClick={() => handleStatusChange(op.id, "PENDIENTE" as TransactionStatus)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-400 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> PENDIENTE
                                </button>
                                <button
                                  onClick={() => handleStatusChange(op.id, "EN_PROCESO" as TransactionStatus)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-blue-400 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Clock className="w-3.5 h-3.5" /> EN PROCESO
                                </button>
                                <button
                                  onClick={() => handleStatusChange(op.id, "COMPLETADO" as TransactionStatus)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETADA
                                </button>
                                <button
                                  onClick={() => handleStatusChange(op.id, "RECHAZADO" as TransactionStatus)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> RECHAZADA
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* BARRA DE PAGINACIÓN INFERIOR */}
          {!loading && filteredOperations.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
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

        {/* MODAL DETALLE DE OPERACIÓN */}
        {selectedOperation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 text-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    ORDEN DE REMESA
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {selectedOperation.operation_code || selectedOperation.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-500 font-semibold uppercase tracking-wider mb-2">REMITENTE</p>
                  <p className="font-bold text-white text-sm">
                    {selectedOperation.full_name}
                  </p>
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

              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between font-mono text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">ENVIADO:</span>
                  <span className="font-bold text-white text-base">
                    {selectedOperation.send_amount} {selectedOperation.send_currency}
                  </span>
                </div>
                <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">A ABONAR:</span>
                  <span className="font-bold text-emerald-400 text-base">
                    {selectedOperation.receive_amount} {selectedOperation.receive_currency}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}