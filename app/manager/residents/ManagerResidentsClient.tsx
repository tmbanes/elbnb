"use client";

import { Building2, ChevronLeft, ChevronRight, Filter, Mail, MapPin, Search, ArrowLeft, History, CheckCircle2, Receipt } from "lucide-react";
import { Archivo, Archivo_Black } from "next/font/google";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useRealtimeSync } from "@/lib/realtime-sync";
import { useRouter } from "next/navigation";
import { updateResidentStatus } from "@/lib/actions/residents.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

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
  billing?: {
    billing_id: string;
    amount: number;
    status: string;
    due_date: string;
    created_at: string;
  }[];
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
  active: { label: "Active", dot: "bg-[#78A24C]", badge: "bg-[#E7FAD3] text-[#78A24C]" },
  completed: { label: "Completed", dot: "bg-[#0369A1]", badge: "bg-[#E0F2FE] text-[#0369A1]" },
  cancelled: { label: "Cancelled", dot: "bg-gray-400", badge: "bg-[#F3F4F6] text-[#6B7280]" },
  terminated: { label: "Terminated", dot: "bg-[#B91C1C]", badge: "bg-[#FEF2F2] text-[#B91C1C]" },
  waiting_payment: { label: "Waiting Payment", dot: "bg-[#EA580C]", badge: "bg-[#FFF7ED] text-[#EA580C]" },
  pending: { label: "Pending Approval", dot: "bg-[#4F46E5]", badge: "bg-[#EEF2FF] text-[#4F46E5]" },
};

const PER_PAGE = 10;

interface ManagerResidentsClientProps {
  initialResidents: Resident[];
  initialAccommodations: { accommodation_id: string; name: string }[];
}

