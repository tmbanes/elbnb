"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Filter, Building2, History, ArrowLeft, AlertCircle,
  CheckCircle2, Clock, ShieldAlert, CalendarArrowDown, CalendarArrowUp,
  RefreshCw, Loader2, ChevronLeft, ChevronRight, MapPin, Mail,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
type ConfirmAction = "record-move-in" | "record-move-out" | "terminate" | "override" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const STATUS_MAP: Record<AssignmentStatus, { label: string; dot: string; badge: string }> = {
  active: { label: "Active", dot: "bg-[#78A24C]", badge: "bg-[#E7FAD3] text-[#78A24C]" },
  completed: { label: "Completed", dot: "bg-[#0369A1]", badge: "bg-[#E0F2FE] text-[#0369A1]" },
  cancelled: { label: "Cancelled", dot: "bg-gray-400", badge: "bg-[#F3F4F6] text-[#6B7280]" },
  terminated: { label: "Terminated", dot: "bg-[#B91C1C]", badge: "bg-[#FEF2F2] text-[#B91C1C]" },
  waiting_payment: { label: "Waiting Payment", dot: "bg-[#EA580C]", badge: "bg-[#FFF7ED] text-[#EA580C]" },
  pending: { label: "Pending Approval", dot: "bg-[#4F46E5]", badge: "bg-[#EEF2FF] text-[#4F46E5]" },
};

const PER_PAGE = 5;

import { updateResidentStatus, overrideResidentUnit } from "@/lib/actions/residents.actions";

// ─── Main Client Component ──────────────────────────────────────────────────────

