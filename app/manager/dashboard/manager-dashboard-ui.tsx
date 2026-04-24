// app/manager/dashboard/manager-dashboard-ui.tsx

import React, { useEffect, useState } from "react";
import {
    Search, Bell, Building2, Users, FileText,
    Banknote, LogOut, UserPlus, ArrowLeftRight, AlertTriangle, BarChart2, CheckCircle2, ChevronRight,
    Filter, User, Plus, RotateCcw, Clock, Send
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });

interface ManagerDashboardUIProps {
    onLogout?: () => void;
    isLoggingOut?: boolean;
}

function formatPHP(amount: number) {
    return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ManagerDashboardUI({ onLogout, isLoggingOut }: ManagerDashboardUIProps) {
    const [dashboardView, setDashboardView] = useState<'operations' | 'financials'>('operations');
    const [showLogout, setShowLogout] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => { setHasMounted(true); }, []);

    const [roomView, setRoomView] = useState<'grid' | 'list'>('grid');

    // --- Manager / Dorm Info ---
    const [managerName, setManagerName] = useState("Manager");
    const [managerInitials, setManagerInitials] = useState("M");
    const [dormName, setDormName] = useState("Loading...");
    const [dormLocation, setDormLocation] = useState("");

    // --- Operations Metrics ---
    const [totalRooms, setTotalRooms] = useState(0);
    const [occupiedRate, setOccupiedRate] = useState("0.0");
    const [occupiedCount, setOccupiedCount] = useState(0);
    const [availableCount, setAvailableCount] = useState(0);
    const [waitlistCount, setWaitlistCount] = useState(0);

    // --- Room Grid ---
    const [dbRooms, setDbRooms] = useState<{
        id: string;
        unit_id: string;
        status: string;
        current: number;
        max: number;
        occupants: any[];
    }[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // --- Residents / Waitlist Table ---
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [waitlistStudents, setWaitlistStudents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'residents' | 'waitlist'>('residents');
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [tableSearch, setTableSearch] = useState("");
    const [tablePage, setTablePage] = useState(1);
    const [tableFilters, setTableFilters] = useState({
        yearLevel: "all",
        roomStatus: "all",
        gender: "all",
        paymentStatus: "all",
        course: "all",
        college: "all"
    });
    const studentsPerPage = 5;

    // --- Financials ---
    const [financialsLoading, setFinancialsLoading] = useState(false);
    const [expectedRevenue, setExpectedRevenue] = useState(0);
    const [actualCollected, setActualCollected] = useState(0);
    const [outstandingBalance, setOutstandingBalance] = useState(0);
    const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState(0);
    const [collectionRate, setCollectionRate] = useState(0);
    const [delinquencyList, setDelinquencyList] = useState<any[]>([]);
    const [delinquencyFilter, setDelinquencyFilter] = useState("all");
    const [delinquencySortDays, setDelinquencySortDays] = useState(true);

    // --- Activity Log ---
    const [activityLog, setActivityLog] = useState<any[]>([]);

    const handleResetFilters = () => {
        setTableSearch("");
        setTableFilters({ yearLevel: "all", college: "all", roomStatus: "all", paymentStatus: "all", gender: "all", course: "all" });
        setTablePage(1);
    };

    // ─── Fetch operations data ───────────────────────────────────────────────
    useEffect(() => {
        async function fetchOperationsData() {
            try {
                const supabase = getSupabaseBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('first_name, last_name')
                    .eq('user_id', user.id)
                    .single() as any;

                if (profile) {
                    const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();
                    setManagerInitials(initials || "M");
                    setManagerName(`${profile.first_name} ${profile.last_name}`);
                }

                // Accommodation
                const { data: accom } = await supabase
                    .from('accommodation')
                    .select('*')
                    .eq('manager_id', user.id)
                    .single() as any;

                if (!accom) return;
                setDormName(accom.name);
                setDormLocation(accom.location);

                // Units
                const { data: units } = await supabase
                    .from('unit')
                    .select('*')
                    .eq('accommodation_id', accom.accommodation_id) as any;

                if (!units || units.length === 0) { setTotalRooms(0); return; }
                setTotalRooms(units.length);

                // Active Assignments with occupant info
                const { data: assignments } = await supabase
                    .from('accommodation_assignment')
                    .select(`
                        assignment_id,
                        unit_id,
                        user_id,
                        move_in_date,
                        users:user_id (
                            first_name,
                            last_name,
                            profile_picture_url
                        )
                    `)
                    .eq('assignment_status', 'active')
                    .in('unit_id', units.map((u: any) => u.unit_id)) as any;

                // Student numbers
                const assignedUserIds = [...new Set((assignments ?? []).map((a: any) => a.user_id))] as string[];
                const { data: studentRows } = await supabase
                    .from('student')
                    .select('user_id, student_num, college, degree_program')
                    .in('user_id', assignedUserIds.length > 0 ? assignedUserIds : ['00000000-0000-0000-0000-000000000000']) as any;
                const studentMap = new Map((studentRows ?? []).map((s: any) => [s.user_id, s]));

                // Billing statuses
                const assignmentIds = (assignments ?? []).map((a: any) => a.assignment_id);
                const { data: billings } = await supabase
                    .from('billing')
                    .select('assignment_id, status, due_date')
                    .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['00000000-0000-0000-0000-000000000000'])
                    .order('due_date', { ascending: false }) as any;

                const latestBillingMap = new Map<string, string>();
                (billings ?? []).forEach((b: any) => {
                    if (!latestBillingMap.has(b.assignment_id)) {
                        latestBillingMap.set(b.assignment_id, b.status);
                    }
                });

                // Build occupant map
                const occupantsMap = new Map<string, any[]>();
                (assignments ?? []).forEach((asg: any) => {
                    if (!occupantsMap.has(asg.unit_id)) occupantsMap.set(asg.unit_id, []);
                    const u = asg.users ?? {};
                    const s = studentMap.get(asg.user_id) as any;
                    const billingStatus = latestBillingMap.get(asg.assignment_id) ?? 'unknown';
                    const paymentStatus = billingStatus === 'paid' ? 'Cleared' : billingStatus === 'overdue' ? 'Overdue' : billingStatus === 'unpaid' ? 'Pending' : 'Unknown';
                    occupantsMap.get(asg.unit_id)!.push({
                        id: asg.user_id,
                        assignment_id: asg.assignment_id,
                        name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Unknown',
                        student_number: s?.student_num ?? 'N/A',
                        college: s?.college ?? 'N/A',
                        move_in_date: asg.move_in_date,
                        payment_status: paymentStatus,
                        avatar: u.profile_picture_url ?? null,
                    });
                });

                let occ = 0; let vac = 0;
                const parsedRooms = units.map((u: any) => {
                    const occupants = occupantsMap.get(u.unit_id) ?? [];
                    const count = occupants.length;
                    let st = 'vacant';
                    if (u.unit_status === 'inactive' || u.unit_status === 'maintenance') st = 'maintenance';
                    else if (count >= u.max_occupancy) st = 'full';
                    else if (count > 0) st = 'partial';
                    occ += count;
                    vac += Math.max(0, u.max_occupancy - count);
                    return { id: u.unit_number, unit_id: u.unit_id, status: st, current: count, max: u.max_occupancy, occupants };
                });

                setDbRooms(parsedRooms);
                setOccupiedCount(occ);
                setAvailableCount(vac);
                setOccupiedRate(occ + vac > 0 ? ((occ / (occ + vac)) * 100).toFixed(1) : '0.0');

                // Residents table list (flat from assignments)
                const residentRows = (assignments ?? []).map((asg: any) => {
                    const u = asg.users ?? {};
                    const s = studentMap.get(asg.user_id) as any;
                    const room = parsedRooms.find((r: any) => r.unit_id === asg.unit_id);
                    const billingStatus = latestBillingMap.get(asg.assignment_id) ?? 'unknown';
                    const paymentStatus = billingStatus === 'paid' ? 'Cleared' : billingStatus === 'overdue' ? 'Overdue' : billingStatus === 'unpaid' ? 'Pending' : 'Unknown';
                    return {
                        id: asg.user_id,
                        assignment_id: asg.assignment_id,
                        name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Unknown',
                        student_number: s?.student_num ?? 'N/A',
                        college: s?.college ?? 'N/A',
                        degree_program: s?.degree_program ?? '',
                        room_number: room?.id ?? 'N/A',
                        move_in_date: asg.move_in_date,
                        payment_status: paymentStatus,
                        gender: 'N/A',
                        year_level: 'N/A',
                    };
                });
                setAllStudents(residentRows);
                
                // Recent Applications
                const { data: rapps } = await supabase
                    .from('accommodation_application')
                    .select(`
                        application_id, user_id, date_submitted, preferred_unit_type, application_status,
                        users:user_id ( first_name, last_name, profile_picture_url ),
                        student:user_id ( student_num ),
                        accommodation:preferred_accommodation_id ( name )
                    `)
                    .eq('preferred_accommodation_id', accom.accommodation_id)
                    .order('date_submitted', { ascending: false })
                    .limit(5) as any;
                
                setRecentApps(rapps?.map((a: any) => ({
                    id: a.application_id,
                    name: `${a.users?.first_name ?? ''} ${a.users?.last_name ?? ''}`.trim() || 'Unknown',
                    student_number: a.student?.student_num ?? 'N/A',
                    dormitory: a.accommodation?.name ?? 'N/A',
                    roomType: a.preferred_unit_type ?? 'N/A',
                    status: a.application_status ?? 'Pending',
                    date: a.date_submitted,
                    avatar: a.users?.profile_picture_url
                })) ?? []);

                // Waitlist
                const { data: waitlistApps } = await supabase
                    .from('accommodation_application')
                    .select(`
                        application_id, user_id, date_submitted, preferred_unit_type,
                        users:user_id ( first_name, last_name, profile_picture_url )
                    `)
                    .eq('preferred_accommodation_id', accom.accommodation_id)
                    .eq('application_status', 'approved')
                    .order('date_submitted', { ascending: true }) as any;

                const waitlistUserIds = (waitlistApps ?? []).map((a: any) => a.user_id);
                const { data: wlStudentRows } = await supabase
                    .from('student')
                    .select('user_id, student_num, college, degree_program')
                    .in('user_id', waitlistUserIds.length > 0 ? waitlistUserIds : ['00000000-0000-0000-0000-000000000000']) as any;
                const wlStudentMap = new Map((wlStudentRows ?? []).map((s: any) => [s.user_id, s]));

                const waitlist = (waitlistApps ?? []).map((app: any) => {
                    const u = app.users ?? {};
                    const s = wlStudentMap.get(app.user_id) as any;
                    return {
                        id: app.user_id,
                        application_id: app.application_id,
                        name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Unknown',
                        student_number: s?.student_num ?? 'N/A',
                        college: s?.college ?? 'N/A',
                        date_submitted: app.date_submitted,
                        preferred_unit_type: app.preferred_unit_type,
                        year_level: 'N/A',
                        gender: 'N/A',
                        payment_status: 'N/A',
                        room_number: 'N/A',
                    };
                });
                setWaitlistStudents(waitlist);
                setWaitlistCount(waitlist.length);

                // Activity log
                const { data: logs } = await supabase
                    .from('activity_log')
                    .select('log_id, action_type, log_desc, timestamp, entity_type, user_role')
                    .order('timestamp', { ascending: false })
                    .limit(10) as any;
                setActivityLog(logs ?? []);

            } catch (err) {
                console.error("Failed to load dashboard operations data:", err);
            }
        }
        fetchOperationsData();
    }, []);

    // ─── Fetch financials when tab is active ─────────────────────────────────
    useEffect(() => {
        if (dashboardView !== 'financials') return;
        async function fetchFinancials() {
            setFinancialsLoading(true);
            try {
                const res = await fetch('/api/manager/dashboard/financials');
                if (!res.ok) throw new Error('Failed to fetch financials');
                const data = await res.json();
                setExpectedRevenue(data.expectedRevenue ?? 0);
                setActualCollected(data.actualCollected ?? 0);
                setOutstandingBalance(data.outstandingBalance ?? 0);
                setUnpaidInvoiceCount(data.unpaidInvoiceCount ?? 0);
                setCollectionRate(data.collectionRate ?? 0);
                setDelinquencyList(data.delinquencyList ?? []);
            } catch (err) {
                console.error("Failed to load financial data:", err);
            } finally {
                setFinancialsLoading(false);
            }
        }
        fetchFinancials();
    }, [dashboardView]);

    // ─── Derived ---
    const rooms = dbRooms.length > 0 ? dbRooms : [];

    const currentData = activeTab === 'residents' ? allStudents : waitlistStudents;
    const filteredStudents = currentData.filter(student => {
        const matchesSearch = (student.name || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
            (student.student_number || "").toLowerCase().includes(tableSearch.toLowerCase());
        const matchesCollege = tableFilters.college === "all" || student.college === tableFilters.college;
        const matchesPayment = activeTab === 'waitlist' ? true : (tableFilters.paymentStatus === "all" || student.payment_status === tableFilters.paymentStatus);
        return matchesSearch && matchesCollege && matchesPayment;
    });

    const paginatedStudents = filteredStudents.slice((tablePage - 1) * studentsPerPage, tablePage * studentsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    // Delinquency filter + sort
    const filteredDelinquency = delinquencyList
        .filter(d => {
            if (delinquencyFilter === 'all') return true;
            if (delinquencyFilter === 'Pending') return d.status === 'Unpaid';
            if (delinquencyFilter === 'Overdue') return d.status === 'Overdue';
            return true;
        })
        .sort((a, b) => delinquencySortDays ? b.days_overdue - a.days_overdue : a.name.localeCompare(b.name));

    // Activity log color + label
    const activityColor = (type: string) => {
        if (type?.includes('check_in') || type?.includes('approved')) return '#7A9D54';
        if (type?.includes('maintenance') || type?.includes('complaint')) return '#0B3A64';
        if (type?.includes('billing') || type?.includes('payment')) return '#3668C1';
        if (type?.includes('alert') || type?.includes('reject')) return '#C55745';
        return '#5591AB';
    };

    if (!hasMounted) return <div className={`flex h-screen bg-[#F6F5ED] overflow-hidden ${archivo.className}`} />;

    return (
        <div className={`flex h-screen bg-[#F6F5ED] overflow-hidden ${archivo.className}`}>
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-auto pb-10" suppressHydrationWarning>
                    {/* TOP HEADER */}
                    <header className="flex justify-between items-center px-8 lg:px-16 xl:px-24 mt-6 mb-4">
                    <div className="relative w-full max-w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search data, students, or rooms..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-200/50 rounded-full text-sm border-none focus:ring-2 focus:ring-slate-300 outline-none font-medium placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative text-slate-600 hover:text-slate-900 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#A05C5C] rounded-full ring-2 ring-[#F6F5ED]"></span>
                        </button>
                        <div className="relative">
                            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowLogout(!showLogout)}>
                                <div className="flex flex-col items-end">
                                    <span className="text-[13px] font-bold text-slate-900 leading-tight">{managerName}</span>
                                    <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">MANAGER</span>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                    {managerInitials}
                                </div>
                            </div>
                            {showLogout && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-2 z-50">
                                    <button
                                        onClick={onLogout}
                                        disabled={isLoggingOut}
                                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {isLoggingOut ? "Exiting..." : "Log out"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="px-8 lg:px-16 xl:px-24">
                    {/* TITLE */}
                    <div className="mb-6">
                        <h1 className="text-[32px] md:text-[38px] font-black text-[#0B3A64] tracking-tight leading-none mb-1">Manager Dashboard</h1>
                        <p className="text-[13px] text-slate-500 font-medium">
                            {dashboardView === 'operations' ? `Real-time oversight of ${dormName}.` : 'Financial health and collection management.'}
                        </p>
                    </div>

                    {/* VIEW TOGGLE */}
                    <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit mb-8 border border-slate-200">
                        <button onClick={() => setDashboardView('operations')} className={`px-6 py-2 text-[12px] font-black uppercase tracking-widest rounded-lg transition-all ${dashboardView === 'operations' ? 'bg-[#0B3A64] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`} suppressHydrationWarning>Operations</button>
                        <button onClick={() => setDashboardView('financials')} className={`px-6 py-2 text-[12px] font-black uppercase tracking-widest rounded-lg transition-all ${dashboardView === 'financials' ? 'bg-[#5591AB] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`} suppressHydrationWarning>Financials</button>
                    </div>

                    {/* ═══ OPERATIONS VIEW ════════════════════════════════════════════════ */}
                    {dashboardView === 'operations' ? (
                        <>
                            {/* DORM CARD */}
                            <div className="bg-white rounded-xl p-4 md:p-5 flex justify-between items-center shadow-sm border border-slate-100/50 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#E9F0FD] text-[#3668C1] rounded-lg flex items-center justify-center">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-[16px] font-bold text-[#0B3A64]">{dormName}</h2>
                                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                            <span className="text-slate-400">📍</span> {dormLocation}
                                        </p>
                                    </div>
                                </div>
                                <button className="px-5 py-2 border border-slate-200 text-[#0B3A64] text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-wider">Manage Dorm</button>
                            </div>

                            {/* METRICS GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                {/* Total Rooms */}
                                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between h-[180px]">
                                    <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Total Rooms</h3>
                                    <div>
                                        <p className="text-[38px] font-black text-[#0B3A64] leading-none mb-1">{totalRooms}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">Certified Living Units</p>
                                    </div>
                                </div>

                                {/* Occupancy */}
                                <div className="bg-[#5D84A6] rounded-[20px] p-5 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden text-white">
                                    <div className="absolute -right-4 -bottom-4 opacity-10"><BarChart2 className="w-32 h-32" /></div>
                                    <h3 className="text-[10px] font-bold text-white/70 tracking-[0.1em] uppercase relative z-10">Occupancy</h3>
                                    <div className="relative z-10">
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <p className="text-[42px] font-black leading-none tracking-tight">{occupiedRate}</p>
                                            <p className="text-[18px] font-bold">%</p>
                                        </div>
                                        <div className="flex flex-col gap-1 text-[10px] font-medium">
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#A8CA77]"></div><span>{occupiedCount} Occupied</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#8EB2CE]"></div><span>{availableCount} Vacant</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pending Assignment */}
                                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between h-[180px]">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Pending Assignment</h3>
                                        <span className="bg-[#5591AB]/10 text-[#5591AB] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Waitlist</span>
                                    </div>
                                    <div>
                                        <p className="text-[38px] font-black text-[#5591AB] leading-none mb-1">{waitlistCount}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">Approved Students Waiting</p>
                                    </div>
                                </div>

                                {/* Pending Approvals - applications pending manager review */}
                                <PendingApprovalsCard />
                            </div>

                            {/* ROOM INVENTORY + MAINTENANCE */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                {/* Room Inventory */}
                                <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-[14px] font-extrabold text-[#0B3A64] uppercase tracking-wide mb-1">Room Inventory Status</h3>
                                            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Live view of facility distribution</p>
                                        </div>
                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            <button onClick={() => setRoomView('grid')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wide shadow-sm transition-colors ${roomView === 'grid' ? 'bg-[#0B3A64] text-white' : 'text-slate-500 hover:text-slate-700'}`}>Grid</button>
                                            <button onClick={() => setRoomView('list')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wide shadow-sm transition-colors ${roomView === 'list' ? 'bg-[#0B3A64] text-white' : 'text-slate-500 hover:text-slate-700'}`}>List</button>
                                        </div>
                                    </div>

                                    {rooms.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-slate-300 text-sm font-bold uppercase tracking-widest">No rooms found</div>
                                    ) : roomView === 'grid' ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                                            {rooms.map(room => (
                                                <div key={room.id}
                                                    onClick={() => { setSelectedRoom(room); setIsRoomModalOpen(true); }}
                                                    className={`relative flex flex-col items-center justify-center rounded-2xl p-3 cursor-pointer border-2 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] ${room.status === 'full' ? 'bg-[#EEF4E7] border-[#C3D9A8]' : room.status === 'partial' ? 'bg-[#FEFBE7] border-[#E8DC9A]' : room.status === 'maintenance' ? 'bg-[#FEF2F1] border-[#EBCAC7]' : 'bg-slate-50 border-slate-100'}`}
                                                >
                                                    <p className={`text-[13px] font-black mb-1.5 ${room.status === 'full' ? 'text-[#4A7A2A]' : room.status === 'partial' ? 'text-[#9A7A10]' : room.status === 'maintenance' ? 'text-[#C55745]' : 'text-slate-400'}`}>{room.id}</p>
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <Users className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold">{room.current}/{room.max}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                            {rooms.map(room => (
                                                <div key={room.id}
                                                    onClick={() => { setSelectedRoom(room); setIsRoomModalOpen(true); }}
                                                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                                >
                                                    <span className="text-[14px] font-black text-[#0B3A64]">{room.id}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] font-bold text-slate-500">{room.current}/{room.max} occupied</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${room.status === 'full' ? 'bg-[#EEF4E7] text-[#4A7A2A]' : room.status === 'partial' ? 'bg-[#FEFBE7] text-[#9A7A10]' : room.status === 'maintenance' ? 'bg-[#FEF2F1] text-[#C55745]' : 'bg-slate-50 text-slate-400'}`}>{room.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-50">
                                        {[{ label: 'Full Capacity', color: 'bg-[#7A9D54]' }, { label: 'Partially Occupied', color: 'bg-[#E8DC9A]' }, { label: 'Unoccupied', color: 'bg-slate-200' }].map(leg => (
                                            <div key={leg.label} className="flex items-center gap-1.5">
                                                <div className={`w-2.5 h-2.5 rounded-full ${leg.color}`}></div>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{leg.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Activity - Relocated from bottom */}
                                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-[14px] font-extrabold text-[#0B3A64] uppercase tracking-wide">Recent Activity</h3>
                                        <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1 transition-colors">Archive <ChevronRight className="w-3.5 h-3.5" /></button>
                                    </div>
                                    {activityLog.length > 0 ? (
                                        <div className="space-y-4 flex-1">
                                            {activityLog.slice(0, 6).map((log: any) => (
                                                <div key={log.log_id} className="flex items-center justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: activityColor(log.action_type) }}></div>
                                                        <div>
                                                            <p className="text-[13px] text-slate-800 font-medium leading-tight">
                                                                <span className="font-bold text-[#0B3A64]">{log.action_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                                                            </p>
                                                            {log.log_desc && <p className="text-[9px] text-slate-400 font-medium mt-0.5 line-clamp-1">{log.log_desc}</p>}
                                                        </div>
                                                    </div>
                                                    <span className="text-[8px] text-slate-300 font-bold flex-shrink-0 ml-4">
                                                        {new Date(log.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-300 text-[11px] font-bold uppercase tracking-widest py-8">No recent activity</p>
                                    )}
                                </div>
                            </div>

                            {/* RESIDENTS / WAITLIST TABLE */}
                            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100/50 mb-8 overflow-hidden">
                                <div className="px-8 pt-8 pb-6 border-b border-slate-50">
                                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                                        <div className="flex items-center gap-8">
                                            <button onClick={() => { setActiveTab('residents'); setTablePage(1); }} className={`relative pb-4 text-[14px] font-black uppercase tracking-widest transition-colors ${activeTab === 'residents' ? 'text-[#0B3A64]' : 'text-slate-400 hover:text-slate-600'}`}>
                                                Residents {activeTab === 'residents' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#5591AB] rounded-full"></div>}
                                            </button>
                                            <button onClick={() => { setActiveTab('waitlist'); setTablePage(1); }} className={`relative pb-4 text-[14px] font-black uppercase tracking-widest transition-colors ${activeTab === 'waitlist' ? 'text-[#0B3A64]' : 'text-slate-400 hover:text-slate-600'}`}>
                                                Waitlist {activeTab === 'waitlist' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#5591AB] rounded-full"></div>}
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                            <div className="relative flex-1 xl:flex-none xl:w-[240px]">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input type="text" placeholder="Search Name/ID..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FD] border border-slate-100 rounded-full text-[12px] outline-none focus:ring-2 focus:ring-[#5591AB]/10 font-medium placeholder:text-slate-400" />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                                    <Select value={tableFilters.college} onValueChange={(v) => setTableFilters(prev => ({ ...prev, college: v }))}>
                                                        <SelectTrigger className="h-7 border-none bg-transparent text-[11px] font-bold text-[#0B3A64] focus:ring-0 w-[90px] p-0 px-2"><SelectValue placeholder="College" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Colleges</SelectItem>
                                                            <SelectItem value="CAS">CAS</SelectItem>
                                                            <SelectItem value="CEAT">CEAT</SelectItem>
                                                            <SelectItem value="CEM">CEM</SelectItem>
                                                            <SelectItem value="CFNR">CFNR</SelectItem>
                                                            <SelectItem value="CHE">CHE</SelectItem>
                                                            <SelectItem value="CVM">CVM</SelectItem>
                                                            <SelectItem value="CAFS">CAFS</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {activeTab === 'residents' && (
                                                    <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                                        <Select value={tableFilters.paymentStatus} onValueChange={(v) => setTableFilters(prev => ({ ...prev, paymentStatus: v }))}>
                                                            <SelectTrigger className="h-7 border-none bg-transparent text-[11px] font-bold text-[#0B3A64] focus:ring-0 w-[90px] p-0 px-2"><SelectValue placeholder="Pay" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">Payments</SelectItem>
                                                                <SelectItem value="Cleared">Cleared</SelectItem>
                                                                <SelectItem value="Pending">Pending</SelectItem>
                                                                <SelectItem value="Overdue">Overdue</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                <button onClick={handleResetFilters} className="p-2 text-slate-400 hover:text-[#DE7A6A] transition-colors" title="Reset Filters"><RotateCcw className="w-4 h-4" /></button>
                                                <button className="flex items-center gap-2 px-5 py-2 bg-[#5591AB] text-white rounded-full text-[12px] font-bold hover:bg-[#467A91] transition-all shadow-sm"><Search className="w-3.5 h-3.5" />Search</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#F9F7EF] border-b border-slate-100">
                                                <th className="py-4 px-8 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Student / Property</th>
                                                <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Student Number</th>
                                                {activeTab === 'residents' ? (
                                                    <>
                                                        <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Room / College</th>
                                                        <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Payment</th>
                                                    </>
                                                ) : (
                                                    <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Date Applied</th>
                                                )}
                                                <th className="py-4 px-8 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedStudents.length > 0 ? paginatedStudents.map((student, idx) => (
                                                <tr key={student.id ?? idx} className="border-b border-slate-50 last:border-0 group hover:bg-[#F9FBFD] transition-colors">
                                                    <td className="py-5 px-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-[14px] font-black text-[#0B3A64] leading-none mb-1">{student.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{student.college !== 'N/A' ? student.college : dormName}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-2"><span className="text-[13px] font-bold text-slate-600">{student.student_number}</span></td>
                                                    {activeTab === 'residents' ? (
                                                        <>
                                                            <td className="py-5 px-2">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[14px] font-black text-[#0B3A64]">Room {student.room_number}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{student.college}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-2 text-right">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${student.payment_status === 'Cleared' ? 'bg-[#EEF4E7] text-[#4A7A2A]' : student.payment_status === 'Overdue' ? 'bg-[#FDECEB] text-[#DE7A6A]' : 'bg-[#FFF9E6] text-[#B08E2E]'}`}>
                                                                    {student.payment_status}
                                                                </span>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <td className="py-5 px-2 text-right">
                                                            <span className="text-[13px] font-bold text-slate-600">
                                                                {student.date_submitted ? new Date(student.date_submitted).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="py-5 px-8">
                                                        <div className="flex justify-end">
                                                            <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-[#0B3A64] hover:bg-slate-100 transition-all"><User className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="py-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No records found matching your selection.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-8 py-5 border-t border-slate-50 flex justify-between items-center">
                                    <p className="text-[12px] font-bold text-slate-400">Page <span className="text-[#5591AB]">{tablePage}</span> of {totalPages || 1}</p>
                                    <div className="flex gap-3">
                                        <button disabled={tablePage === 1} onClick={() => setTablePage(p => Math.max(1, p - 1))} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm">Previous</button>
                                        <button disabled={tablePage === totalPages || totalPages === 0} onClick={() => setTablePage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm">Next</button>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM GRID: APPLICATIONS + ALERTS */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Recent Applications */}
                                <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col overflow-hidden">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-[14px] font-extrabold text-[#0B3A64] uppercase tracking-wide mb-1">Recent Applications</h3>
                                            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Latest residency requests</p>
                                        </div>
                                        <button className="text-[10px] font-black bg-[#5591AB] text-white px-5 py-2 rounded-full uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md hover:bg-[#467A91] active:scale-95 shadow-[#5591AB]/20">
                                            View All <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto -mx-6 flex-1">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#F9F7EF] border-b border-slate-100">
                                                    <th className="py-5 px-6 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em]">Student / Property</th>
                                                    <th className="py-5 px-4 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em]">Student Number</th>
                                                    <th className="py-5 px-4 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em]">Date Applied</th>
                                                    <th className="py-5 px-6 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em] text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 bg-[#FDFCF6]/50">
                                                {recentApps.length > 0 ? recentApps.map((app) => (
                                                    <tr key={app.id} className="group hover:bg-[#F9FBFD] transition-colors border-b border-slate-50 last:border-0">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm flex-shrink-0">
                                                                    <AvatarImage src={app.avatar} />
                                                                    <AvatarFallback className="bg-[#5D6BDE] text-white text-[10px] font-black">{app.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-bold text-[#0B3A64] leading-none mb-1 truncate">{app.name}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight truncate">{app.dormitory}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="text-[12px] font-bold text-slate-600">{app.student_number}</span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="text-[11px] text-slate-400 font-bold">
                                                                {new Date(app.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                                                app.status?.toLowerCase() === 'approved' ? 'bg-[#EEF4E7] text-[#4A7A2A]' : 
                                                                app.status?.toLowerCase() === 'rejected' ? 'bg-[#FDECEB] text-[#DE7A6A]' : 
                                                                'bg-[#FFF9E6] text-[#B08E2E]'
                                                            }`}>
                                                                {app.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-16 text-center text-slate-300 text-[11px] font-bold uppercase tracking-widest">No recent applications</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* MOVE-OUT ALERTS */}
                                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-[14px] font-extrabold text-[#0B3A64] uppercase tracking-wide mb-1">Move-Out Alerts</h3>
                                            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Upcoming Departures</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-[#FDECEB] flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4 text-[#DE7A6A]" />
                                        </div>
                                    </div>
                                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-1">
                                        {[
                                            { id: 1, name: "Juana Dela Cruz", room: "101", status: "Upcoming", days: "2 Days" },
                                            { id: 2, name: "Jose Rizal", room: "205", status: "Upcoming", days: "4 Days" },
                                            { id: 3, name: "Maria Clara", room: "302", status: "Upcoming", days: "7 Days" },
                                        ].map((alert) => (
                                            <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#DE7A6A] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                                                        {alert.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-bold text-[#0B3A64] leading-tight">{alert.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Room {alert.room} · {alert.days}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[#FFF9E6] text-[#B08E2E]">
                                                    {alert.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-4 w-full py-2.5 bg-[#FDFCF6] border border-[#E8DC9A] text-[#9A7A10] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#FEFBE7] transition-all flex items-center justify-center gap-2">
                                        Manage Turnover <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ═══ FINANCIALS VIEW ═══════════════════════════════════════════════ */
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {financialsLoading ? (
                                <div className="py-20 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">Loading financials...</div>
                            ) : (
                                <>
                                    {/* KPI CARDS */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100/50 flex flex-col justify-between h-[160px]">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Expected Revenue</h3>
                                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Banknote className="w-5 h-5" /></div>
                                            </div>
                                            <div>
                                                <p className="text-[32px] font-black text-[#0B3A64] leading-none mb-1">{formatPHP(expectedRevenue)}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">Full Capacity Potential</p>
                                            </div>
                                        </div>

                                        <div className="bg-[#EBF2E1] rounded-[24px] p-6 shadow-sm flex flex-col justify-between h-[160px] relative overflow-hidden">
                                            <div className="absolute -right-4 -bottom-4 opacity-10 text-[#7A9D54]"><CheckCircle2 className="w-24 h-24" /></div>
                                            <div className="flex justify-between items-start relative z-10">
                                                <h3 className="text-[10px] font-bold text-[#7A9D54] tracking-[0.1em] uppercase">Actual Collected</h3>
                                                <span className="bg-[#7A9D54] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{collectionRate}% Paid</span>
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-[32px] font-black text-[#443322] leading-none mb-1">{formatPHP(actualCollected)}</p>
                                                <div className="w-full h-1.5 bg-[#D5E1CD] rounded-full mt-3 overflow-hidden">
                                                    <div className="h-full bg-[#7A9D54] rounded-full transition-all duration-700" style={{ width: `${Math.min(collectionRate, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#FDECEB] rounded-[24px] p-6 shadow-sm flex flex-col justify-between h-[160px] relative overflow-hidden">
                                            <div className="absolute -right-4 -bottom-4 opacity-10 text-[#DE7A6A]"><AlertTriangle className="w-24 h-24" /></div>
                                            <div className="flex justify-between items-start relative z-10">
                                                <h3 className="text-[10px] font-bold text-[#DE7A6A] tracking-[0.1em] uppercase">Outstanding Balance</h3>
                                                {outstandingBalance > 0 && <span className="bg-[#DE7A6A] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Urgent</span>}
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-[32px] font-black text-[#443322] leading-none mb-1">{formatPHP(outstandingBalance)}</p>
                                                <p className="text-[11px] text-[#DE7A6A] font-bold uppercase tracking-wider mt-2">{unpaidInvoiceCount} Unpaid Invoice{unpaidInvoiceCount !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DELINQUENCY TABLE */}
                                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100/50 overflow-hidden">
                                        <div className="px-10 py-8 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                                            <div>
                                                <h2 className="text-[18px] font-black text-[#0B3A64] tracking-tight mb-1">Delinquency List</h2>
                                                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.1em]">At-Risk Accounts & Overdue Payments</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                                <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                                    <Select value={delinquencyFilter} onValueChange={setDelinquencyFilter}>
                                                        <SelectTrigger className="h-8 border-none bg-transparent text-[11px] font-bold text-[#0B3A64] focus:ring-0 w-[120px] p-0 px-2"><SelectValue placeholder="All Status" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Pending</SelectItem>
                                                            <SelectItem value="Pending">Unpaid Only</SelectItem>
                                                            <SelectItem value="Overdue">Overdue Only</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <button
                                                    onClick={() => setDelinquencySortDays(s => !s)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-[12px] font-bold hover:bg-slate-50 transition-all shadow-sm"
                                                >
                                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                                    {delinquencySortDays ? 'Sort by Name' : 'Sort by Days'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-[#F9F7EF] border-b border-slate-100">
                                                        <th className="py-5 px-10 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Student / Property</th>
                                                        <th className="py-5 px-4 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Room</th>
                                                        <th className="py-5 px-4 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Amount Due</th>
                                                        <th className="py-5 px-4 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Days Overdue</th>
                                                        <th className="py-5 px-4 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Status</th>
                                                        <th className="py-5 px-10 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredDelinquency.length > 0 ? filteredDelinquency.map((item: any) => (
                                                        <tr key={item.billing_id} className="border-b border-slate-50 last:border-0 group hover:bg-[#F9FBFD] transition-colors">
                                                            <td className="py-5 px-10">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                                                                        {item.initials}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[14px] font-black text-[#0B3A64] leading-none mb-1.5">{item.name}</p>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                            Resident since {item.move_in_date ? new Date(item.move_in_date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-4"><span className="text-[13px] font-black text-[#0B3A64]">Unit {item.unit_number}</span></td>
                                                            <td className="py-5 px-4"><span className="text-[14px] font-black text-[#DE7A6A]">{formatPHP(item.amount)}</span></td>
                                                            <td className="py-5 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                                    <span className="text-[13px] font-bold text-slate-600">{item.days_overdue === 0 ? 'Today' : `${String(item.days_overdue).padStart(2, '0')} Day${item.days_overdue !== 1 ? 's' : ''}`}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-4 text-right">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${item.status === 'Overdue' ? 'bg-[#FDECEB] text-[#DE7A6A]' : 'bg-[#FFF9E6] text-[#B08E2E]'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-5 px-10">
                                                                <div className="flex justify-end">
                                                                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-[#5591AB] rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-[#5591AB] hover:text-white transition-all shadow-sm" suppressHydrationWarning>
                                                                        <Send className="w-3 h-3" />Remind
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={6} className="py-16 text-center text-slate-300 text-sm font-bold uppercase tracking-widest">No delinquent accounts found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

            {/* ROOM DETAIL MODAL */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 border-none rounded-[28px] overflow-hidden bg-white shadow-2xl">
                    <div className="bg-[#0B3A64] p-8 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 opacity-10"><Building2 className="w-48 h-48" /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/20 ${selectedRoom?.status === 'full' ? 'bg-[#7A9D54]/20 text-[#D5E1CD]' : selectedRoom?.status === 'partial' ? 'bg-[#F2C908]/20 text-[#F2E8C4]' : 'bg-white/10 text-white/60'}`}>
                                    {selectedRoom?.status}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight mb-1">Room {selectedRoom?.id}</h2>
                            <p className="text-white/60 text-[12px] font-bold uppercase tracking-widest">{selectedRoom?.current} of {selectedRoom?.max} slots assigned</p>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Occupants</h3>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">{selectedRoom?.occupants.length} Found</span>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {selectedRoom?.occupants.length > 0 ? selectedRoom.occupants.map((occ: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#0B3A64]/20 hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                            <AvatarImage src={occ.avatar} />
                                            <AvatarFallback className="bg-[#5D6BDE] text-white font-black text-sm">
                                                {occ.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-[15px] font-black text-[#0B3A64] leading-tight mb-0.5">{occ.name}</p>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{occ.student_number}</p>
                                            {occ.payment_status && (
                                                <span className={`text-[9px] font-black uppercase tracking-widest mt-1 inline-block px-2 py-0.5 rounded-full ${occ.payment_status === 'Cleared' ? 'bg-[#EEF4E7] text-[#4A7A2A]' : occ.payment_status === 'Overdue' ? 'bg-[#FDECEB] text-[#DE7A6A]' : 'bg-[#FFF9E6] text-[#B08E2E]'}`}>
                                                    {occ.payment_status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-[#0B3A64] hover:bg-white transition-all hover:shadow-sm">
                                        <User className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-200" /></div>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Room is empty</p>
                                    <p className="text-slate-300 text-[11px] mt-1">No students currently assigned</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsRoomModalOpen(false)} className="w-full mt-8 py-4 bg-[#F2C908] hover:bg-[#EBC207] text-[#0B3A64] font-black text-[13px] rounded-2xl transition-all shadow-md active:scale-[0.98] uppercase tracking-widest">
                            Close View
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
                </div>
            </div>
        </div>
    );
}

// ─── Pending Approvals Card (fetches from existing applications route) ────────
function PendingApprovalsCard() {
    const [pendingApps, setPendingApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/manager/dashboard')
            .then(r => r.json())
            .then(data => {
                setPendingApps(data.applications ?? []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const urgentCount = pendingApps.length;

    return (
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100/50 flex flex-col h-[180px]">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-bold text-[#0B3A64] tracking-[0.1em] uppercase">Pending Approvals</h3>
                {urgentCount > 0 && (
                    <span className="bg-[#D03027] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{urgentCount} Urgent</span>
                )}
            </div>
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                {loading ? (
                    <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-auto mb-auto text-center">Loading...</p>
                ) : pendingApps.length === 0 ? (
                    <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-auto mb-auto text-center">No pending approvals</p>
                ) : pendingApps.slice(0, 3).map((app: any) => (
                    <div key={app.application_id} className="bg-[#F6F8E8] rounded-lg p-2 flex items-start gap-2.5">
                        <div className="text-[#7A9D54] mt-0.5"><UserPlus className="w-3.5 h-3.5" /></div>
                        <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-[#0B3A64] leading-tight mb-0.5 truncate">Application Review</p>
                            <p className="text-[9px] text-slate-500 font-medium truncate">
                                {app.users?.first_name} {app.users?.last_name}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
