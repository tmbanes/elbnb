"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Building2, Home, Users, KeyRound, Scissors, Clock3, Wallet, AlertTriangle, AlertCircle, FileText, House, UserCheck, BarChart3, Search, Filter, MoreHorizontal, Download, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Archivo, Archivo_Black } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

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

// ── Pagination Helper ──
const PROP_PER_PAGE = 5;
const APP_PER_PAGE = 5;
const STUDENT_PER_PAGE = 5;

function PaginationControls({ currentPage, totalPages, onPageChange, className = "" }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void; className?: string }) {
  if (totalPages <= 1) return null;
  return (
    <div className={`flex items-center justify-end gap-2 pt-4 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-30 hover:bg-[#E3E3E3] transition-colors h-8"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </button>
      <div className="flex items-center px-3 text-xs font-bold text-slate-700">
        {currentPage} / {totalPages}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-30 hover:bg-[#E3E3E3] transition-colors h-8"
      >
        Next <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Donut SVG ──
function DonutChart({ value, size = 120, label, color = "#78A24C" }: { value: number; size?: number; label: string; color?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="relative flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path className="text-[#EDEEE5]" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" />
        <path className="transition-all duration-1000 ease-out" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${clamped}, 100`} stroke={color} fill="none" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`${archivoBlack.className} text-2xl text-[#1F2937]`}>{pct(clamped)}</span>
        <span className={`${archivoBlack.className} text-[8px] uppercase text-[#6B7280] tracking-wider`}>{label}</span>
      </div>
    </div>
  );
}

