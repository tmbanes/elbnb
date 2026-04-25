"use client";

// app/manager/residents/page.tsx
// Self-contained — no external component imports beyond UI primitives.
// Manager can only see residents of their assigned accommodation.
// Manager can: record-move-in (waiting_payment), record-move-out (active).
// Manager CANNOT: terminate, override/transfer.

import { useEffect, useState, useCallback } from "react";
import {
  Search, Filter, History, ArrowLeft, AlertCircle,
  CheckCircle2, Clock, ShieldAlert, CalendarArrowDown, CalendarArrowUp,
  Loader2, ChevronLeft, ChevronRight, MapPin, Mail, Building2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssignmentStatus =
  | "active" | "completed" | "cancelled"
  | "terminated" | "waiting_payment" | "pending";

interface Resident {
  assignment_id: string;
  application_id: string;
  unit_id: string;
  user_id: string;
  move_in_date: string;
  expected_move_out_date: string;
  actual_move_out_date?: string | null;
  assignment_status: AssignmentStatus;
  users: { first_name: string; last_name: string; email: string };
  unit: {
    unit_id: string; unit_number: string; unit_type: string;
    accommodation: { accommodation_id: string; name: string; location: string };
  };
}

type FilterStatus = "all" | "awaiting" | "active" | "checked-out";
type ConfirmAction = "record-move-in" | "record-move-out" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const STATUS_MAP: Record<AssignmentStatus, { label: string; dot: string; badge: string }> = {
  active:          { label: "Active",           dot: "bg-[#78A24C]", badge: "bg-[#E7FAD3] text-[#78A24C]" },
  completed:       { label: "Completed",        dot: "bg-[#0369A1]", badge: "bg-[#E0F2FE] text-[#0369A1]" },
  cancelled:       { label: "Cancelled",        dot: "bg-gray-400",  badge: "bg-[#F3F4F6] text-[#6B7280]" },
  terminated:      { label: "Terminated",       dot: "bg-[#B91C1C]", badge: "bg-[#FEF2F2] text-[#B91C1C]" },
  waiting_payment: { label: "Waiting Payment",  dot: "bg-[#EA580C]", badge: "bg-[#FFF7ED] text-[#EA580C]" },
  pending:         { label: "Pending Approval", dot: "bg-[#4F46E5]", badge: "bg-[#EEF2FF] text-[#4F46E5]" },
};

const PER_PAGE = 5;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagerResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [accommodations, setAccommodations] = useState<{ accommodation_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [accomFilter, setAccomFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Detail panel action state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split("T")[0]);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchResidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/manager/residents");
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status}: ${t.slice(0, 200)}`);
      }
      const json = await res.json();
      const data: Resident[] = json.data ?? [];
      setResidents(data);
      if (Array.isArray(json.accommodations)) setAccommodations(json.accommodations);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].assignment_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResidents(); }, [fetchResidents]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = residents.filter(r => {
    const name = `${r.users.first_name} ${r.users.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || r.users.email.toLowerCase().includes(search.toLowerCase());
    const matchAccom = accomFilter === "all" || r.unit.accommodation.accommodation_id === accomFilter;
    const matchStatus =
      statusFilter === "all" ? true :
      statusFilter === "awaiting" ? ["waiting_payment", "pending"].includes(r.assignment_status) :
      statusFilter === "active" ? r.assignment_status === "active" :
      ["completed", "terminated", "cancelled"].includes(r.assignment_status);
    return matchSearch && matchAccom && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selected = residents.find(r => r.assignment_id === selectedId) ?? null;

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAction = async () => {
    if (!selected || !confirmAction) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/manager/residents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: selected.assignment_id,
          action: confirmAction,
          date: actionDate,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Action failed");
      }
      setSuccessMsg(
        confirmAction === "record-move-out" ? "Move-out recorded" : "Move-in recorded"
      );
      setConfirmAction(null);
      await fetchResidents();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (action: ConfirmAction) => {
    setConfirmAction(action);
    setActionDate(new Date().toISOString().split("T")[0]);
    setSuccessMsg(null);
  };

  const selectResident = (id: string) => {
    setSelectedId(id);
    setConfirmAction(null);
    setSuccessMsg(null);
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#264384] animate-spin" />
        <p className="text-sm font-bold text-[#44291B]/60">Loading residents…</p>
      </div>
    </div>
  );

  if (error && residents.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5]">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#44291B]">Error Loading Residents</h2>
        <p className="text-sm text-[#44291B]/60">{error}</p>
        <button onClick={fetchResidents}
          className="px-6 py-2 bg-[#264384] text-white font-bold rounded-xl hover:bg-[#1a2d5a] transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F8D5] flex overflow-hidden font-[family-name:var(--font-archivo)]">

      {/* ── LEFT: List panel ───────────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 min-w-0 overflow-y-auto transition-all duration-300",
        selectedId ? "hidden lg:block" : "block"
      )}>
        <div className="p-4 md:p-6 space-y-4">

          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
              Resident Management Page
            </h1>
            <p className="text-sm text-[#44291B]/60 font-medium mt-2">
              Manage move-ins, move-outs, and resident stays
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-[#FDFFF4] p-4 rounded-2xl border border-[#e8e2d6] shadow-sm">
            {/* Search */}
            <div className="flex items-center border border-[#e8e2d6] rounded-xl bg-white flex-1 max-w-sm">
              <Search className="w-4 h-4 ml-3 text-[#44291B]/40 shrink-0" />
              <input
                type="text"
                placeholder="Search resident name or email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-[#44291B] placeholder:text-[#44291B]/40 font-medium"
              />
            </div>

            {/* Accommodation filter — scoped to manager's own accommodations only */}
            {accommodations.length > 1 && (
              <div className="flex items-center gap-2 border border-[#e8e2d6] rounded-xl bg-[#FDFFF4] px-3 py-2">
                <Building2 className="w-4 h-4 text-[#44291B]/40 shrink-0" />
                <select
                  value={accomFilter}
                  onChange={e => { setAccomFilter(e.target.value); setPage(1); }}
                  className="text-sm bg-transparent outline-none text-[#44291B] font-medium cursor-pointer min-w-[140px]"
                >
                  <option value="all">All Properties</option>
                  {accommodations.map(a => (
                    <option key={a.accommodation_id} value={a.accommodation_id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status filter */}
            <div className="flex items-center gap-2 border border-[#e8e2d6] rounded-xl bg-[#FDFFF4] px-3 py-2">
              <Filter className="w-4 h-4 text-[#44291B]/40 shrink-0" />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as FilterStatus); setPage(1); }}
                className="text-sm bg-transparent outline-none text-[#44291B] font-medium cursor-pointer min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="awaiting">Awaiting Move-in</option>
                <option value="active">Active Stays</option>
                <option value="checked-out">Stay History</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#FDFFF4] rounded-2xl border border-[#e8e2d6] overflow-hidden shadow-sm">
            {paginated.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e2d6] bg-[#F6F8D5]/80">
                    <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Resident</th>
                    <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Accommodation</th>
                    <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => {
                    const st = STATUS_MAP[r.assignment_status];
                    const isSelected = r.assignment_id === selectedId;
                    return (
                      <tr
                        key={r.assignment_id}
                        onClick={() => selectResident(r.assignment_id)}
                        className={cn(
                          "border-b border-[#e8e2d6]/60 last:border-0 cursor-pointer transition-colors",
                          isSelected ? "bg-[#F0F4FF]" : "hover:bg-[#F6F8D5]"
                        )}
                      >
                        <td className="py-4 px-5">
                          <p className={cn("text-sm font-bold text-[#44291B]", isSelected && "text-[#264384]")}>
                            {r.users.first_name} {r.users.last_name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 text-[#44291B]/50">
                            <Mail className="w-3 h-3 shrink-0" />
                            <p className="text-xs truncate max-w-[180px]">{r.users.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <p className="text-sm font-bold text-[#44291B]">{r.unit.accommodation.name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-[#44291B]/50">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <p className="text-xs">Unit {r.unit.unit_number}</p>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            st.badge
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm font-bold text-[#44291B]/40">No residents found</p>
                <p className="text-xs text-[#44291B]/30 mt-1">Try adjusting your search or filters</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#e8e2d6]/60 bg-[#FDFFF4]">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-[#e8e2d6]/50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#44291B]" />
              </button>
              <span className="text-xs font-bold text-[#44291B]/50">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-[#e8e2d6]/50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#44291B]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Detail panel ────────────────────────────────────────────── */}
      <div className={cn(
        "w-full lg:w-[420px] border-l border-[#e8e2d6] bg-[#F6F8D5] overflow-y-auto flex flex-col transition-all duration-300",
        selectedId ? "block" : "hidden lg:flex"
      )}>
        {selected ? (
          <ManagerDetailPanel
            resident={selected}
            onBack={() => setSelectedId(null)}
            confirmAction={confirmAction}
            actionDate={actionDate}
            actionLoading={actionLoading}
            successMsg={successMsg}
            onOpenConfirm={openConfirm}
            onSetActionDate={setActionDate}
            onConfirm={handleAction}
            onCancelConfirm={() => setConfirmAction(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <div className="space-y-3 max-w-xs">
              <div className="w-14 h-14 bg-[#e8e2d6] rounded-full flex items-center justify-center mx-auto">
                <History className="w-6 h-6 text-[#44291B]/30" />
              </div>
              <h2 className="text-lg font-bold text-[#44291B]">No Resident Selected</h2>
              <p className="text-sm text-[#44291B]/50 leading-relaxed">
                Select a resident from the list to view details and manage their stay.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manager Detail Panel ─────────────────────────────────────────────────────
// Managers get: record-move-in (waiting_payment), record-move-out (active).
// No terminate, no override.

interface ManagerDetailPanelProps {
  resident: Resident;
  onBack: () => void;
  confirmAction: ConfirmAction;
  actionDate: string;
  actionLoading: boolean;
  successMsg: string | null;
  onOpenConfirm: (a: ConfirmAction) => void;
  onSetActionDate: (d: string) => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}

function ManagerDetailPanel({
  resident, onBack, confirmAction, actionDate, actionLoading,
  successMsg, onOpenConfirm, onSetActionDate, onConfirm, onCancelConfirm,
}: ManagerDetailPanelProps) {

  const s = resident.assignment_status;
  const isActive = s === "active";
  const isCompleted = s === "completed";
  const isTerminated = s === "terminated";
  const isCancelled = s === "cancelled";
  const isCheckedOut = isCompleted || isTerminated || isCancelled;

  const confirmBorderColor = confirmAction === "record-move-in" ? "border-[#78A24C]" : "border-[#264384]";
  const confirmBtnColor = confirmAction === "record-move-in"
    ? "bg-[#78A24C] hover:bg-[#60833D] text-white"
    : "bg-[#264384] hover:bg-[#1a2d5a] text-white";

  return (
    <div className="flex flex-col h-full">

      {/* Mobile back */}
      <div className="lg:hidden p-4 border-b border-[#e8e2d6]">
        <button onClick={onBack} className="flex items-center gap-2 text-[#264384] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Residents
        </button>
      </div>

      <div className="p-6 space-y-4 flex-1">

        {/* Name & email */}
        <div>
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
            {resident.users.first_name} {resident.users.last_name}
          </h2>
          <p className="text-sm text-[#44291B]/50 font-medium mt-0.5">{resident.users.email}</p>
        </div>

        {/* Unit + dates card */}
        <div className="bg-[#FDFFF4] border border-[#e8e2d6] rounded-2xl overflow-hidden shadow-sm">
          <div className="flex divide-x divide-[#e8e2d6]">
            <div className="px-4 py-3 flex-1">
              <p className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest mb-1">Unit</p>
              <p className="text-lg font-[family-name:var(--font-archivo-black)] text-[#44291B] leading-none">
                Rm {resident.unit.unit_number}
              </p>
            </div>
            <div className="px-4 py-3 flex items-center gap-4 bg-white/40">
              <div>
                <p className="text-sm font-bold text-[#44291B] tabular-nums">{fmtDate(resident.move_in_date)}</p>
                <p className="text-[9px] font-bold text-[#44291B]/40 uppercase tracking-widest mt-0.5">Move In</p>
              </div>
              <div className="w-px h-6 bg-[#e8e2d6]" />
              <div>
                <p className="text-sm font-bold text-[#44291B] tabular-nums">{fmtDate(resident.expected_move_out_date)}</p>
                <p className="text-[9px] font-bold text-[#44291B]/40 uppercase tracking-widest mt-0.5">Move Out</p>
              </div>
            </div>
          </div>
        </div>

        {/* History timeline */}
        <div className="bg-[#FDFFF4] border border-[#e8e2d6] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-[#44291B]/50" />
            <span className="text-[10px] font-black text-[#44291B]/50 uppercase tracking-widest">History</span>
          </div>
          <div className="relative pl-7 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e8e2d6]">
            <TimelineEvent color="bg-[#5591AB]" title="Assigned"
              subtitle={`Room ${resident.unit.unit_number} • ${fmtDate(resident.move_in_date)}`} />
            {(isActive || isCheckedOut) && (
              <TimelineEvent color="bg-[#78A24C]" title="Moved In" subtitle={fmtDate(resident.move_in_date)} />
            )}
            {isCheckedOut && (
              <TimelineEvent
                color={isCompleted ? "bg-[#0369A1]" : isTerminated ? "bg-[#B91C1C]" : "bg-gray-400"}
                title={isCompleted ? "Completed Stay" : isTerminated ? "Stay Terminated" : "Assignment Cancelled"}
                subtitle={fmtDate(resident.actual_move_out_date || resident.expected_move_out_date)}
              />
            )}
          </div>
        </div>

        {/* Success flash */}
        {successMsg && (
          <div className="bg-[#E7FAD3] border border-[#78A24C]/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#78A24C] shrink-0" />
            <p className="text-sm font-bold text-[#78A24C]">{successMsg}</p>
          </div>
        )}

        {/* Confirm panel */}
        {confirmAction ? (
          <div className={cn("bg-[#FDFFF4] border rounded-2xl p-5 shadow-lg space-y-4", confirmBorderColor)}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                confirmAction === "record-move-in" ? "bg-[#E7FAD3] text-[#78A24C]" : "bg-[#264384]/10 text-[#264384]"
              )}>
                {confirmAction === "record-move-in"
                  ? <CalendarArrowDown className="w-4 h-4" />
                  : <CalendarArrowUp className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-[#44291B]">
                  {confirmAction === "record-move-in" ? "Confirm Move-In" : "Confirm Move-Out"}
                </p>
                <p className="text-xs text-[#44291B]/50">Set the effective date below.</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#44291B]/40 block mb-1">Effective Date</label>
              <input
                type="date"
                value={actionDate}
                onChange={e => onSetActionDate(e.target.value)}
                className="w-full border border-[#e8e2d6] rounded-xl py-2.5 px-3 text-sm font-bold text-[#44291B] outline-none focus:border-[#264384] transition-all bg-[#FDFFF4]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onCancelConfirm}
                disabled={actionLoading}
                className="flex-1 border border-[#e8e2d6] text-[#44291B]/60 font-bold py-2.5 rounded-xl text-sm hover:bg-[#e8e2d6]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={actionLoading}
                className={cn("flex-[2] font-bold py-2.5 rounded-xl text-sm transition-all shadow-md", confirmBtnColor)}
              >
                {actionLoading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing…</span>
                  : "Confirm Action"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* pending — manager sees it but can't act, admin must approve */}
            {s === "pending" && (
              <StatusCard color="indigo" icon={<Clock className="w-5 h-5" />}
                title="Awaiting Admin Approval"
                body="The assignment has been made by the Dorm Manager and is currently pending final application approval from the Admin."
              />
            )}

            {/* waiting_payment — manager can record physical move-in */}
            {s === "waiting_payment" && (
              <div className="bg-[#FFF7ED] border border-[#EA580C]/30 rounded-2xl p-5 space-y-3">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#44291B]/80">Approved & Awaiting Arrival</p>
                    <p className="text-xs text-[#44291B]/60 mt-1 leading-relaxed">
                      Resident has been approved. Record their physical arrival below to activate the stay.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenConfirm("record-move-in")}
                  className="w-full bg-[#EB8A0B] hover:bg-[#c97509] text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md"
                >
                  Record Physical Move-in
                </button>
              </div>
            )}

            {/* active — manager can only record move-out (no terminate/override) */}
            {isActive && (
              <div className="space-y-3">
                <StatusCard color="green" icon={<CheckCircle2 className="w-5 h-5" />}
                  title="Currently Active Stay"
                  body={`Resident is currently staying in Unit ${resident.unit.unit_number}. Expected move-out: ${fmtDate(resident.expected_move_out_date)}.`}
                />
                <button
                  onClick={() => onOpenConfirm("record-move-out")}
                  className="w-full flex items-center justify-center gap-2 border border-[#e8e2d6] text-[#44291B] font-bold py-2.5 rounded-xl text-sm hover:bg-[#e8e2d6]/40 transition-colors bg-[#FDFFF4]"
                >
                  <CalendarArrowUp className="w-4 h-4" /> Record Move-out
                </button>
              </div>
            )}

            {/* completed */}
            {isCompleted && (
              <StatusCard color="blue" icon={<CheckCircle2 className="w-5 h-5" />}
                title="Stay Completed"
                body={`The resident successfully completed their stay and moved out on ${fmtDate(resident.actual_move_out_date)}.`}
              />
            )}

            {/* terminated */}
            {isTerminated && (
              <StatusCard color="red" icon={<ShieldAlert className="w-5 h-5" />}
                title="Stay Terminated"
                body={`This stay was terminated before the expected end date. Effective: ${fmtDate(resident.actual_move_out_date)}.`}
              />
            )}

            {/* cancelled */}
            {isCancelled && (
              <StatusCard color="gray" icon={<AlertCircle className="w-5 h-5" />}
                title="Assignment Cancelled"
                body="The accommodation assignment was cancelled. This often happens automatically if payment is not received within the required timeframe."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function TimelineEvent({ color, title, subtitle }: { color: string; title: string; subtitle: string }) {
  return (
    <div className="relative flex items-start">
      <div className={cn("absolute left-[-22px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10", color)} />
      <div>
        <p className="text-sm font-bold text-[#44291B] leading-none mb-1">{title}</p>
        <p className="text-xs text-[#44291B]/50 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

type CardColor = "green" | "blue" | "red" | "gray" | "indigo";

function StatusCard({ color, icon, title, body }: { color: CardColor; icon: React.ReactNode; title: string; body: string }) {
  const styles: Record<CardColor, string> = {
    green:  "bg-[#E7FAD3] border-[#78A24C]/30 [&_svg]:text-[#78A24C]",
    blue:   "bg-[#E0F2FE] border-[#0369A1]/30 [&_svg]:text-[#0369A1]",
    red:    "bg-[#FEF2F2] border-[#B91C1C]/30 [&_svg]:text-[#B91C1C]",
    gray:   "bg-[#F3F4F6] border-gray-300     [&_svg]:text-gray-500",
    indigo: "bg-[#EEF2FF] border-[#4F46E5]/30 [&_svg]:text-[#4F46E5]",
  };
  return (
    <div className={cn("border rounded-2xl p-5 flex gap-3", styles[color])}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-bold text-[#44291B]/80">{title}</p>
        <p className="text-xs text-[#44291B]/60 mt-1 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