export default function ManagerResidentsClient({ initialResidents, initialAccommodations }: ManagerResidentsClientProps) {
  // Deduplicate residents by user_id to ensure each resident only appears once in the list.
  // Since the backend query already orders by move_in_date DESC, this will automatically keep the most recent stay.
  // We aggregate all invoices from all stays for the same resident to display them all under "Invoices & Bills".
  const residents = useMemo(() => {
    const billingsByUser: Record<string, any[]> = {};
    for (const r of initialResidents) {
      if (r.user_id && r.billing) {
        if (!billingsByUser[r.user_id]) {
          billingsByUser[r.user_id] = [];
        }
        for (const bill of r.billing) {
          if (!billingsByUser[r.user_id].some((b) => b.billing_id === bill.billing_id)) {
            billingsByUser[r.user_id].push(bill);
          }
        }
      }
    }

    const seen = new Set<string>();
    return initialResidents
      .filter((r) => {
        if (!r.user_id) return true;
        if (seen.has(r.user_id)) return false;
        seen.add(r.user_id);
        return true;
      })
      .map((r) => ({
        ...r,
        billing: r.user_id ? billingsByUser[r.user_id] : r.billing,
      }));
  }, [initialResidents]);

  const accommodations = initialAccommodations;
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialResidents[0]?.assignment_id || null);
  const router = useRouter();

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

  // Real-time sync for assignment updates
  useRealtimeSync('accommodation_assignment', undefined, '*');

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = residents.filter(r => {
    const name = `${r.users?.first_name || ''} ${r.users?.last_name || ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (r.users?.email || '').toLowerCase().includes(search.toLowerCase());
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
      const result = await updateResidentStatus(
        selected.assignment_id,
        confirmAction as "record-move-in" | "record-move-out",
        actionDate
      );

      if (!result.success) {
        throw new Error(result.error ?? "Action failed");
      }

      setSuccessMsg(
        confirmAction === "record-move-out" ? "Move-out recorded" : "Move-in recorded"
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
    setSuccessMsg(null);
  };

  const selectResident = (id: string) => {
    setSelectedId(id);
    setConfirmAction(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F8D5] flex overflow-hidden">

      {/* ── LEFT: List panel ───────────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 min-w-0 transition-all duration-500 ease-in-out",
        selectedId ? "hidden lg:block lg:flex-[7]" : "flex-1"
      )}>
        <div className={cn(
          "h-full flex flex-col pt-10 pb-6 gap-6 transition-all duration-500 overflow-y-auto scrollbar-hide",
          selectedId ? "pl-4 lg:pl-40 pr-4 lg:pr-8" : "px-4 md:px-10 lg:px-12 xl:px-16"
        )}>

          {/* Header */}
          <div>
            <h1 className={`${archivoBlack.className} pt-6 text-3xl md:text-5xl text-[#44291B] tracking-tight`}>
              Resident Management
            </h1>
            <p className="text-sm text-[#44291B]/60 font-medium mt-2">
              Manage move-ins, move-outs, and resident stays
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FDFFF4] p-4 rounded-2xl border border-[#e8e2d6] shadow-sm">
            <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 w-full md:max-w-md bg-transparent">
              <div className="pl-3 flex items-center justify-center text-[#44291B]/50">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search resident..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-transparent text-sm outline-none text-[#44291B] placeholder:text-[#44291B]/50 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
              {accommodations.length > 1 && (
                <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#e8e2d6] w-full sm:w-auto bg-transparent">
                  <Building2 className="w-4 h-4 text-[#44291B]/50 shrink-0" />
                  <Select
                    value={accomFilter}
                    onValueChange={(val) => { setAccomFilter(val); setPage(1); }}
                  >
                    <SelectTrigger className="w-full sm:w-[140px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-medium h-9">
                      <SelectValue placeholder="All Properties" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FDFFF4] text-[#44291B] border-[#e8e2d6] rounded-xl shadow-md">
                      <SelectItem value="all" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Properties</SelectItem>
                      {accommodations.map(a => (
                        <SelectItem key={a.accommodation_id} value={a.accommodation_id} className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#e8e2d6] w-full sm:w-auto bg-transparent">
                <Filter className="w-4 h-4 text-[#44291B]/50 shrink-0" />
                <Select
                  value={statusFilter}
                  onValueChange={(val) => { setStatusFilter(val as FilterStatus); setPage(1); }}
                >
                  <SelectTrigger className="w-full sm:w-[140px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-medium h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FDFFF4] text-[#44291B] border-[#e8e2d6] rounded-xl shadow-md">
                    <SelectItem value="all" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Status</SelectItem>
                    <SelectItem value="awaiting" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Awaiting Move-in</SelectItem>
                    <SelectItem value="active" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Active Stays</SelectItem>
                    <SelectItem value="checked-out" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Stay History</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#FDFFF4] rounded-2xl border border-[#e8e2d6] overflow-x-auto shadow-sm flex flex-col">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e8e2d6] bg-[#F6F8D5]/80">
                  <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest w-[30%]">Resident</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Accommodation</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest w-[20%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
                  const st = STATUS_MAP[r.assignment_status] || STATUS_MAP.pending;
                  return (
                    <tr
                      key={r.assignment_id}
                      onClick={() => selectResident(r.assignment_id)}
                      className={cn(
                        "border-b border-[#e8e2d6]/60 cursor-pointer transition-colors",
                        r.assignment_id === selectedId ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]/60"
                      )}
                    >
                      <td className="py-4 px-5">
                        <p className={cn("text-sm font-bold text-[#44291B]", r.assignment_id === selectedId && "text-[#264384]")}>
                          {r.users?.first_name || 'Unknown'} {r.users?.last_name || 'User'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-[#44291B]/50">
                          <Mail className="w-3 h-3 shrink-0" />
                          <p className="text-xs">{r.users?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <p className="text-sm font-bold text-[#44291B]">{r.unit?.accommodation?.name || 'N/A'}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-[#44291B]/50">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <p className="text-xs">Unit {r.unit?.unit_number || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", st.badge)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-auto flex items-center justify-between px-5 py-3 border-t border-[#e8e2d6]/60 bg-[#FDFFF4]">
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
        "w-full lg:w-[380px] border-l border-[#e8e2d6] bg-[#F6F8D5] overflow-y-auto flex flex-col transition-all duration-300",
        selectedId ? "" : "hidden lg:flex"
      )}>
        {selected ? (
          <div className="flex flex-col h-full">
            <div className="lg:hidden p-4 border-b border-[#e8e2d6]">
              <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-[#264384] font-bold text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Residents
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#44291B] tracking-tight">
                    {selected.users?.first_name} {selected.users?.last_name}
                  </h2>
                  <p className="text-sm text-[#44291B]/50 font-medium mt-0.5">{selected.users?.email}</p>
                </div>
                {selected.assignment_status && STATUS_MAP[selected.assignment_status] && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 mt-1",
                    STATUS_MAP[selected.assignment_status].badge
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_MAP[selected.assignment_status].dot)} />
                    {selected.assignment_status === "waiting_payment" ? "Waiting Payment" : STATUS_MAP[selected.assignment_status].label}
                  </span>
                )}
              </div>

              {/* Unit + dates card */}
              <div className="bg-[#FDFFF4] border border-[#e8e2d6] rounded-2xl overflow-hidden shadow-sm">
                <div className="flex divide-x divide-[#e8e2d6]">
                  <div className="px-4 py-3 flex-1">
                    <p className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest mb-1">Unit</p>
                    <p className="text-lg font-bold text-[#44291B] leading-none">
                      Rm {selected.unit?.unit_number}
                    </p>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-4 bg-white/40">
                    <div>
                      <p className="text-sm font-bold text-[#44291B] tabular-nums">{fmtDate(selected.move_in_date)}</p>
                      <p className="text-[9px] font-bold text-[#44291B]/40 uppercase tracking-widest mt-0.5">Move In</p>
                    </div>
                    <div className="w-px h-6 bg-[#e8e2d6]" />
                    <div>
                      <p className="text-sm font-bold text-[#44291B] tabular-nums">{fmtDate(selected.expected_move_out_date)}</p>
                      <p className="text-[9px] font-bold text-[#44291B]/40 uppercase tracking-widest mt-0.5">Move Out</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices & Bills Section */}
              {selected.billing && selected.billing.length > 0 && (
                <div className="bg-[#FDFFF4] border border-[#e8e2d6] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#e8e2d6] pb-2">
                    <Receipt className="w-4 h-4 text-[#264384]" />
                    <span className="text-[10px] font-black text-[#44291B]/50 uppercase tracking-widest">
                      Invoices & Bills ({selected.billing.length})
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {[...selected.billing]
                      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((bill: any) => (
                        <div key={bill.billing_id} className="p-3 bg-white border border-[#e8e2d6]/60 rounded-xl space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-[#44291B]">₱{bill.amount?.toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-[#44291B]/40 uppercase tracking-tight">Amount Billed</p>
                            </div>
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                              bill.status === "paid"
                                ? "bg-[#E7FAD3] text-[#78A24C]"
                                : bill.status === "unpaid"
                                  ? "bg-[#FFF7ED] text-[#EA580C]"
                                  : "bg-gray-100 text-gray-500"
                            )}>
                              {bill.status === "paid" ? "Paid" : "Unpaid"}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#44291B]/60 flex items-center justify-between pt-1 border-t border-[#e8e2d6]/20">
                            <span>Due: {fmtDate(bill.due_date)}</span>
                            <span>Created: {fmtDate(bill.created_at)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {selected.billing.some((bill: any) => bill.status === "unpaid") && (
                    <p className="text-[10px] text-[#EA580C] font-semibold bg-[#FFF7ED] p-2.5 rounded-xl border border-[#EA580C]/20 leading-normal">
                      ⚠️ Resident has unpaid bills. Payments must be recorded to secure slot or maintain status.
                    </p>
                  )}
                </div>
              )}

              {/* History timeline */}
              <div className="bg-[#FDFFF4] border border-[#e8e2d6] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-[#44291B]/50" />
                  <span className="text-[10px] font-black text-[#44291B]/50 uppercase tracking-widest">History</span>
                </div>
                <div className="space-y-6">
                  {(() => {
                    const events = [];
                    if (selected.assignment_status === 'active') {
                      events.push({
                        color: "bg-[#78A24C]",
                        title: "Moved In",
                        subtitle: fmtDate(selected.move_in_date),
                      });
                    }
                    events.push({
                      color: "bg-[#5591AB]",
                      title: "Assigned",
                      subtitle: `Room ${selected.unit?.unit_number}`,
                    });

                    return events.map((ev, index) => (
                      <TimelineEvent
                        key={ev.title}
                        color={ev.color}
                        title={ev.title}
                        subtitle={ev.subtitle}
                        isLast={index === events.length - 1}
                      />
                    ));
                  })()}
                </div>
              </div>

              {/* Success flash */}
              {successMsg && (
                <div className="bg-[#E7FAD3] border border-[#78A24C]/40 rounded-xl px-4 py-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#78A24C] shrink-0" />
                  <p className="text-sm font-bold text-[#78A24C]">{successMsg}</p>
                </div>
              )}

              {/* Actions */}
              {!confirmAction ? (
                <div className="space-y-3 pt-4">
                  {selected.assignment_status === "waiting_payment" && (
                    <button
                      onClick={() => openConfirm("record-move-in")}
                      className="w-full bg-[#EB8A0B] hover:bg-[#c97509] text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md"
                    >
                      Record Physical Move-in
                    </button>
                  )}
                  {selected.assignment_status === "active" && (
                    <button
                      onClick={() => openConfirm("record-move-out")}
                      className="w-full border border-[#e8e2d6] text-[#44291B] font-bold py-2.5 rounded-xl text-sm hover:bg-[#e8e2d6]/40 transition-colors bg-[#FDFFF4]"
                    >
                      Record Move-out
                    </button>
                  )}
                </div>
              ) : (
                <div className={cn("bg-[#FDFFF4] border rounded-2xl p-5 shadow-lg space-y-4",
                  confirmAction === "record-move-in" ? "border-[#78A24C]" : "border-[#264384]")}>
                  <p className="text-sm font-bold text-[#44291B]">
                    {confirmAction === "record-move-in" ? "Confirm Move-In" : "Confirm Move-Out"}
                  </p>
                  <input
                    type="date"
                    value={actionDate}
                    onChange={e => setActionDate(e.target.value)}
                    className="w-full border border-[#e8e2d6] rounded-xl py-2 px-3 text-sm font-bold text-[#44291B] bg-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAction(null)} className="flex-1 text-xs font-bold text-[#44291B]/60">Cancel</button>
                    <button onClick={handleAction} disabled={actionLoading} className={cn("flex-1 py-2 rounded-xl text-white font-bold text-xs",
                      confirmAction === "record-move-in" ? "bg-[#78A24C]" : "bg-[#264384]")}>
                      {actionLoading ? "..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <p className="text-sm font-bold text-[#44291B]/40">Select a resident to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEvent({ color, title, subtitle, isLast }: any) {
  return (
    <div className="relative pl-7">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[9px] top-3.5 bottom-[-24px] w-[2px] bg-[#e8e2d6]" />
      )}
      {/* Dot */}
      <div className={cn("absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10", color)} />
      <div>
        <p className="text-sm font-bold text-[#44291B] leading-none mb-1">{title}</p>
        <p className="text-xs text-[#44291B]/50 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}