// ── Main Component ──
export function DashboardClient({ stats, propertyOccupancy, recentApplications, pendingApplications, housedStudents, billingStatusCounts, alerts }: Props) {
  const [propFilter, setPropFilter] = useState<"all" | "available">("all");
  const [propSearch, setPropSearch] = useState("");
  const [propPage, setPropPage] = useState(1);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [appPage, setAppPage] = useState(1);
  const [studentTab, setStudentTab] = useState<"housed" | "waiting">("housed");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);

  const totalInInvoices = Object.values(billingStatusCounts).reduce((s, v) => s + v, 0);
  const paidLikeInvoices = (billingStatusCounts.paid ?? 0) + (billingStatusCounts.paid_late ?? 0) + (billingStatusCounts.partially_paid ?? 0);
  const paidInvoiceRate = totalInInvoices > 0 ? (paidLikeInvoices / totalInInvoices) * 100 : 0;

  const collectionGap = Math.max(0, stats.totalBilled - stats.totalCollected);
  const collectedToBilledRate = stats.totalBilled > 0 ? (stats.totalCollected / stats.totalBilled) * 100 : 0;

  const filteredProps = propertyOccupancy.filter(p => {
    if (propFilter === "available") return p.availableSlots > 0;
    const q = propSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      String(p.availableSlots).includes(q)
    );
  });

  const filteredRecentApplications = recentApplications.filter((a) => {
    const q = applicationSearch.trim().toLowerCase();
    if (!q) return true;
    const u = unwrap(a.users);
    const acc = unwrap(a.accommodation);
    const studentName = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.toLowerCase();
    const propertyName = String(acc?.name ?? "").toLowerCase();
    const type = String(a.preferred_unit_type ?? "").toLowerCase();
    const status = String(a.application_status ?? "").toLowerCase().replace(/_/g, " ");
    return studentName.includes(q) || propertyName.includes(q) || type.includes(q) || status.includes(q);
  });

  const kpiCards = [
    { label: "Revenue (MTD)", value: fmt(stats.revenueThisMonth), color: "#78A24C", desc: "This month", isString: true, icon: Wallet },
    { label: "Overdue Payments", value: stats.overdueCount, color: stats.overdueCount > 0 ? "#DF3538" : "#78A24C", desc: stats.overdueCount > 0 ? "Action required" : "All clear", icon: AlertTriangle },
    { label: "Waiting List", value: stats.waitingListCount, color: "#F2C908", desc: "Pending review", icon: Clock3 },
    { label: "Students Housed", value: stats.studentsHoused, color: "#EB8A0B", desc: "Currently active", icon: Scissors },
    { label: "Occupied Units", value: stats.occupiedUnits, color: "#EB8A0B", desc: pct(stats.occupancyRate) + " occupancy", icon: Users },
    { label: "Available Units", value: stats.availableUnits, color: "#78A24C", desc: "Ready to assign", icon: KeyRound },
    { label: "Total Properties", value: stats.totalProperties, color: "#5591AB", desc: `${stats.totalProperties} registered`, icon: Building2 },
    { label: "Total Units", value: stats.totalUnits, color: "#264384", desc: `Across all properties`, icon: Home },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5 bg-[#F3F6D0] min-h-[calc(100vh-2rem)] rounded-tl-3xl selection:bg-[#4A5628] selection:text-white">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className={`${archivoBlack.className} text-[44px] leading-[1.02] text-[#1F2937] tracking-tight`}>Admin Dashboard</h1>
          <p className={`${archivo.className} text-[#6B7280] mt-1 text-sm flex items-center gap-2`}>
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5C9E44] opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#5C9E44]" /></span>
            Live overview &middot; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className={`${archivo.className} text-xs font-semibold rounded-xl bg-white shadow-sm h-10 px-4`}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>
      </header>

      {/* ── Waiting List Banner ── */}
      {stats.waitingListCount > 0 && (
        <div className={`${archivo.className} w-full flex items-center gap-2.5 rounded-xl border border-[#f5df96] bg-[#FFFBEB] px-5 py-3 text-sm font-semibold text-[#92400E] shadow-sm animate-in fade-in duration-500 delay-100`}>
          <span className="h-2 w-2 rounded-full bg-[#F2C908] animate-pulse" />
          {stats.waitingListCount} student{stats.waitingListCount > 1 ? "s" : ""} on waiting list
        </div>
      )}

      {/* ── KPI Cards Sections ── */}
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">

        {/* Financials */}
        <div className="space-y-2">
          <h3 className={`${archivo.className} text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B7280] ml-1`}>Financials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Revenue (MTD)", value: fmt(stats.revenueThisMonth), color: "#78A24C", desc: "This month", icon: Wallet },
              { label: "Overdue Payments", value: stats.overdueCount, color: stats.overdueCount > 0 ? "#DF3538" : "#78A24C", desc: stats.overdueCount > 0 ? "Action required" : "All clear", icon: AlertTriangle },
            ].map((card, i) => (
              <Card key={i} className="shadow-sm border-none hover:shadow-md transition-all duration-300 ring-0 py-5 group cursor-default rounded-2xl" style={{ backgroundColor: card.color }}>
                <CardContent className="p-0 px-5 flex flex-col gap-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className={`${archivo.className} text-[11px] font-bold uppercase tracking-wider text-white/90`}>{card.label}</span>
                    <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"><card.icon className="w-5 h-5 text-white" /></div>
                  </div>
                  <span className={`${archivoBlack.className} text-[38px] leading-tight text-white`}>{typeof card.value === "string" ? card.value : card.value.toLocaleString()}</span>
                  <span className={`${archivo.className} text-[11px] text-white/80 font-medium`}>{card.desc}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Occupancy & Units */}
        <div className="space-y-2">
          <h3 className={`${archivo.className} text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B7280] ml-1`}>Occupancy & Units</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Occupied Units", value: stats.occupiedUnits, color: "#EB8A0B", desc: pct(stats.occupancyRate) + " occupancy", icon: Users },
              { label: "Available Units", value: stats.availableUnits, color: "#78A24C", desc: "Ready to assign", icon: KeyRound },
              { label: "Total Properties", value: stats.totalProperties, color: "#5591AB", desc: `${stats.totalProperties} registered`, icon: Building2 },
              { label: "Total Units", value: stats.totalUnits, color: "#264384", desc: `Across all properties`, icon: Home },
            ].map((card, i) => (
              <Card key={i} className="shadow-sm border-none hover:shadow-md transition-all duration-300 ring-0 py-5 group cursor-default rounded-2xl" style={{ backgroundColor: card.color }}>
                <CardContent className="p-0 px-5 flex flex-col gap-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className={`${archivo.className} text-[11px] font-bold uppercase tracking-wider text-white/90`}>{card.label}</span>
                    <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"><card.icon className="w-5 h-5 text-white" /></div>
                  </div>
                  <span className={`${archivoBlack.className} text-[38px] leading-tight text-white`}>{typeof card.value === "string" ? card.value : card.value.toLocaleString()}</span>
                  <span className={`${archivo.className} text-[11px] text-white/80 font-medium`}>{card.desc}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Students */}
        <div className="space-y-2">
          <h3 className={`${archivo.className} text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B7280] ml-1`}>Students</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Waiting List", value: stats.waitingListCount, color: "#F2C908", desc: "Pending review", icon: Clock3 },
              { label: "Students Housed", value: stats.studentsHoused, color: "#EB8A0B", desc: "Currently active", icon: Scissors },
            ].map((card, i) => (
              <Card key={i} className="shadow-sm border-none hover:shadow-md transition-all duration-300 ring-0 py-5 group cursor-default rounded-2xl" style={{ backgroundColor: card.color }}>
                <CardContent className="p-0 px-5 flex flex-col gap-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className={`${archivo.className} text-[11px] font-bold uppercase tracking-wider text-white/90`}>{card.label}</span>
                    <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"><card.icon className="w-5 h-5 text-white" /></div>
                  </div>
                  <span className={`${archivoBlack.className} text-[38px] leading-tight text-white`}>{typeof card.value === "string" ? card.value : card.value.toLocaleString()}</span>
                  <span className={`${archivo.className} text-[11px] text-white/80 font-medium`}>{card.desc}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row: Occupancy + Donut Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">

        {/* Property Occupancy */}
        <Card className="lg:col-span-2 shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-5 rounded-2xl h-full">
          <div className="flex items-center justify-between">
            <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Property Occupancy</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#44291B]/40 bg-[#FDFFF4] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search properties..."
                value={propSearch}
                onChange={(e) => { setPropSearch(e.target.value); setPropPage(1); }}
                className={`${archivo.className} w-full pl-9 pr-3 py-2.5 bg-[#FDFFF4] rounded-xl border border-[#cfd6e4] text-sm text-[#44291B] placeholder:text-[#44291B]/40 focus:outline-none focus:ring-2 focus:ring-[#78A24C]/20 focus:border-[#78A24C] transition-all h-10`}
              />
            </div>

            <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#cfd6e4] bg-[#FDFFF4] w-full sm:w-auto h-10">
              <Filter className="w-3.5 h-3.5 text-[#44291B]/40 bg-[#FDFFF4]" />
              <Select
                value={propFilter}
                onValueChange={(val: "all" | "available") => { setPropFilter(val); setPropPage(1); }}
              >
                <SelectTrigger className="w-full sm:w-[130px] border-none shadow-none bg-[#FDFFF4] focus:ring-0 px-0 text-[#44291B] text-sm h-full  tracking-wide">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFFF4] border-[#cfd6e4] text-[#44291B]">
                  <SelectItem value="all" className="text-sm tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">All Properties</SelectItem>
                  <SelectItem value="available" className="text-sm  tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">Available Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-5">
            {filteredProps.length === 0 ? (
              <p className="text-sm text-[#44291B]/40 text-center py-8">No properties match this filter.</p>
            ) : filteredProps.slice((propPage - 1) * PROP_PER_PAGE, propPage * PROP_PER_PAGE).map(p => (
              <div key={p.id} className="group hover:bg-[#F6F8D5] rounded-xl p-3 -mx-2 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`${archivoBlack.className} text-base text-[#44291B]`}>{p.name}</span>
                    <Badge className={`text-[10px] px-2.5 py-0.5 h-5 rounded-full border-none font-bold ${p.type === "dormitory" ? "bg-[#ebf2f4] text-[#5591AB]" : "bg-[#fbecd7] text-[#EB8A0B]"}`}>
                      {p.type === "dormitory" ? "Dorm" : "Rental"}
                    </Badge>
                    {p.rate >= 90 && (
                      <Badge className="h-5 px-2 py-0.5 rounded-md text-[10px] bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Nearly Full
                      </Badge>
                    )}
                    {p.rate < 35 && (
                      <Badge className="h-5 px-2 py-0.5 rounded-md text-[10px] bg-[#FEFCE8] text-[#854D0E] border border-[#FDE68A] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Low Occupancy
                      </Badge>
                    )}
                  </div>
                  <span className={`${archivoBlack.className} text-base text-[#44291B]`}>{pct(p.rate)}</span>
                </div>
                <div className={`${archivo.className} flex gap-1.5 mb-2 text-sm text-[#94a3b8]`}>
                  <span>{p.currentOccupancy}/{p.totalCapacity} slots</span>
                  <span>&middot;</span>
                  <span>{p.totalUnits} units</span>
                  <span>&middot;</span>
                  <span className="text-[#5C9E44]">{p.availableSlots} available</span>
                </div>
                <div className="w-full bg-[#EDEEE5] rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out bg-[#264384]" style={{ width: `${p.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
          <PaginationControls currentPage={propPage} totalPages={Math.ceil(filteredProps.length / PROP_PER_PAGE)} onPageChange={setPropPage} />
        </Card>

        {/* Summary Donuts */}
        <Card className="shadow-sm border border-black/5 bg-white ring-0 p-5 flex flex-col gap-5 overflow-hidden relative rounded-2xl h-full">
          <div className="w-full flex items-center justify-between">
            <h2 className={`${archivoBlack.className} text-lg text-[#1F2937]`}>Financial Summary</h2>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-6">
            <DonutChart value={stats.occupancyRate} label="Occupancy" color="#E8CD2E" />
            <DonutChart value={stats.collectionRate} label="Collection" color="#2F90C8" />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-3 border-t border-[#E5E7EB] text-center">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#f8fafc] p-4">
              <p className={`${archivoBlack.className} text-[9px] uppercase text-[#6B7280] tracking-wide leading-tight`}>Total<br />Billed</p>
              <p className={`${archivoBlack.className} text-2xl text-[#1F2937] mt-1`}>{fmt(stats.totalBilled)}</p>
            </div>
            <div className="rounded-xl border border-[#cfe9dc] bg-[#ebf8f1] p-4">
              <p className={`${archivoBlack.className} text-[9px] uppercase text-[#2f7b54] tracking-wide leading-tight`}>Total<br />Collected</p>
              <p className={`${archivoBlack.className} text-2xl text-[#1f6f4a] mt-1`}>{fmt(stats.totalCollected)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className={`${archivoBlack.className} text-xs uppercase tracking-wider text-[#6B7280]`}>Collection gap</p>
                <p className={`${archivoBlack.className} text-xl text-[#1F2937] leading-tight`}>{fmt(collectionGap)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className={`${archivo.className} text-xs text-[#6B7280]`}>Collected / Billed</p>
                  <p className={`${archivoBlack.className} text-sm text-[#1F2937]`}>{pct(collectedToBilledRate)}</p>
                </div>
                <DonutChart value={paidInvoiceRate} label="Paid invoices" size={96} color="#78A24C" />
              </div>
            </div>

            <div className="w-full bg-[#EDEEE5] rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out bg-[#5C9E44]" style={{ width: `${Math.min(100, Math.max(0, collectedToBilledRate))}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(billingStatusCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([status, count]) => {
                  const pctVal = totalInInvoices > 0 ? (count / totalInInvoices) * 100 : 0;
                  const label = status.replace(/_/g, " ");
                  return (
                    <div key={status} className="rounded-lg border border-[#F3F4F6] bg-[#f8fafc] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`${archivo.className} text-xs font-semibold text-[#374151] capitalize truncate`}>{label}</span>
                        <span className={`${archivoBlack.className} text-xs text-[#1F2937] shrink-0`}>{count}</span>
                      </div>
                      <div className="w-full bg-[#EDEEE5] rounded-full h-1.5 overflow-hidden mt-1.5">
                        <div className="h-full rounded-full bg-[#4A5628] transition-all duration-700" style={{ width: `${pctVal}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className={`${archivo.className}`}>Overdue payments</span>
              <span className={`${archivoBlack.className} ${stats.overdueCount > 0 ? "text-[#8B1A1A]" : "text-[#1F2937]"}`}>{stats.overdueCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row: Recent Apps + Students ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-500">

        {/* Recent Applications Table */}
        <Card className="lg:col-span-2 shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-4 rounded-2xl h-full lg:min-h-[26rem]">
          <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Recent Applications</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-[#44291B]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search applications..."
              value={applicationSearch}
              onChange={(e) => { setApplicationSearch(e.target.value); setAppPage(1); }}
              className={`${archivo.className} w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#cfd6e4] text-sm bg-[#FDFFF4] text-[#44291B] placeholder:text-[#44291B]/40 focus:outline-none focus:ring-2 focus:ring-[#78A24C]/20 focus:border-[#78A24C] transition-all h-10`}
            />
          </div>
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#cfd6e4] bg-[#FDFFF4]">
                  <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Applicant</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Property</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Type</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Date</th>
                  <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentApplications.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-[#44291B]/40 font-bold">No applications found.</td></tr>
                ) : filteredRecentApplications.slice((appPage - 1) * APP_PER_PAGE, appPage * APP_PER_PAGE).map(a => {
                  const u = unwrap(a.users);
                  const acc = unwrap(a.accommodation);
                  return (
                    <tr key={a.application_id} className="hover:bg-[#F6F8D5] transition-colors border-b border-[#cfd6e4]/60 last:border-b-0 group">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#44291B] to-[#734A35] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{initials(u?.first_name ?? "", u?.last_name ?? "")}</div>
                          <div>
                            <p className="text-sm font-bold text-[#44291B]">{u?.first_name ?? "—"} {u?.last_name ?? ""}</p>
                            <p className="text-[10px] text-[#44291B]/50 font-medium">ID: {a.application_id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-[#44291B]">{acc?.name ?? "—"}</td>
                      <td className="py-3 px-3 text-sm font-bold text-[#44291B] capitalize">{a.preferred_unit_type?.replace(/_/g, " ") ?? "—"}</td>
                      <td className="py-3 px-3 text-xs font-bold text-[#44291B]">{a.date_submitted ? new Date(a.date_submitted).toLocaleDateString() : "—"}</td>
                      <td className="py-3 px-3">
                        <span className={`${archivoBlack.className} px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadge(a.application_status)}`}>
                          {a.application_status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={appPage} totalPages={Math.ceil(filteredRecentApplications.length / APP_PER_PAGE)} onPageChange={setAppPage} />
        </Card>

        {/* Student Management */}
        <Card className="shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-5 rounded-2xl h-full lg:min-h-[26rem]">
          <div className="flex items-center justify-between">
            <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Students</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#44291B]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); setStudentPage(1); }}
                className={`${archivo.className} w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#cfd6e4] text-sm focus:outline-none focus:ring-2 focus:ring-[#78A24C]/20 focus:border-[#78A24C] transition-all bg-[#FDFFF4] text-[#44291B] placeholder:text-[#44291B]/40 h-10`}
              />
            </div>

            <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#cfd6e4] bg-[#FDFFF4] w-full sm:w-auto h-10">
              <Filter className="w-3.5 h-3.5 text-[#44291B]/40" />
              <Select
                value={studentTab}
                onValueChange={(val: "housed" | "waiting") => { setStudentTab(val); setStudentSearch(""); setStudentPage(1); }}
              >
                <SelectTrigger className="w-full sm:w-[130px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] text-sm h-full tracking-wide">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFFF4] border-[#cfd6e4] text-[#44291B]">
                  <SelectItem value="housed" className="text-sm tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">Housed ({stats.studentsHoused})</SelectItem>
                  <SelectItem value="waiting" className="text-sm tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">Waiting ({stats.waitingListCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(() => {
            const filteredHoused = housedStudents.filter(s => {
              if (!studentSearch) return true;
              const u = unwrap(s.users);
              const name = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.toLowerCase();
              return name.includes(studentSearch.toLowerCase());
            });
            const filteredWaiting = pendingApplications.filter(a => {
              if (!studentSearch) return true;
              const u = unwrap(a.users);
              const name = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.toLowerCase();
              return name.includes(studentSearch.toLowerCase());
            });
            const currentList = studentTab === "housed" ? filteredHoused : filteredWaiting;
            const totalStudentPages = Math.ceil(currentList.length / STUDENT_PER_PAGE);
            const pagedList = currentList.slice((studentPage - 1) * STUDENT_PER_PAGE, studentPage * STUDENT_PER_PAGE);

            return (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="space-y-1.5 flex-1">
                  {studentTab === "housed" ? (
                    (pagedList as typeof housedStudents).map(s => {
                      const u = unwrap(s.users);
                      const unit = s.unit;
                      const accName = unit ? (Array.isArray(unit.accommodation) ? unit.accommodation[0]?.name : unit.accommodation?.name) : null;
                      return (
                        <div key={s.assignment_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F6F8D5] border-b border-[#cfd6e4]/40 last:border-b-0 transition-all group cursor-default">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#44291B] to-[#734A35] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{initials(u?.first_name ?? "", u?.last_name ?? "")}</div>
                          <div className="min-w-0 flex-1">
                            <p className={`${archivo.className} text-sm font-bold text-[#44291B] truncate`}>{u?.first_name ?? "—"} {u?.last_name ?? ""}</p>
                            <p className={`${archivo.className} text-[10px] text-[#44291B]/50 font-medium truncate uppercase tracking-tight`}>{accName ?? "—"} &middot; {unit?.unit_number ?? "—"}</p>
                          </div>
                          <Badge variant="outline" className={`${archivoBlack.className} text-[9px] px-2 py-0.5 h-5 rounded-md bg-[#ebf2f4] text-[#5591AB] border-none font-bold shrink-0`}>Housed</Badge>
                        </div>
                      );
                    })
                  ) : (
                    (pagedList as typeof pendingApplications).map(a => {
                      const u = unwrap(a.users);
                      const acc = unwrap(a.accommodation);
                      return (
                        <div key={a.application_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F6F8D5] border-b border-[#cfd6e4]/40 last:border-b-0 transition-all group cursor-default">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#F2C908] to-[#D4A106] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{initials(u?.first_name ?? "", u?.last_name ?? "")}</div>
                          <div className="min-w-0 flex-1">
                            <p className={`${archivo.className} text-sm font-bold text-[#44291B] truncate`}>{u?.first_name ?? "—"} {u?.last_name ?? ""}</p>
                            <p className={`${archivo.className} text-[10px] text-[#44291B]/50 font-medium truncate uppercase tracking-tight`}>{acc?.name ?? "—"} &middot; {a.preferred_unit_type ?? "—"}</p>
                          </div>
                          <span className={`${archivoBlack.className} px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap ${statusBadge(a.application_status)}`}>
                            {a.application_status.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <PaginationControls currentPage={studentPage} totalPages={totalStudentPages} onPageChange={setStudentPage} />
              </div>
            );
          })()}
        </Card>
      </div>

      {/* ── Row: Quick Reports ── */}
      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-12 duration-500 delay-700">
        <Card className="shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-5 rounded-2xl">
          <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Quick Reports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Dormitories with occupancy rates", icon: House, color: "#78A24C" },
              { label: "Available vs occupied units", icon: BarChart3, color: "#264384" },
              { label: "Students currently housed", icon: UserCheck, color: "#5591AB" },
              { label: "Students on waiting list", icon: Clock3, color: "#F2C908" },
              { label: "Revenue summary per property", icon: Wallet, color: "#EB8A0B" },
              { label: "Overdue & unpaid fees", icon: FileText, color: "#DF3538" },
            ].map((report, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-[#cfd6e4]/50 bg-white/50 hover:bg-[#F6F8D5] hover:border-[#cfd6e4] transition-all group cursor-pointer">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm" style={{ backgroundColor: `${report.color}15`, color: report.color }}>
                  <report.icon className="w-5 h-5" />
                </div>
                <span className={`${archivo.className} text-sm text-[#44291B] font-bold leading-snug`}>{report.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
