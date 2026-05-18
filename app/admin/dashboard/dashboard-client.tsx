"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
import { useRouter } from "next/navigation";
import { useRealtimeSync } from "@/lib/realtime-sync";
import { Building2, Home, Users, KeyRound, Clock3, Wallet, AlertTriangle, AlertCircle, FileText, House, UserCheck, BarChart3, Search, Filter, MoreHorizontal, Download, ChevronLeft, ChevronRight, Eye, Bell, ArrowRight } from "lucide-react";
import { Archivo, Archivo_Black } from "next/font/google";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

// Types
type Stats = {
  totalProperties: number; totalUnits: number; occupiedUnits: number; availableUnits: number;
  studentsHoused: number; waitingListCount: number; revenueThisMonth: number; overdueCount: number;
  occupancyRate: number; collectionRate: number; totalCollected: number; totalBilled: number;
  unpaidBalance: number; overdueBalance: number;
};
type PropertyOcc = {
  id: string; name: string; type: string; status: string;
  totalUnits: number; totalCapacity: number; currentOccupancy: number; availableSlots: number; rate: number;
};
type AppRow = {
  application_id: string; application_status: string; date_submitted: string;
  preferred_unit_type: string | null;
  duration_of_stay: number | null;
  check_in: string | null;
  check_out: string | null;
  number_of_companions: number | null;
  users: { first_name: string; last_name: string; email?: string; sex?: string } | { first_name: string; last_name: string; email?: string; sex?: string }[] | null;
  accommodation: { name: string } | { name: string }[] | null;
};
type HousedStudent = {
  assignment_id: string; user_id: string; move_in_date: string; expected_move_out_date: string;
  users: { first_name: string; last_name: string; email?: string } | { first_name: string; last_name: string; email?: string }[] | null;
  unit: { unit_number: string; accommodation: { name: string } | { name: string }[] | null } | null;
};
type Alert = { type: "warning" | "danger" | "info"; message: string };

interface Props {
  user: any;
  profile: any;
  notifications: any[];
  stats: Stats;
  propertyOccupancy: PropertyOcc[];
  recentApplications: AppRow[];
  pendingApplications: AppRow[];
  housedStudents: HousedStudent[];
  billingStatusCounts: Record<string, number>;
  alerts: Alert[];
  activityLogs?: any[];
}

// Helpers
const fmt = (n: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;
const unwrap = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] : v);
const initials = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

const statusBadgeDetails = (s: string) => {
  const map: Record<string, { badge: string; dot: string; label: string }> = {
    approved: { badge: "bg-[#E7FAD3] text-[#78A24C]", dot: "bg-[#78A24C]", label: "Approved" },
    rejected: { badge: "bg-[#FEF2F2] text-[#B91C1C]", dot: "bg-[#B91C1C]", label: "Rejected" },
    cancelled: { badge: "bg-[#F3F4F6] text-[#6B7280]", dot: "bg-gray-400", label: "Cancelled" },
    waitlisted: { badge: "bg-[#FFF7ED] text-[#EA580C]", dot: "bg-[#EA580C]", label: "Waitlisted" },
    pending_admin: { badge: "bg-[#EEF2FF] text-[#4F46E5]", dot: "bg-[#4F46E5]", label: "Pending Admin" },
    pending_payment: { badge: "bg-[#EEF2FF] text-[#4F46E5]", dot: "bg-[#4F46E5]", label: "Pending Payment" },
    pending_dorm_manager: { badge: "bg-[#EEF2FF] text-[#4F46E5]", dot: "bg-[#4F46E5]", label: "Pending Manager" },
  };
  return map[s] ?? { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: s.replace(/_/g, " ") };
};

// Pagination
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

