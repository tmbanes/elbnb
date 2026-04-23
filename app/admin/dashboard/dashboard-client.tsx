"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Types ──
type Stats = {
  totalProperties: number; totalUnits: number; occupiedUnits: number; availableUnits: number;
  studentsHoused: number; waitingListCount: number; revenueThisMonth: number; overdueCount: number;
  occupancyRate: number; collectionRate: number; totalCollected: number; totalBilled: number;
};
type PropertyOcc = {
  id: string; name: string; type: string; status: string;
  totalUnits: number; totalCapacity: number; currentOccupancy: number; availableSlots: number; rate: number;
};
type AppRow = {
  application_id: string; application_status: string; date_submitted: string;
  preferred_unit_type: string | null;
  users: { first_name: string; last_name: string; email?: string } | { first_name: string; last_name: string; email?: string }[] | null;
  accommodation: { name: string } | { name: string }[] | null;
};
type HousedStudent = {
  assignment_id: string; user_id: string; move_in_date: string; expected_move_out_date: string;
  users: { first_name: string; last_name: string; email?: string } | { first_name: string; last_name: string; email?: string }[] | null;
  unit: { unit_number: string; accommodation: { name: string } | { name: string }[] | null } | null;
};
type Alert = { type: "warning" | "danger" | "info"; message: string };

interface Props {
  stats: Stats;
  propertyOccupancy: PropertyOcc[];
  recentApplications: AppRow[];
  pendingApplications: AppRow[];
  housedStudents: HousedStudent[];
  billingStatusCounts: Record<string, number>;
  alerts: Alert[];
}

// ── Helpers ──
const fmt = (n: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;
const unwrap = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] : v);
const initials = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending_admin: "bg-[#FFF3CD] text-[#BA7517]", pending_dorm_manager: "bg-[#FFF3CD] text-[#BA7517]",
    pending_payment: "bg-[#E0E7FF] text-[#4338CA]", approved: "bg-[#DFF2E8] text-[#1A6B3A]",
    rejected: "bg-[#FDEAEA] text-[#8B1A1A]", cancelled: "bg-gray-100 text-gray-600",
  };
  return map[s] ?? "bg-gray-100 text-gray-700";
};