export default function ResidentsClient({
  initialResidents,
  initialError
}: {
  initialResidents: Resident[];
  initialError: string | null;
}) {
  const residents = initialResidents;
  const [error, setError] = useState<string | null>(initialError);
  const [selectedId, setSelectedId] = useState<string | null>(initialResidents[0]?.assignment_id || null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [accomFilter, setAccomFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Detail panel action state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetUnit, setTargetUnit] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const accommodations = Array.from(
    new Map(
      residents
        .filter(r => r.unit?.accommodation)
        .map(r => [r.unit.accommodation.accommodation_id, r.unit.accommodation])
    ).values()
  );

  const filtered = residents.filter(r => {
    const name = `${r.users?.first_name || ''} ${r.users?.last_name || ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (r.users?.email || '').toLowerCase().includes(search.toLowerCase());
    const matchAccom = accomFilter === "all" || r.unit?.accommodation?.accommodation_id === accomFilter;
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
      let result;
      if (confirmAction === "override") {
        result = await overrideResidentUnit(selected.assignment_id, targetUnit);
      } else {
        result = await updateResidentStatus(selected.assignment_id, confirmAction as "record-move-in" | "record-move-out" | "terminate", actionDate);
      }

      if (!result.success) {
        throw new Error(result.error ?? "Action failed");
      }

      setSuccessMsg(
        confirmAction === "override" ? `Transferred to unit ${targetUnit}` :
          confirmAction === "terminate" ? "Stay terminated" :
            confirmAction === "record-move-out" ? "Move-out recorded" :
              "Move-in recorded"
      );
      setConfirmAction(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (action: ConfirmAction) => {
    setConfirmAction(action);
    setActionDate(new Date().toISOString().split("T")[0]);
    setTargetUnit("");
    setSuccessMsg(null);
  };

  const selectResident = (id: string) => {
    setSelectedId(id);
    setConfirmAction(null);
    setSuccessMsg(null);
  };
  return (
    <div className="min-h-screen py-8 px-5 md:px-12 lg:px-30 bg-[#F6F8D5] flex overflow-hidden font-[family-name:var(--font-archivo)]">
      {/* ── LEFT: List panel ───────────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 min-w-0 overflow-y-auto transition-all duration-300",
        selectedId ? "hidden lg:block" : "block"
      )}>
        <div className="p-4 md:p-6 space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
              Resident Management
            </h1>
            <p className="text-sm text-[#44291B] font-medium mt-2">
              Manage move-ins, move-outs, and resident stays
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 bg-[#FDFFF4] p-4 rounded-2xl border border-[#e8e2d6] shadow-sm">
            <div className="flex items-center border border-[#e8e2d6] rounded-xl bg-[#FDFFF4] flex-1 max-w-sm hover:bg-[#F6F8D5] transition-colors">
              <Search className="w-4 h-4 ml-3 text-[#44291B]/40 shrink-0" />
              <input
                type="text"
                placeholder="Search resident name or email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-[#44291B] placeholder:text-[#44291B]/40 font-medium"
              />
            </div>

            <Select value={accomFilter} onValueChange={(val) => { setAccomFilter(val); setPage(1); }}>
              <SelectTrigger className="h-10 min-w-[180px] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] px-3 text-sm font-medium text-[#44291B] flex items-center gap-2 hover:bg-[#F6F8D5] transition-colors shadow-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#44291B]/40 shrink-0" />
                  <SelectValue placeholder="All Properties" />
                </div>
              </SelectTrigger>
              <SelectContent className="z-[70] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] text-[#44291B]">
                <SelectItem value="all" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Properties</SelectItem>
                {accommodations.map(a => (
                  <SelectItem key={a.accommodation_id} value={a.accommodation_id} className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val as FilterStatus); setPage(1); }}>
              <SelectTrigger className="h-10 min-w-[160px] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] px-3 text-sm font-medium text-[#44291B] flex items-center gap-2 hover:bg-[#F6F8D5] transition-colors shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#44291B]/40 shrink-0" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="z-[70] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] text-[#44291B]">
                <SelectItem value="all" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Status</SelectItem>
                <SelectItem value="awaiting" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Awaiting Move-in</SelectItem>
                <SelectItem value="active" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Active Stays</SelectItem>
                <SelectItem value="checked-out" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Stay History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-[#FDFFF4] rounded-2xl border border-[#e8e2d6] overflow-hidden shadow-sm">
            {paginated.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e2d6] bg-[#FDFFF4]">
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
                          isSelected ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]"
                        )}
                      >
                        <td className="py-4 px-5">
                          <p className="text-sm font-bold text-[#44291B]">
                            {r.users?.first_name || 'Unknown'} {r.users?.last_name || ''}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 text-[#44291B]/50">
                            <Mail className="w-3 h-3 shrink-0" />
                            <p className="text-xs truncate max-w-[180px]">{r.users?.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <p className="text-sm font-bold text-[#44291B]">{r.unit?.accommodation?.name || 'Unassigned'}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-[#44291B]/50">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <p className="text-xs">Unit {r.unit?.unit_number || 'N/A'}</p>
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 bg-[#FDFFF4] border-t border-[#cfd6e4]">
              <p className="text-xs font-bold text-slate-500">
                Showing {paginated.length} of {filtered.length} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-50 hover:bg-[#E3E3E3] transition-colors h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </button>
                <div className="flex items-center px-3 text-xs font-bold text-slate-700">
                  {page} / {totalPages || 1}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-50 hover:bg-[#E3E3E3] transition-colors h-8"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Detail panel ────────────────────────────────────────────── */}
      <div className={cn(
        "w-full lg:w-[450px] border-l border-[#e8e2d6] bg-[#F6F8D5] overflow-y-auto flex flex-col transition-all duration-300 pt-20",
        selectedId ? "block" : "hidden lg:flex"
      )}>
        {selected ? (
          <ResidentDetailPanel
            resident={selected}
            onBack={() => setSelectedId(null)}
            confirmAction={confirmAction}
            actionDate={actionDate}
            targetUnit={targetUnit}
            actionLoading={actionLoading}
            successMsg={successMsg}
            onOpenConfirm={openConfirm}
            onSetActionDate={setActionDate}
            onSetTargetUnit={setTargetUnit}
            onConfirm={handleAction}
            onCancelConfirm={() => setConfirmAction(null)}
            showOverride={true}
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

// ─── Detail Panel Component ───────────────────────────────────────────────────

function ResidentDetailPanel({
  resident, onBack, confirmAction, actionDate, targetUnit,
  actionLoading, successMsg, onOpenConfirm, onSetActionDate,
  onSetTargetUnit, onConfirm, onCancelConfirm, showOverride,
}: any) {

  const s = resident.assignment_status;
  const isActive = s === "active";
  const isCompleted = s === "completed";
  const isTerminated = s === "terminated";
  const isCancelled = s === "cancelled";
  const isCheckedOut = isCompleted || isTerminated || isCancelled;

  const confirmBorderColor =
    confirmAction === "terminate" ? "border-[#DF3538]" :
      confirmAction === "record-move-in" ? "border-[#78A24C]" :
        "border-[#264384]";

  const confirmBtnColor =
    confirmAction === "override"
      ? (targetUnit ? "bg-[#EB8A0B] hover:bg-[#c97509] text-white" : "bg-[#44291B]/10 text-[#44291B]/30 cursor-not-allowed")
      : confirmAction === "terminate"
        ? "bg-[#DF3538] hover:bg-[#B52A2D] text-white"
        : confirmAction === "record-move-in"
          ? "bg-[#78A24C] hover:bg-[#60833D] text-white"
          : "bg-[#264384] hover:bg-[#1a2d5a] text-white";

  return (
    <div className="flex flex-col h-full">
      <div className="lg:hidden p-4 border-b border-[#e8e2d6]">
        <button onClick={onBack} className="flex items-center gap-2 text-[#264384] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Residents
        </button>
      </div>

      <div className="p-6 space-y-4 flex-1">
        <div>
          <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
            {resident.users.first_name} {resident.users.last_name}
          </h2>
          <p className="text-sm text-[#44291B]/50 font-medium mt-0.5">{resident.users.email}</p>
        </div>

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

        <div className="bg-[#FDFFF4] border border-[#e8e2d6] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-[#44291B]/50" />
            <span className="text-[10px] font-black text-[#44291B]/50 uppercase tracking-widest">History</span>
          </div>
          <div className="relative pl-7 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e8e2d6]">
            <TimelineEvent color="bg-[#5591AB]" title="Assigned" subtitle={`Room ${resident.unit.unit_number} • ${fmtDate(resident.move_in_date)}`} />
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

        {successMsg && (
          <div className="bg-[#E7FAD3] border border-[#78A24C]/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#78A24C] shrink-0" />
            <p className="text-sm font-bold text-[#78A24C]">{successMsg}</p>
          </div>
        )}

        {confirmAction ? (
          <div className={cn("bg-[#FDFFF4] border rounded-2xl p-5 shadow-lg space-y-4", confirmBorderColor)}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                confirmAction === "override" ? "bg-amber-100 text-amber-700" :
                  confirmAction === "terminate" ? "bg-red-100 text-[#DF3538]" :
                    confirmAction === "record-move-in" ? "bg-[#E7FAD3] text-[#78A24C]" :
                      "bg-[#264384]/10 text-[#264384]"
              )}>
                {confirmAction === "record-move-in" ? <CalendarArrowDown className="w-4 h-4" /> :
                  confirmAction === "override" ? <RefreshCw className="w-4 h-4" /> :
                    confirmAction === "terminate" ? <ShieldAlert className="w-4 h-4" /> :
                      <CalendarArrowUp className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-[#44291B]">
                  {confirmAction === "record-move-in" ? "Confirm Move-In" :
                    confirmAction === "record-move-out" ? "Confirm Move-Out" :
                      confirmAction === "override" ? "Admin Override: Transfer Resident" :
                        "Confirm Early Termination"}
                </p>
                <p className="text-xs text-[#44291B]/50">
                  {confirmAction === "override" ? "Move resident to a different unit." : "Set the effective date below."}
                </p>
              </div>
            </div>

            {confirmAction === "override" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#44291B]/40 block mb-1">Current Unit</label>
                  <div className="bg-gray-100 border border-[#e8e2d6] rounded-xl py-2 px-3 text-sm font-bold text-[#44291B]/50">
                    {resident.unit.unit_number}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#44291B]/40 block mb-1">New Unit #</label>
                  <input
                    type="text"
                    value={targetUnit}
                    placeholder="e.g. 104-B"
                    onChange={e => onSetTargetUnit(e.target.value)}
                    className="w-full border border-[#e8e2d6] rounded-xl py-2 px-3 text-sm font-bold text-[#44291B] outline-none focus:border-[#264384] transition-all bg-[#FDFFF4]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#44291B]/40 block mb-1">Effective Date</label>
                <input
                  type="date"
                  value={actionDate}
                  onChange={e => onSetActionDate(e.target.value)}
                  className="w-full border border-[#e8e2d6] rounded-xl py-2.5 px-3 text-sm font-bold text-[#44291B] outline-none focus:border-[#264384] transition-all bg-[#FDFFF4]"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={onCancelConfirm} disabled={actionLoading} className="flex-1 border border-[#e8e2d6] text-[#44291B]/60 font-bold py-2.5 rounded-xl text-sm hover:bg-[#e8e2d6]/30 transition-colors">Cancel</button>
              <button onClick={onConfirm} disabled={actionLoading || (confirmAction === "override" && !targetUnit)} className={cn("flex-[2] font-bold py-2.5 rounded-xl text-sm transition-all shadow-md", confirmBtnColor)}>
                {actionLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing…</span> : "Confirm Action"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {resident.assignment_status === "waiting_payment" && (
              <div className="bg-[#FFF7ED] border border-[#EA580C]/30 rounded-2xl p-5 space-y-3">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#44291B]/80">Approved & Awaiting Arrival</p>
                    <p className="text-xs text-[#44291B]/60 mt-1 leading-relaxed">Resident has been approved. Record their arrival to activate stay.</p>
                  </div>
                </div>
                <button onClick={() => onOpenConfirm("record-move-in")} className="w-full bg-[#EB8A0B] hover:bg-[#c97509] text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md">Record Move-in</button>
              </div>
            )}
            {isActive && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onOpenConfirm("record-move-out")} className="flex items-center justify-center gap-2 border border-[#e8e2d6] text-[#44291B] font-bold py-2.5 rounded-xl text-sm hover:bg-[#e8e2d6]/40 transition-colors bg-[#FDFFF4]">Move-out</button>
                  <button onClick={() => onOpenConfirm("terminate")} className="flex items-center justify-center gap-2 border border-[#e8e2d6] text-[#DF3538] font-bold py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors bg-[#FDFFF4]">Terminate</button>
                </div>
                {showOverride && (
                  <button onClick={() => onOpenConfirm("override")} className="w-full border border-dashed border-amber-300 text-amber-700 font-bold py-3 rounded-xl text-xs hover:bg-amber-50 transition-colors flex items-center justify-center gap-2">Admin Override: Transfer Unit</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEvent({ color, title, subtitle }: any) {
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