// Donut SVG
function DonutChart({ value, size = 120, label, color = "#78A24C" }: { value: number; size?: number; label: string; color?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  // Dynamic font sizing
  const pctSize = size >= 120 ? "text-xl" : size >= 100 ? "text-lg" : "text-sm";
  const labelSize = size >= 120 ? "text-[8px]" : "text-[7px]";

  return (
    <div className="relative flex items-center justify-center rounded-full bg-white/50 shadow-sm ring-1 ring-[#cfd6e4]/50" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path className="text-[#EDEEE5]" strokeWidth="3.2" stroke="currentColor" fill="none" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" />
        <path className="transition-all duration-1000 ease-out" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${clamped}, 100`} stroke={color} fill="none" d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
        <span className={`${archivoBlack.className} ${pctSize} text-[#44291B] leading-none`}>{pct(clamped)}</span>
        <span className={`${archivoBlack.className} ${labelSize} uppercase text-[#44291B]/50 tracking-tighter mt-0.5 leading-none`}>{label}</span>
      </div>
    </div>
  );
}

function getActionBadgeStyle(action: string): string {
  const act = (action || "").toLowerCase();
  if (act.includes("create") || act.includes("add") || act.includes("assign")) {
    return "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]";
  }
  if (act.includes("approve") || act.includes("pay") || act.includes("success")) {
    return "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]";
  }
  if (act.includes("update") || act.includes("edit") || act.includes("modify")) {
    return "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]";
  }
  if (act.includes("delete") || act.includes("remove") || act.includes("reject") || act.includes("cancel")) {
    return "bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]";
  }
  return "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]";
}

function getEntityBadgeStyle(entity: string): string {
  const ent = (entity || "").toLowerCase();
  if (ent.includes("accommodation") || ent.includes("property")) {
    return "bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF]";
  }
  if (ent.includes("unit") || ent.includes("room")) {
    return "bg-[#F5F3FF] text-[#4338CA] border border-[#DDD6FE]";
  }
  if (ent.includes("application")) {
    return "bg-[#FDF2F8] text-[#BE185D] border border-[#FBCFE8]";
  }
  if (ent.includes("billing") || ent.includes("payment") || ent.includes("invoice")) {
    return "bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]";
  }
  return "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]";
}

// Main Component
export function DashboardClient({ user, profile, notifications: initialNotifications, stats, propertyOccupancy, recentApplications, pendingApplications, housedStudents, billingStatusCounts, alerts, activityLogs }: Props) {
  const [propFilter, setPropFilter] = useState<"all" | "available">("all");
  const [propSearch, setPropSearch] = useState("");
  const [propPage, setPropPage] = useState(1);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [appPage, setAppPage] = useState(1);
  const [studentTab, setStudentTab] = useState<"housed" | "waiting">("housed");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);

  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [notifications, setNotifications] = useState(initialNotifications);
  const router = useRouter();

  const generatePDF = (title: string, columns: string[], data: any[][], fileName: string, headerColor: [number, number, number]) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(68, 41, 27);
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 30);
    doc.text(`Admin: ${profile?.first_name} ${profile?.last_name}`, 14, 35);
    doc.line(14, 40, 196, 40);

    autoTable(doc, {
      startY: 48,
      head: [columns],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: headerColor },
      styles: { fontSize: 9 }
    });

    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportCSV = () => {
    const csvRows = [];

    // Stats
    csvRows.push(["--- DASHBOARD SUMMARY ---"]);
    csvRows.push(["Metric", "Value"]);
    Object.entries(stats).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      const formattedValue = typeof value === 'number' && key.toLowerCase().includes('rate') ? `${value.toFixed(1)}%` : value;
      csvRows.push([label, formattedValue]);
    });
    csvRows.push([]);

    // Occupancy
    csvRows.push(["--- PROPERTY OCCUPANCY ---"]);
    csvRows.push(["Name", "Type", "Status", "Total Units", "Capacity", "Current Occupancy", "Available Slots", "Occupancy Rate (%)"]);
    propertyOccupancy.forEach(p => {
      csvRows.push([p.name, p.type, p.status, p.totalUnits, p.totalCapacity, p.currentOccupancy, p.availableSlots, p.rate.toFixed(1)]);
    });
    csvRows.push([]);

    // Pending
    csvRows.push(["--- PENDING APPLICATIONS ---"]);
    csvRows.push(["Applicant", "Unit Type", "Date Submitted", "Status"]);
    pendingApplications.forEach(a => {
      const user = unwrap(a.users);
      csvRows.push([
        user ? `${user.first_name} ${user.last_name}` : "Unknown",
        a.preferred_unit_type || "N/A",
        new Date(a.date_submitted).toLocaleDateString(),
        a.application_status
      ]);
    });

    const csvContent = csvRows.map(e => e.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkAllAsRead = () => {
    if (typeof window !== 'undefined') {
      const existingReadIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      const currentIds = notifications.map(n => n.id);
      const allIds = Array.from(new Set([...existingReadIds, ...currentIds]));
      localStorage.setItem('read_notifications', JSON.stringify(allIds));
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      setNotifications(initialNotifications.map(n => ({
        ...n,
        is_read: n.is_read || readIds.includes(n.id)
      })));
    }
  }, [initialNotifications]);

  useRealtimeSync('activity_log', undefined, 'INSERT');

  const totalInInvoices = Object.values(billingStatusCounts).reduce((s, v) => s + v, 0);
  const paidLikeInvoices = (billingStatusCounts.paid ?? 0) + (billingStatusCounts.paid_late ?? 0) + (billingStatusCounts.partially_paid ?? 0);
  const paidInvoiceRate = totalInInvoices > 0 ? (paidLikeInvoices / totalInInvoices) * 100 : 0;

  const collectionGap = Math.max(0, stats.totalBilled - stats.totalCollected);
  const collectedToBilledRate = stats.totalBilled > 0 ? (stats.totalCollected / stats.totalBilled) * 100 : 0;

  const filteredProps = propertyOccupancy.filter(p => {
    // Check availability filter
    const matchesFilter = propFilter === "available" ? p.availableSlots > 0 : true;
    if (!matchesFilter) return false;

    // Check search query
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
    { label: "Students Housed", value: stats.studentsHoused, color: "#EB8A0B", desc: "Currently active", icon: UserCheck },
    { label: "Occupied Units", value: stats.occupiedUnits, color: "#EB8A0B", desc: pct(stats.occupancyRate) + " occupancy", icon: Users },
    { label: "Available Units", value: stats.availableUnits, color: "#78A24C", desc: "Ready to assign", icon: KeyRound },
    { label: "Total Properties", value: stats.totalProperties, color: "#5591AB", desc: `${stats.totalProperties} registered`, icon: Building2 },
    { label: "Total Units", value: stats.totalUnits, color: "#264384", desc: `Across all properties`, icon: Home },
  ];

  return (
    <div className="min-h-screen px-4 md:px-10 py-4 md:py-10 bg-[#F6F8D5] selection:bg-[#4A5628] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className={`${archivoBlack.className} text-3xl md:text-5xl text-[#44291B] mr-2`}>Admin Dashboard</h1>
            <p className={`${archivo.className} text-[#44291B] pt-3 md:text-md text-sm flex items-center gap-2`}>
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5C9E44] opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#5C9E44]" /></span>
              Live overview &middot; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                className={`relative text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100 ${showNotifications ? 'bg-slate-100 text-[#5D6BDE]' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A05C5C] rounded-full ring-2 ring-[#F6F8D5]"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-bold text-[#78A24C] uppercase tracking-wider hover:text-[#5C7E3A] transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div
                          key={i}
                          className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group"
                          onClick={() => {
                            const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                            if (!readIds.includes(n.id)) {
                              readIds.push(n.id);
                              localStorage.setItem('read_notifications', JSON.stringify(readIds));
                            }
                            setNotifications(prev => prev.map((notif, idx) =>
                              idx === i ? { ...notif, is_read: true } : notif
                            ));
                            if (n.link) router.push(n.link);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#78A24C]' : 'bg-transparent'}`}></div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-900 mb-1 group-hover:text-[#78A24C] transition-colors">{n.title}</p>
                              <p className="text-[12px] text-slate-500 leading-relaxed mb-1.5">{n.message}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-xs italic">No notifications yet.</p>
                      </div>
                    )}
                  </div>
                  <button
                    className="w-full py-3 text-[11px] font-bold text-slate-500 hover:text-[#78A24C] transition-colors border-t border-slate-50"
                    onClick={() => { setShowNotifications(false); router.push('/admin/notifications'); }}
                  >
                    View All Activity
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className={`${archivo.className} text-xs font-semibold rounded-xl bg-white shadow-sm h-10 px-4`}
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
          </div>
        </header>

        {/* Waiting List Banner */}
        {stats.waitingListCount > 0 && (
          <div className={`${archivo.className} w-full flex items-center gap-2.5 rounded-xl border border-[#f5df96] bg-[#FFFBEB] px-5 py-3 text-sm font-semibold text-[#92400E] shadow-sm animate-in fade-in duration-500 delay-100`}>
            <span className="h-2 w-2 rounded-full bg-[#F2C908] animate-pulse" />
            {stats.waitingListCount} student{stats.waitingListCount > 1 ? "s" : ""} on waiting list
          </div>
        )}

        {/* KPI Cards */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">

          {/* Financials */}
          <div className="space-y-2">
            <h3 className={`${archivo.className} text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B7280] ml-1`}>Financials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: fmt(stats.totalCollected), color: "#5591AB", desc: "All-time collected", icon: Wallet },
                { label: "Revenue (MTD)", value: fmt(stats.revenueThisMonth), color: "#78A24C", desc: "Current month", icon: BarChart3 },
                { label: "Unpaid Balance", value: fmt(stats.unpaidBalance), color: "#EB8A0B", desc: "Awaiting payment", icon: Clock3 },
                { label: "Overdue Balance", value: fmt(stats.overdueBalance), color: stats.overdueBalance > 0 ? "#DF3538" : "#78A24C", desc: stats.overdueBalance > 0 ? "Action required" : "All clear", icon: AlertTriangle },
              ].map((card, i) => (
                <Card key={i} className="shadow-sm border-none hover:shadow-md transition-all duration-300 ring-0 py-5 group cursor-default rounded-2xl" style={{ backgroundColor: card.color }}>
                  <CardContent className="p-0 px-5 flex flex-col gap-1 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className={`${archivo.className} text-[11px] font-bold uppercase tracking-wider text-white/90`}>{card.label}</span>
                      <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"><card.icon className="w-5 h-5 text-white" /></div>
                    </div>
                    <span className={`${archivoBlack.className} text-[38px] leading-tight text-white`}>{card.value}</span>
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
                { label: "Students Housed", value: stats.studentsHoused, color: "#EB8A0B", desc: "Currently active", icon: UserCheck },
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

        {/* Occupancy & Financials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">

          {/* Property Occupancy */}
          <Card className="lg:col-span-2 shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-5 rounded-2xl h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#44291B]" />
                <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Property Occupancy</h2>
              </div>
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

              <Select
                value={propFilter}
                onValueChange={(val: "all" | "available") => { setPropFilter(val); setPropPage(1); }}
              >
                <SelectTrigger className={`${archivo.className} flex items-center justify-between gap-2 text-sm pl-3 pr-2.5 rounded-xl border border-[#cfd6e4] bg-[#FDFFF4] w-full sm:w-[170px] h-10 text-[#44291B] placeholder:text-[#44291B]/40 focus:outline-none focus:ring-2 focus:ring-[#78A24C]/20 focus:border-[#78A24C] transition-all tracking-wide shadow-none hover:bg-[#FDFFF4]`}>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-[#44291B]/40 shrink-0" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#FDFFF4] border-[#cfd6e4] text-[#44291B]">
                  <SelectItem value="all" className="text-sm tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">All Properties</SelectItem>
                  <SelectItem value="available" className="text-sm  tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">Available Only</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Summary Donuts / Financial Summary */}
          <Card className="shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-6 overflow-hidden relative rounded-2xl h-full">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#44291B]" />
                <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Financial Summary</h2>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 justify-between">
              <div className="flex items-center justify-center gap-8 py-2">
                <DonutChart value={stats.occupancyRate} label="Occupancy" size={130} color="#F2C908" />
                <DonutChart value={stats.collectionRate} label="Collection" size={130} color="#78A24C" />
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-4 border-t border-[#cfd6e4]">
                <div className="rounded-xl border border-[#cfd6e4]/50 bg-white/60 p-4 text-center">
                  <p className={`${archivoBlack.className} text-[9px] uppercase text-[#44291B]/60 tracking-wide leading-tight`}>Total<br />Billed</p>
                  <p className={`${archivoBlack.className} text-2xl text-[#44291B] mt-1`}>{fmt(stats.totalBilled)}</p>
                </div>
                <div className="rounded-xl border border-[#78A24C]/20 bg-[#DFF2E8] p-4 text-center">
                  <p className={`${archivoBlack.className} text-[9px] uppercase text-[#78A24C] tracking-wide leading-tight`}>Total<br />Collected</p>
                  <p className={`${archivoBlack.className} text-2xl text-[#78A24C] mt-1`}>{fmt(stats.totalCollected)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#cfd6e4] bg-white/50 p-4 flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className={`${archivoBlack.className} text-xs uppercase tracking-wider text-[#44291B]/40`}>Collection gap</p>
                    <p className={`${archivoBlack.className} text-xl text-[#44291B] leading-tight`}>{fmt(collectionGap)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                      <p className={`${archivo.className} text-[10px] font-bold text-[#44291B]/40 uppercase`}>Paid inv.</p>
                      <p className={`${archivoBlack.className} text-sm text-[#44291B]`}>{pct(paidInvoiceRate)}</p>
                    </div>
                    <DonutChart value={paidInvoiceRate} label="Paid" size={84} color="#264384" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1">
                  {Object.entries(billingStatusCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([status, count]) => {
                      const pctVal = totalInInvoices > 0 ? (count / totalInInvoices) * 100 : 0;
                      const label = status.replace(/_/g, " ");

                      // Color Mapping based on brand palette
                      let colorClass = "bg-[#cfd6e4]/20 text-[#44291B] border-[#cfd6e4]/40";

                      if (status === "paid" || status === "paid_late") {
                        colorClass = status === "paid" ? "bg-[#DFF2E8] text-[#78A24C] border-[#b8e2cb]" : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5d0a1]";
                      } else if (status === "unpaid" || status === "overdue" || status === "voided") {
                        colorClass = "bg-red-50 text-[#DF3538] border-red-100";
                      }

                      return (
                        <div key={status} className={`rounded-xl border px-3 py-2.5 transition-all shadow-sm ${colorClass} flex flex-col justify-center`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest truncate opacity-70`}>{label}</span>
                            <span className={`${archivoBlack.className} text-sm shrink-0`}>{count}</span>
                          </div>
                          <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden mt-2">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctVal}%`, backgroundColor: "currentColor" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Applications & Students */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-500">

          {/* Recent Applications Table */}
          <Card className="lg:col-span-2 shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-4 rounded-2xl h-full lg:min-h-[26rem]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#44291B]" />
                <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Recent Applications</h2>
              </div>
              <Link
                href="/admin/applications"
                className="text-xs font-bold text-[#78A24C] hover:text-[#5C7E3A] hover:underline flex items-center gap-1 transition-all"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto flex-1 min-h-0 border border-[#cfd6e4]/50 rounded-xl">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-[#cfd6e4] bg-[#FDFFF4]">
                    <th className="py-3 px-4 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest w-[35%]">Applicant / Property</th>
                    <th className="py-3 px-4 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest w-[15%]">Type</th>
                    <th className="py-3 px-4 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest w-[20%]">Date</th>
                    <th className="py-3 px-4 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest w-[30%]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-[#44291B]/40 font-bold">No applications found.</td></tr>
                  ) : recentApplications.slice(0, 5).map(a => {
                    const u = unwrap(a.users);
                    const acc = unwrap(a.accommodation);
                    const isExpanded = expandedApplication === a.application_id;
                    return (
                      <tr key={a.application_id} className="hover:bg-[#F6F8D5] transition-colors border-b border-[#cfd6e4]/60 last:border-b-0 group">
                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-[#44291B] tracking-tight">{u?.first_name ?? "—"} {u?.last_name ?? ""}</p>
                          <p className="text-xs text-[#44291B]/60 font-medium mt-0.5">{acc?.name ?? "—"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-semibold text-[#44291B]/60 bg-[#44291B]/5 px-2 py-0.5 rounded-md inline-block capitalize tracking-tight">
                            {a.preferred_unit_type?.replace(/_/g, " ") ?? "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-[#44291B]/60">
                          {a.date_submitted ? new Date(a.date_submitted).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-4 px-4">
                          {(() => {
                            const st = statusBadgeDetails(a.application_status);
                            return (
                              <span className={`${archivoBlack.className} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${st.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Student Management */}
          <Card className="shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#44291B]" />
                <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Students</h2>
              </div>
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

              <Select
                value={studentTab}
                onValueChange={(val: "housed" | "waiting") => { setStudentTab(val); setStudentSearch(""); setStudentPage(1); }}
              >
                <SelectTrigger className={`${archivo.className} flex items-center justify-between gap-2 text-sm pl-3 pr-2.5 rounded-xl border border-[#cfd6e4] bg-[#FDFFF4] w-full sm:w-[170px] h-10 text-[#44291B] placeholder:text-[#44291B]/40 focus:outline-none focus:ring-2 focus:ring-[#78A24C]/20 focus:border-[#78A24C] transition-all tracking-wide shadow-none hover:bg-[#FDFFF4]`}>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-[#44291B]/40 shrink-0" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#FDFFF4] border-[#cfd6e4] text-[#44291B]">
                  <SelectItem value="housed" className="text-sm tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">Housed ({stats.studentsHoused})</SelectItem>
                  <SelectItem value="waiting" className="text-sm tracking-wide focus:bg-[#F6F8D5] focus:text-[#44291B]">Waiting ({stats.waitingListCount})</SelectItem>
                </SelectContent>
              </Select>
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
                <div className="flex flex-col">
                  <div className="space-y-1.5">
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
                            {(() => {
                              const st = statusBadgeDetails(a.application_status);
                              return (
                                <span className={`${archivoBlack.className} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${st.badge}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              );
                            })()}
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

        {/* Logs & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-500 delay-700">
          
          {/* Left Side: Activity Logs */}
          <Card className="lg:col-span-7 shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-5 rounded-2xl h-[490px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-[#44291B]" />
                <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Activity Logs</h2>
              </div>
              <Badge className="bg-[#E7FAD3] text-[#78A24C] border-none font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5">
                Real-time
              </Badge>
            </div>
            
            <div className="space-y-3 overflow-y-auto pr-1 h-[390px]">
              {!activityLogs || activityLogs.length === 0 ? (
                <div className="py-8 text-center text-[#44291B]/40 font-semibold italic text-sm">
                  No activity logs recorded yet.
                </div>
              ) : (
                activityLogs.map((log) => {
                  const actor = log.users ? (Array.isArray(log.users) ? log.users[0] : log.users) : null;
                  const actorName = actor ? `${actor.first_name} ${actor.last_name}` : "System";
                  const timeAgo = new Date(log.timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  
                  return (
                    <div key={log.log_id} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/50 border border-[#cfd6e4]/40 hover:bg-[#F6F8D5] transition-all group">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#264384] to-[#5591AB] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {actor ? initials(actor.first_name, actor.last_name) : "SYS"}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#44291B]">
                            {actorName}
                          </span>
                          <span className="text-[10px] text-[#44291B]/45 font-medium whitespace-nowrap">
                            {timeAgo}
                          </span>
                        </div>
                        <p className="text-xs text-[#44291B]/75 leading-relaxed font-medium">
                          {log.log_desc}
                        </p>
                        <div className="flex gap-2 items-center pt-0.5">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${getActionBadgeStyle(log.action_type)}`}>
                            {log.action_type ? log.action_type.replace(/_/g, " ") : ""}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${getEntityBadgeStyle(log.entity_type)}`}>
                            {log.entity_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Right Side: Quick Reports */}
          <Card className="lg:col-span-5 shadow-sm border border-[#cfd6e4] bg-[#FDFFF4] ring-0 p-5 flex flex-col gap-5 rounded-2xl h-[490px]">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-[#44291B]" />
              <h2 className={`${archivoBlack.className} text-xl text-[#44291B]`}>Quick Reports</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                {
                  label: "Dormitories with occupancy rates",
                  icon: House,
                  color: "#78A24C",
                  action: () => generatePDF(
                    "Dormitory Occupancy Report",
                    ["Dormitory", "Type", "Units", "Occupancy", "Rate"],
                    propertyOccupancy.map(p => [p.name, p.type, p.totalUnits, p.currentOccupancy, `${p.rate.toFixed(1)}%`]),
                    "Occupancy_Report",
                    [120, 162, 76]
                  )
                },
                {
                  label: "Available vs occupied units",
                  icon: BarChart3,
                  color: "#264384",
                  action: () => generatePDF(
                    "Units Distribution Report",
                    ["Property", "Total Units", "Occupied", "Available"],
                    propertyOccupancy.map(p => [p.name, p.totalUnits, p.currentOccupancy, p.availableSlots]),
                    "Units_Report",
                    [38, 67, 132]
                  )
                },
                {
                  label: "Students currently housed",
                  icon: UserCheck,
                  color: "#5591AB",
                  action: () => generatePDF(
                    "Current Residents List",
                    ["Name", "Property", "Unit", "Move-in Date"],
                    housedStudents.map(s => {
                      const u = unwrap(s.users);
                      const unit = s.unit;
                      const accName = unit ? (Array.isArray(unit.accommodation) ? unit.accommodation[0]?.name : unit.accommodation?.name) : "N/A";
                      return [`${u?.first_name} ${u?.last_name}`, accName, unit?.unit_number || "N/A", new Date(s.move_in_date).toLocaleDateString()];
                    }),
                    "Residents_List",
                    [85, 145, 171]
                  )
                },
                {
                  label: "Students on waiting list",
                  icon: Clock3,
                  color: "#F2C908",
                  action: () => generatePDF(
                    "Waiting List Report",
                    ["Applicant", "Unit Type", "Submitted On"],
                    pendingApplications.map(a => {
                      const u = unwrap(a.users);
                      return [`${u?.first_name} ${u?.last_name}`, a.preferred_unit_type || "N/A", new Date(a.date_submitted).toLocaleDateString()];
                    }),
                    "Waiting_List",
                    [242, 201, 8]
                  )
                },
                {
                  label: "Revenue summary per property",
                  icon: Wallet,
                  color: "#EB8A0B",
                  action: () => generatePDF(
                    "Financial Overview",
                    ["Metric", "Value"],
                    [
                      ["Total Revenue (MTD)", fmt(stats.revenueThisMonth)],
                      ["Total Collected", fmt(stats.totalCollected)],
                      ["Total Billed", fmt(stats.totalBilled)],
                      ["Collection Rate", `${stats.collectionRate.toFixed(1)}%`]
                    ],
                    "Financial_Summary",
                    [235, 138, 11]
                  )
                },
                {
                  label: "Overdue & unpaid fees",
                  icon: FileText,
                  color: "#DF3538",
                  action: () => generatePDF(
                    "Overdue Payments Report",
                    ["Status", "Count"],
                    Object.entries(billingStatusCounts).filter(([k]) => ["overdue", "unpaid"].includes(k)).map(([k, v]) => [k.replace(/_/g, " "), v]),
                    "Overdue_Report",
                    [223, 53, 56]
                  )
                },
              ].map((report, i) => (
                <div
                  key={i}
                  onClick={report.action}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl border border-[#cfd6e4]/50 bg-white/50 hover:bg-[#F6F8D5] hover:border-[#cfd6e4] transition-all group cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm" style={{ backgroundColor: `${report.color}15`, color: report.color }}>
                    <report.icon className="w-4 h-4" />
                  </div>
                  <span className={`${archivo.className} text-xs text-[#44291B] font-bold leading-snug`}>{report.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