// ── Donut SVG ──
function DonutChart({ value, size = 120, label }: { value: number; size?: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path className="text-[#EDEEE5]" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" />
        <path className="text-[#4A5628] transition-all duration-1000 ease-out" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${clamped}, 100`} stroke="currentColor" fill="none" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-archivo-black text-[#1F2937]">{pct(clamped)}</span>
        <span className="text-[8px] font-archivo-black uppercase text-[#6B7280] tracking-wider">{label}</span>
      </div>
    </div>
  );
}

// ── Main Component ──
export function DashboardClient({ stats, propertyOccupancy, recentApplications, pendingApplications, housedStudents, billingStatusCounts, alerts }: Props) {
  const [propFilter, setPropFilter] = useState<"all" | "high" | "available">("all");
  const [studentTab, setStudentTab] = useState<"housed" | "waiting">("housed");
  const [studentSearch, setStudentSearch] = useState("");

  const filteredProps = propertyOccupancy.filter(p => {
    if (propFilter === "high") return p.rate >= 75;
    if (propFilter === "available") return p.availableSlots > 0;
    return true;
  });

  const kpiCards = [
    { label: "Total Properties", value: stats.totalProperties, color: "#4A5628", desc: `${stats.totalProperties} registered` },
    { label: "Total Units", value: stats.totalUnits, color: "#4A5628", desc: `Across all properties` },
    { label: "Occupied Units", value: stats.occupiedUnits, color: "#BA7517", desc: pct(stats.occupancyRate) + " occupancy" },
    { label: "Available Units", value: stats.availableUnits, color: "#5C9E44", desc: "Ready to assign" },
    { label: "Students Housed", value: stats.studentsHoused, color: "#4A5628", desc: "Currently active" },
    { label: "Waiting List", value: stats.waitingListCount, color: stats.waitingListCount > 5 ? "#E24B4A" : "#BA7517", desc: "Pending review" },
    { label: "Revenue (MTD)", value: fmt(stats.revenueThisMonth), color: "#5C9E44", desc: "This month", isString: true },
    { label: "Overdue Payments", value: stats.overdueCount, color: stats.overdueCount > 0 ? "#E24B4A" : "#5C9E44", desc: stats.overdueCount > 0 ? "Action required" : "All clear" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#EDEEE5] min-h-[calc(100vh-2rem)] rounded-tl-3xl selection:bg-[#4A5628] selection:text-white">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl lg:text-3xl font-archivo-black text-[#1F2937] tracking-tight">Admin Dashboard</h1>
          <p className="text-[#6B7280] font-archivo mt-1 text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5C9E44] opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#5C9E44]" /></span>
            Live overview &middot; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs font-semibold rounded-lg">Export CSV</Button>
        </div>
      </header>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in duration-500 delay-100">
          {alerts.map((a, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${a.type === "danger" ? "bg-[#FDEAEA] text-[#8B1A1A]" : a.type === "warning" ? "bg-[#FFF3CD] text-[#BA7517]" : "bg-[#E0E7FF] text-[#4338CA]"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${a.type === "danger" ? "bg-[#E24B4A]" : a.type === "warning" ? "bg-[#BA7517]" : "bg-[#4338CA]"}`} />
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">
        {kpiCards.map((card, i) => (
          <Card key={i} className="shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent bg-gradient-to-br from-white to-slate-50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ring-0 py-4 group cursor-default">
            <CardContent className="p-0 px-4 flex flex-col gap-1 relative overflow-hidden">
              <span className="text-[9px] font-archivo-black uppercase tracking-wider" style={{ color: "#6B7280" }}>{card.label}</span>
              <span className="text-2xl lg:text-3xl font-archivo-black group-hover:scale-105 origin-left transition-transform duration-300" style={{ color: card.color }}>{card.isString ? card.value : card.value.toLocaleString()}</span>
              <span className="text-[10px] text-[#9CA3AF] font-medium">{card.desc}</span>
              <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" style={{ background: `${card.color}08` }} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row: Occupancy + Donut Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">

        {/* Property Occupancy */}
        <Card className="lg:col-span-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent bg-white ring-0 p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-lg font-archivo-black text-[#1F2937]">Property Occupancy</h2>
            <div className="flex gap-1">
              {(["all", "high", "available"] as const).map(f => (
                <button key={f} onClick={() => setPropFilter(f)} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors ${propFilter === f ? "bg-[#4A5628] text-white" : "bg-slate-100 text-[#6B7280] hover:bg-slate-200"}`}>
                  {f === "high" ? "High Cap." : f === "available" ? "Available" : "All"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {filteredProps.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-8">No properties match this filter.</p>
            ) : filteredProps.map(p => (
              <div key={p.id} className="group hover:bg-slate-50/80 rounded-lg p-2 -mx-2 transition-colors">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F2937] group-hover:text-[#4A5628] transition-colors">{p.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 rounded-md border-[#E5E7EB]">{p.type === "dormitory" ? "Dorm" : "Rental"}</Badge>
                  </div>
                  <span className="font-archivo-black text-[#1F2937]">{pct(p.rate)}</span>
                </div>
                <div className="w-full bg-[#EDEEE5] rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${p.rate > 85 ? "bg-gradient-to-r from-[#E24B4A] to-[#C93C3B]" : p.rate > 60 ? "bg-gradient-to-r from-[#4A5628] to-[#6B7A3A]" : "bg-gradient-to-r from-[#A8C060] to-[#5C9E44]"}`} style={{ width: `${p.rate}%` }} />
                </div>
                <div className="flex gap-4 mt-1 text-[10px] text-[#9CA3AF]">
                  <span>{p.currentOccupancy}/{p.totalCapacity} slots</span>
                  <span>{p.totalUnits} units</span>
                  <span className="text-[#5C9E44]">{p.availableSlots} available</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Summary Donuts */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent bg-white ring-0 p-5 flex flex-col items-center justify-center gap-6">
          <h2 className="text-lg font-archivo-black text-[#1F2937] self-start">Summary</h2>
          <div className="flex flex-col items-center gap-6">
            <DonutChart value={stats.occupancyRate} label="Occupancy" />
            <DonutChart value={stats.collectionRate} size={100} label="Collection" />
          </div>
          <div className="flex w-full justify-around pt-4 border-t border-[#E5E7EB] text-center">
            <div><p className="text-[9px] font-archivo-black uppercase text-[#6B7280]">Billed</p><p className="font-archivo-black text-sm text-[#1F2937]">{fmt(stats.totalBilled)}</p></div>
            <div><p className="text-[9px] font-archivo-black uppercase text-[#6B7280]">Collected</p><p className="font-archivo-black text-sm text-[#5C9E44]">{fmt(stats.totalCollected)}</p></div>
          </div>
        </Card>
      </div>

      {/* ── Row: Recent Apps + Students ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-500">

        {/* Recent Applications Table */}
        <Card className="lg:col-span-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent bg-white ring-0 p-5 flex flex-col gap-4">
          <h2 className="text-lg font-archivo-black text-[#1F2937]">Recent Applications</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  {["Student", "Property", "Type", "Date", "Status"].map(h => (
                    <th key={h} className="text-[9px] font-archivo-black uppercase text-[#6B7280] tracking-wider pb-2 text-left px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentApplications.map(a => {
                  const u = unwrap(a.users);
                  const acc = unwrap(a.accommodation);
                  return (
                    <tr key={a.application_id} className="hover:bg-slate-50/60 transition-colors group/row">
                      <td className="py-2.5 px-2 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#4A5628] to-[#6B7A3A] text-white flex items-center justify-center text-[10px] font-semibold shrink-0">{initials(u?.first_name ?? "", u?.last_name ?? "")}</div>
                        <span className="font-medium text-[#1F2937] text-xs group-hover/row:text-[#4A5628] transition-colors truncate max-w-[120px]">{u?.first_name ?? "—"} {u?.last_name ?? ""}</span>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-[#4B5563] truncate max-w-[100px]">{acc?.name ?? "—"}</td>
                      <td className="py-2.5 px-2 text-xs text-[#4B5563]">{a.preferred_unit_type ?? "—"}</td>
                      <td className="py-2.5 px-2 text-xs text-[#4B5563]">{a.date_submitted ? new Date(a.date_submitted).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-archivo-black uppercase tracking-wider ${statusBadge(a.application_status)}`}>
                          {a.application_status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentApplications.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-sm text-[#9CA3AF]">No applications yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Student Management */}
        <Card className="lg:col-span-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent bg-white ring-0 p-5 flex flex-col gap-4">
          <h2 className="text-lg font-archivo-black text-[#1F2937]">Students</h2>
          <div className="flex gap-1">
            {(["housed", "waiting"] as const).map(t => (
              <button key={t} onClick={() => { setStudentTab(t); setStudentSearch(""); }} className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors ${studentTab === t ? "bg-[#4A5628] text-white" : "bg-slate-100 text-[#6B7280] hover:bg-slate-200"}`}>
                {t === "housed" ? `Housed (${stats.studentsHoused})` : `Waiting (${stats.waitingListCount})`}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#4A5628]/20 focus:border-[#4A5628] transition-all bg-slate-50" />

          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {studentTab === "housed" ? (
              housedStudents.filter(s => {
                if (!studentSearch) return true;
                const u = unwrap(s.users);
                const name = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.toLowerCase();
                return name.includes(studentSearch.toLowerCase());
              }).map(s => {
                const u = unwrap(s.users);
                const unit = s.unit;
                const accName = unit ? (Array.isArray(unit.accommodation) ? unit.accommodation[0]?.name : unit.accommodation?.name) : null;
                return (
                  <div key={s.assignment_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-default">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#4A5628] to-[#6B7A3A] text-white flex items-center justify-center text-[10px] font-semibold shrink-0">{initials(u?.first_name ?? "", u?.last_name ?? "")}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1F2937] truncate group-hover:text-[#4A5628] transition-colors">{u?.first_name ?? "—"} {u?.last_name ?? ""}</p>
                      <p className="text-[10px] text-[#9CA3AF] truncate">{accName ?? "—"} &middot; {unit?.unit_number ?? "—"}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 rounded-md bg-[#DFF2E8] text-[#1A6B3A] border-transparent shrink-0">Active</Badge>
                  </div>
                );
              })
            ) : (
              pendingApplications.filter(a => {
                if (!studentSearch) return true;
                const u = unwrap(a.users);
                const name = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.toLowerCase();
                return name.includes(studentSearch.toLowerCase());
              }).map(a => {
                const u = unwrap(a.users);
                const acc = unwrap(a.accommodation);
                return (
                  <div key={a.application_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-default">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#BA7517] to-[#D4922A] text-white flex items-center justify-center text-[10px] font-semibold shrink-0">{initials(u?.first_name ?? "", u?.last_name ?? "")}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1F2937] truncate group-hover:text-[#BA7517] transition-colors">{u?.first_name ?? "—"} {u?.last_name ?? ""}</p>
                      <p className="text-[10px] text-[#9CA3AF] truncate">{acc?.name ?? "—"} &middot; {a.preferred_unit_type ?? "—"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-archivo-black uppercase ${statusBadge(a.application_status)}`}>{a.application_status.replace(/_/g, " ")}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ── Row: Billing Status + Payment Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-500 delay-700">

        {/* Billing Status Distribution */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent bg-white ring-0 p-5 flex flex-col gap-4">
          <h2 className="text-lg font-archivo-black text-[#1F2937]">Payment Status Distribution</h2>
          <div className="space-y-3">
            {Object.entries(billingStatusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const total = Object.values(billingStatusCounts).reduce((s, v) => s + v, 0);
              const pctVal = total > 0 ? (count / total) * 100 : 0;
              const colorMap: Record<string, string> = {
                paid: "#5C9E44", paid_late: "#A8C060", partially_paid: "#BA7517",
                unpaid: "#E24B4A", overdue: "#C93C3B", pending: "#6B7280",
                pending_verification: "#4338CA", failed: "#8B1A1A",
              };
              const color = colorMap[status] ?? "#6B7280";
              return (
                <div key={status} className="group">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#374151] capitalize">{status.replace(/_/g, " ")}</span>
                    <span className="font-archivo-black text-[#1F2937]">{count} <span className="font-normal text-[#9CA3AF]">({pct(pctVal)})</span></span>
                  </div>
                  <div className="w-full bg-[#EDEEE5] rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctVal}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(billingStatusCounts).length === 0 && <p className="text-sm text-[#9CA3AF] text-center py-6">No billing data available.</p>}
          </div>
        </Card>

        {/* Quick Reports */}
        <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent bg-white ring-0 p-5 flex flex-col gap-4">
          <h2 className="text-lg font-archivo-black text-[#1F2937]">Quick Reports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Dormitories with occupancy rates",
              "Available vs occupied units",
              "Students currently housed",
              "Students on waiting list",
              "Revenue summary per property",
              "Overdue & unpaid fees",
            ].map((report, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-[#A8C060]/50 hover:bg-slate-50/80 hover:shadow-sm hover:-translate-y-0.5 transition-all group cursor-pointer">
                <div className="h-8 w-8 rounded-lg bg-[#F0F2E9] text-[#4A5628] flex items-center justify-center shrink-0 group-hover:bg-[#4A5628] group-hover:text-white transition-all text-sm">📄</div>
                <span className="text-xs text-[#4B5563] group-hover:text-[#1F2937] font-medium leading-snug">{report}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
