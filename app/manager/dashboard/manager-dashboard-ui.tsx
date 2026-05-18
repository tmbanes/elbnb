"use client";

// app/manager/dashboard/manager-dashboard-ui.tsx

import React, { useEffect, useState } from "react";
import {
    Bell, Building2, Users, FileText,
    Banknote, LogOut, UserPlus, ArrowLeftRight, AlertTriangle, BarChart2, CheckCircle2, ChevronRight,
    Filter, User, Plus, RotateCcw, Clock, Send, History
} from "lucide-react";
import { useRealtimeSync } from "@/lib/realtime-sync";
import { DashboardRealtimeSync } from "@/components/DashboardRealtimeSync";
import { ManagerDashboardHeader } from "./ManagerDashboardHeader";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { Archivo } from "next/font/google";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
});


const archivo = Archivo({ subsets: ["latin"] });

interface ManagerDashboardUIProps {
    profile: any;
    notifications: any[];
    initialData: {
        accom: any;
        units: any[];
        assignments: any[];
        waitlist: any[];
        activityLog: any[];
        recentApplications: any[];
        moveOutAlerts: any[];
    };
    onLogout?: () => void;
    isLoggingOut?: boolean;
}

function formatPHP(amount: number) {
    return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ManagerDashboardUI({
    profile,
    notifications: initialNotifications,
    initialData,
    onLogout,
    isLoggingOut
}: ManagerDashboardUIProps) {
    const [dashboardView, setDashboardView] = useState<'operations' | 'financials'>('operations');
    const [hasMounted, setHasMounted] = useState(false);
    const router = useRouter();

    useEffect(() => { setHasMounted(true); }, []);

    const [roomView, setRoomView] = useState<'grid' | 'list'>('grid');

    // --- Manager / Dorm Info ---
    const [managerName] = useState(profile ? `${profile.first_name} ${profile.last_name}` : "Manager");
    const [managerInitials] = useState(profile ? `${profile.first_name?.[0]}${profile.last_name?.[0]}`.toUpperCase() : "M");
    const [managerAvatar] = useState(profile?.profile_picture_url || null);
    const [dormName] = useState(initialData.accom?.name || "No Dorm Assigned");
    const [dormLocation] = useState(initialData.accom?.location || "");

    // --- Residents / Waitlist Data Fetch ---
    const { data: residentsData } = useSWR(
        "/api/manager/dashboard/residents",
        fetcher,
        { revalidateOnFocus: false }
    );

    // --- Operations Metrics ---
    const totalRooms = initialData.units.length;
    const occupiedCount = residentsData?.residents ? residentsData.residents.length : initialData.assignments.length;
    const availableCount = (() => {
        const totalCap = initialData.units.reduce((acc: number, u: any) => acc + (u.max_occupancy || 0), 0);
        return Math.max(0, totalCap - occupiedCount);
    })();
    const occupiedRate = (() => {
        const totalCap = initialData.units.reduce((acc: number, u: any) => acc + (u.max_occupancy || 0), 0);
        return totalCap > 0 ? ((occupiedCount / totalCap) * 100).toFixed(1) : "0.0";
    })();
    const waitlistCount = residentsData?.waitlist ? residentsData.waitlist.length : initialData.waitlist.length;

    // --- Room Grid ---
    const dbRooms = React.useMemo(() => {
        const occupantsMap = new Map<string, any[]>();
        
        if (residentsData?.residents) {
            residentsData.residents.forEach((r: any) => {
                if (!occupantsMap.has(r.unit_id)) occupantsMap.set(r.unit_id, []);
                occupantsMap.get(r.unit_id)!.push({
                    id: r.user_id,
                    assignment_id: r.assignment_id,
                    name: r.name,
                    student_number: r.student_number,
                    move_in_date: r.move_in_date,
                    payment_status: r.payment_status,
                    avatar: r.profile_picture_url || null,
                });
            });
        } else {
            initialData.assignments.forEach((asg: any) => {
                if (!occupantsMap.has(asg.unit_id)) occupantsMap.set(asg.unit_id, []);
                const u = asg.users || {};
                const studentNum = u.student?.student_number || u.student?.[0]?.student_number || "Not provided";
                occupantsMap.get(asg.unit_id)!.push({
                    id: asg.user_id,
                    assignment_id: asg.assignment_id,
                    name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
                    student_number: studentNum,
                    move_in_date: asg.move_in_date,
                    payment_status: "Unknown",
                    avatar: asg.users?.profile_picture_url || null,
                });
            });
        }

        return initialData.units.map((u: any) => {
            const occupants = occupantsMap.get(u.unit_id) ?? [];
            const count = occupants.length;
            let status = "vacant";
            if (u.unit_status === "inactive" || u.unit_status === "maintenance") status = "maintenance";
            else if (count >= u.max_occupancy) status = "full";
            else if (count > 0) status = "partial";
            return { id: u.unit_number, unit_id: u.unit_id, status, current: count, max: u.max_occupancy, occupants };
        });
    }, [residentsData, initialData]);

    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // --- Residents / Waitlist Table ---
    const allStudents = React.useMemo(() => {
        if (residentsData?.residents) {
            return residentsData.residents.map((r: any) => ({
                type: "resident" as const,
                id: r.user_id,
                assignment_id: r.assignment_id,
                name: r.name,
                student_number: r.student_number,
                college: r.college,
                room_number: r.room_number,
                unit_number: r.room_number,
                move_in_date: r.move_in_date,
                payment_status: r.payment_status,
            }));
        }
        return initialData.assignments.map((asg: any) => {
            const u = asg.users || {};
            const studentNum = u.student?.student_number || u.student?.[0]?.student_number || "Not provided";
            const college = u.student?.college || u.student?.[0]?.college || "Not specified";
            return {
                type: "resident" as const,
                id: u.user_id || asg.user_id,
                assignment_id: asg.assignment_id,
                name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
                student_number: studentNum,
                college: college,
                room_number: asg.unit?.unit_number || "Unassigned",
                unit_number: asg.unit?.unit_number || "Unassigned",
                move_in_date: asg.move_in_date,
                payment_status: "Unknown",
            };
        });
    }, [residentsData, initialData]);

    const waitlistStudents = React.useMemo(() => {
        if (residentsData?.waitlist) {
            return residentsData.waitlist.map((w: any) => ({
                type: "waitlist" as const,
                id: w.user_id,
                application_id: w.application_id,
                name: w.name,
                student_number: w.student_number,
                college: w.college,
                date_submitted: w.date_submitted,
                preferred_unit_type: w.preferred_unit_type,
            }));
        }
        return initialData.waitlist.map((app: any) => {
            const u = app.users || {};
            return {
                type: "waitlist" as const,
                id: u.user_id || app.user_id,
                application_id: app.application_id,
                name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
                student_number: u.student?.student_number || u.student?.[0]?.student_number || "N/A",
                college: u.student?.college || u.student?.[0]?.college || "N/A",
                date_submitted: app.date_submitted,
                preferred_unit_type: app.preferred_unit_type,
            };
        });
    }, [residentsData, initialData]);

    const [activeTab, setActiveTab] = useState<"residents" | "waitlist">("residents");
    const [tableSearch, setTableSearch] = useState("");
    const [tablePage, setTablePage] = useState(1);
    const [tableFilters, setTableFilters] = useState({
        yearLevel: "all",
        roomStatus: "all",
        gender: "all",
        paymentStatus: "all",
        course: "all",
        college: "all",
    });
    const studentsPerPage = 5;

    // --- Financials ---
    const { data: financialsData, isLoading: isFinancialsLoading } = useSWR(
        dashboardView === 'financials' ? '/api/manager/dashboard/financials' : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const expectedRevenue = financialsData?.expectedRevenue ?? 0;
    const actualCollected = financialsData?.actualCollected ?? 0;
    const outstandingBalance = financialsData?.outstandingBalance ?? 0;
    const unpaidInvoiceCount = financialsData?.unpaidInvoiceCount ?? 0;
    const collectionRate = financialsData?.collectionRate ?? 0;
    const delinquencyList = financialsData?.delinquencyList ?? [];
    const financialsLoading = dashboardView === 'financials' && isFinancialsLoading;

    const [delinquencyFilter, setDelinquencyFilter] = useState("all");
    const [delinquencySortDays, setDelinquencySortDays] = useState(true);

    // --- Activity Log ---
    const [activityLog] = useState(initialData.activityLog);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

    // --- Recent Applications ---
    const [recentApplications] = useState(initialData.recentApplications);
    const [expandedApplication, setExpandedApplication] = useState<string | null>(null);

    // --- Move-out Alerts ---
    const [moveOutAlerts] = useState(initialData.moveOutAlerts);

    const handleResetFilters = () => {
        setTableSearch("");
        setTableFilters({ yearLevel: "all", college: "all", roomStatus: "all", paymentStatus: "all", gender: "all", course: "all" });
        setTablePage(1);
    };


    // Financials are now fetched and cached using useSWR above

    // ─── Derived ---
    const rooms = dbRooms.length > 0 ? dbRooms : [];

    const currentData = activeTab === 'residents' ? allStudents : waitlistStudents;
    const filteredStudents = currentData.filter((student: any) => {
        const matchesSearch = (student.name || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
            (student.student_number || "").toLowerCase().includes(tableSearch.toLowerCase());
        const matchesCollege = tableFilters.college === "all" || student.college === tableFilters.college;
        const matchesPayment = activeTab === 'waitlist' ? true : (tableFilters.paymentStatus === "all" || (student as any).payment_status === tableFilters.paymentStatus);
        return matchesSearch && matchesCollege && matchesPayment;
    });

    const paginatedStudents = filteredStudents.slice((tablePage - 1) * studentsPerPage, tablePage * studentsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    // Delinquency filter + sort
    const filteredDelinquency = delinquencyList
        .filter((d: any) => {
            if (delinquencyFilter === 'all') return true;
            if (delinquencyFilter === 'Pending') return d.status === 'Unpaid';
            if (delinquencyFilter === 'Overdue') return d.status === 'Overdue';
            return true;
        })
        .sort((a: any, b: any) => delinquencySortDays ? b.days_overdue - a.days_overdue : a.name.localeCompare(b.name));

    // Activity log color + label
    const activityColor = (type: string) => {
        if (type?.includes('check_in') || type?.includes('approved')) return '#7A9D54';
        if (type?.includes('maintenance') || type?.includes('complaint')) return '#0B3A64';
        if (type?.includes('billing') || type?.includes('payment')) return '#3668C1';
        if (type?.includes('alert') || type?.includes('reject')) return '#C55745';
        return '#5591AB';
    };

    const generateActivityPDF = () => {
        const doc = new jsPDF();
        
        // Add Header
        doc.setFontSize(22);
        doc.setTextColor(11, 58, 100); // #0B3A64
        doc.text("Activity Archive Report", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-PH')}`, 14, 30);
        doc.text(`Facility: ${dormName}`, 14, 35);
        doc.text(`Managed by: ${managerName}`, 14, 40);
        
        // Add Table
        const tableData = activityLog.map(log => [
            new Date(log.timestamp).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            log.action_type?.replace(/_/g, ' ').toUpperCase() || 'GENERAL',
            log.description
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['Timestamp', 'Category', 'Description']],
            body: tableData,
            headStyles: { fillColor: [11, 58, 100], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [44, 44, 44] },
            alternateRowStyles: { fillColor: [249, 251, 253] },
            margin: { top: 50 },
            styles: { cellPadding: 5 }
        });

        // Save PDF
        doc.save(`Activity_Archive_${dormName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };


    if (!hasMounted) return <div className={`flex h-screen bg-[#F6F5ED] overflow-hidden ${archivo.className}`} />;

    if (!hasMounted) return <div className={`flex h-screen bg-[#F6F8D5] overflow-hidden ${archivo.className}`} />;

    return (
        <div className={`flex h-screen bg-[#F6F8D5] overflow-hidden ${archivo.className}`}>
            <DashboardRealtimeSync table="activity_log" event="INSERT" />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-auto pb-10" suppressHydrationWarning>
                    {/* TOP HEADER */}
                    <ManagerDashboardHeader profile={profile} initialNotifications={initialNotifications} />

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
                                    <Link href="/manager/housing">
                                        <button className="px-5 py-2 border border-slate-200 text-[#0B3A64] text-[11px] font-bold rounded-lg hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98] transition-all uppercase tracking-wider">Manage Dorm</button>
                                    </Link>
                                </div>

                                {/* METRICS GRID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    {/* Total Rooms */}
                                    <div className="bg-[#eb8b0d] rounded-[20px] p-5 shadow-sm flex flex-col justify-between h-[180px] text-white">
                                        <h3 className="text-[10px] font-bold text-white/70 tracking-[0.1em] uppercase">Total Rooms</h3>
                                        <div>
                                            <p className="text-[38px] font-black text-white leading-none mb-1">{totalRooms}</p>
                                            <p className="text-[11px] text-white/80 font-medium">Certified Living Units</p>
                                        </div>
                                    </div>

                                    {/* Occupancy */}
                                    <div className="bg-[#79a34e] rounded-[20px] p-5 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden text-white">
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
                                    <div className="bg-[#5b93ad] rounded-[20px] p-5 shadow-sm flex flex-col justify-between h-[180px] text-white">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-[10px] font-bold text-white/70 tracking-[0.1em] uppercase">Pending Assignment</h3>
                                            <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Waitlist</span>
                                        </div>
                                        <div>
                                            <p className="text-[38px] font-black text-white leading-none mb-1">{waitlistCount}</p>
                                            <p className="text-[11px] text-white/80 font-medium">Approved Students Waiting</p>
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
                                                <button onClick={() => setRoomView('grid')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wide transition-all active:scale-[0.95] ${roomView === 'grid' ? 'bg-[#0B3A64] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Grid</button>
                                                <button onClick={() => setRoomView('list')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wide transition-all active:scale-[0.95] ${roomView === 'list' ? 'bg-[#0B3A64] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>List</button>
                                            </div>
                                        </div>

                                        {rooms.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center text-slate-300 text-sm font-bold uppercase tracking-widest">No rooms found</div>
                                        ) : roomView === 'grid' ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                                                {rooms.map(room => {
                                                    return (
                                                        <div key={room.unit_id}
                                                            onClick={() => { setSelectedRoom(room); setIsRoomModalOpen(true); }}
                                                            className={`relative flex flex-col items-center justify-center rounded-2xl p-3 cursor-pointer border-2 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] ${room.status === 'full' ? 'bg-[#EEF4E7] border-[#C3D9A8]' : room.status === 'partial' ? 'bg-[#FEFBE7] border-[#E8DC9A]' : room.status === 'maintenance' ? 'bg-[#FEF2F1] border-[#EBCAC7]' : 'bg-slate-50 border-slate-100'}`}
                                                        >
                                                            <p className={`text-[13px] font-black mb-1.5 ${room.status === 'full' ? 'text-[#4A7A2A]' : room.status === 'partial' ? 'text-[#9A7A10]' : room.status === 'maintenance' ? 'text-[#C55745]' : 'text-slate-400'}`}>{room.id}</p>
                                                            <div className="flex items-center gap-1 text-slate-500">
                                                                <Users className="w-3 h-3" />
                                                                <span className="text-[10px] font-bold">{room.current}/{room.max}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                                }
                                            </div>
                                        ) : (
                                            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                                                {rooms.map(room => {
                                                    return (
                                                        <div key={room.unit_id}
                                                            onClick={() => { setSelectedRoom(room); setIsRoomModalOpen(true); }}
                                                            className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                                        >
                                                            <span className="text-[14px] font-black text-[#0B3A64]">{room.id}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[11px] font-bold text-slate-500">{room.current}/{room.max} occupied</span>
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${room.status === 'full' ? 'bg-[#EEF4E7] text-[#4A7A2A]' : room.status === 'partial' ? 'bg-[#FEFBE7] text-[#9A7A10]' : room.status === 'maintenance' ? 'bg-[#FEF2F1] text-[#C55745]' : 'bg-slate-50 text-slate-400'}`}>{room.status}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                                }
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-50">
                                            {[{ label: 'Full Capacity', color: 'bg-[#7A9D54]' }, { label: 'Partially Occupied', color: 'bg-[#E8DC9A]' }, { label: 'Unoccupied', color: 'bg-slate-200' }, { label: 'Maintenance', color: 'bg-[#DE7A6A]' }].map(leg => (
                                                <div key={leg.label} className="flex items-center gap-1.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${leg.color}`}></div>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{leg.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Activity — moved here from below */}
                                    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col h-[280px]">
                                        <div className="flex justify-between items-center mb-5">
                                            <h3 className="text-[13px] font-extrabold text-[#0B3A64] uppercase tracking-wide">Recent Activity</h3>
                                            <button 
                                                onClick={() => setIsArchiveModalOpen(true)}
                                                className="text-[10px] font-bold text-slate-400 hover:text-[#5591AB] hover:bg-slate-50 px-2 py-1 rounded transition-all uppercase tracking-widest flex items-center gap-1"
                                            >
                                                Archive <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        {activityLog.length > 0 ? (
                                            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                                                {activityLog.map((log: any) => (
                                                    <div key={log.log_id} className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: activityColor(log.action_type) }}></div>
                                                            <div>
                                                                <p className="text-[12px] font-bold text-[#0B3A64] leading-snug">
                                                                    {log.log_desc || log.action_type?.replace(/_/g, ' ').replace(/ \w/g, (c: string) => c.toUpperCase())}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-slate-300 font-bold flex-shrink-0">
                                                            {new Date(log.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center">
                                                <p className="text-center text-slate-300 text-[11px] font-bold uppercase tracking-widest">No recent activity</p>
                                            </div>
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
                                                <div className="flex flex-wrap items-center gap-2 ml-auto">
                                                    <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                                        <Select value={tableFilters.college} onValueChange={(v) => setTableFilters(prev => { return { ...prev, college: v }; })}>
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
                                                            <Select value={tableFilters.paymentStatus} onValueChange={(v) => setTableFilters(prev => { return { ...prev, paymentStatus: v }; })}>
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

                                                    <button onClick={handleResetFilters} className="p-2 text-slate-400 hover:text-[#DE7A6A] transition-all hover:rotate-180 duration-500" title="Reset Filters"><RotateCcw className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#F9F7EF] border-b border-slate-100">
                                                    <th className="py-4 px-8 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Student / Property</th>
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
                                                {paginatedStudents.length > 0 ? paginatedStudents.map((student: any, idx: number) => {
                                                    return (
                                                        <tr key={student.assignment_id ?? `student-${idx}`} className="border-b border-slate-50 last:border-0 group hover:bg-[#F9FBFD] transition-colors">
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

                                                            {activeTab === 'residents' ? (
                                                                <>
                                                                    <td className="py-5 px-2">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[14px] font-black text-[#0B3A64]">Room {student.unit_number}</span>
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{student.college}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-5 px-2 text-right">
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap ${student.payment_status === 'Cleared' ? 'bg-[#EEF4E7] text-[#4A7A2A]' : student.payment_status === 'Overdue' ? 'bg-[#FDECEB] text-[#DE7A6A]' : 'bg-[#FFF9E6] text-[#B08E2E]'}`}>
                                                                            {student.payment_status}
                                                                        </span>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <td className="py-5 px-2 text-right">
                                                                    <span className="text-[13px] font-bold text-slate-600">
                                                                        {student.date_submitted ? new Date(student.date_submitted).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            <td className="py-5 px-8">
                                                                <div className="flex justify-end">
                                                                    <Link href={`/manager/student-history/${student.id}`}>
                                                                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-[#0B3A64] hover:bg-slate-100 transition-all" title="View History">
                                                                            <History className="w-4 h-4" />
                                                                        </button>
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No records found matching your selection.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="px-8 py-5 border-t border-slate-50 flex justify-between items-center">
                                        <p className="text-[12px] font-bold text-slate-400">Page <span className="text-[#5591AB]">{tablePage}</span> of {totalPages || 1}</p>
                                        <div className="flex gap-3">
                                            <button disabled={tablePage === 1} onClick={() => setTablePage(p => Math.max(1, p - 1))} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm">Previous</button>
                                            <button disabled={tablePage === totalPages || totalPages === 0} onClick={() => setTablePage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm">Next</button>
                                        </div>
                                    </div>
                                </div>

                                {/* RECENT APPLICATIONS + MOVE-OUT ALERTS */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                    {/* Recent Applications */}
                                    <div className="lg:col-span-2 bg-white rounded-[20px] shadow-sm border border-slate-100/50 overflow-hidden">
                                        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-[14px] font-extrabold text-[#0B3A64] uppercase tracking-wide">Recent Applications</h3>
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Latest residency requests</p>
                                            </div>
                                            <Link href="/manager/applications">
                                                <button className="text-[10px] font-black bg-[#5591AB] text-white px-5 py-2 rounded-full uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md hover:bg-[#467A91] hover:scale-[1.02] hover:shadow-lg active:scale-95 shadow-[#5591AB]/20">
                                                    View All <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </Link>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-[#F9F7EF] border-b border-slate-100">
                                                        <th className="py-5 px-6 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em]">Student / Property</th>
                                                        <th className="py-5 px-4 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em]">Date Applied</th>
                                                        <th className="py-5 px-4 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em] text-right">Status</th>
                                                        <th className="py-5 px-6 text-[10px] font-extrabold text-[#443322] uppercase tracking-[0.2em] text-right">History</th>

                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentApplications.length > 0 ? recentApplications.map((app: any) => {
                                                        const u = app.users ?? {};
                                                        const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Unknown';
                                                        const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
                                                        const status = app.application_status ?? '';
                                                        const statusLabel = status === 'pending_dorm_manager' ? 'Pending Review'
                                                            : status === 'pending_admin' ? 'Forwarded'
                                                                : status === 'approved' ? 'Approved'
                                                                    : status === 'rejected' ? 'Rejected'
                                                                        : status.replace(/_/g, ' ').replace(/ \w/g, (c: string) => c.toUpperCase());
                                                        const statusColor = status === 'approved' ? 'bg-[#EEF4E7] text-[#4A7A2A]'
                                                            : status === 'rejected' ? 'bg-[#FDECEB] text-[#DE7A6A]'
                                                                : 'bg-[#FFF9E6] text-[#B08E2E]';
                                                        
                                                        // Ensure student_number is extracted correctly if nested
                                                        const studentNumber = app.student_number || u.student?.student_number || u.student?.[0]?.student_number || 'N/A';
                                                        const dateSubmitted = app.date_submitted || app.date || null;
                                                        const isExpanded = expandedApplication === app.application_id;

                                                        return (
                                                            <React.Fragment key={app.application_id}>
                                                                <tr 
                                                                    onClick={() => setExpandedApplication(isExpanded ? null : app.application_id)}
                                                                    className={`border-b border-slate-50 last:border-0 hover:bg-[#F9FBFD] transition-colors cursor-pointer ${isExpanded ? 'bg-[#F9FBFD]' : ''}`}
                                                                >
                                                                    <td className="py-4 px-6">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">{initials}</div>
                                                                            <div>
                                                                                <p className="text-[13px] font-black text-[#0B3A64] leading-none">{name}</p>
                                                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{app.preferred_unit_type || dormName}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4">
                                                                        <span className="text-[11px] text-slate-400 font-bold">
                                                                            {dateSubmitted ? new Date(dateSubmitted).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 px-6 text-right">
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor}`}>
                                                                            {statusLabel}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 px-6 text-right">
                                                                        <Link href={`/manager/student-history/${u.user_id || app.user_id}`} onClick={(e) => e.stopPropagation()}>
                                                                            <button className="text-slate-300 hover:text-[#5591AB] transition-colors">
                                                                                <History className="w-4 h-4" />
                                                                            </button>
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                                {isExpanded && (
                                                                    <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                        <td colSpan={4} className="py-4 px-6 border-b border-slate-100">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                                                <div className="sm:col-span-2">
                                                                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Email Contact</p>
                                                                                    <p className="text-[13px] font-black text-[#0B3A64] break-all">{u.email || "No email"}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Sex</p>
                                                                                    <p className="text-[13px] font-black text-[#0B3A64] uppercase tracking-wider">{u.sex || "—"}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Stay Duration</p>
                                                                                    <p className="text-[13px] font-black text-[#0B3A64]">{app.duration_of_stay || 1} Semester(s)</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Check-in Date</p>
                                                                                    <p className="text-[13px] font-black text-[#0B3A64]">{app.check_in ? new Date(app.check_in).toLocaleDateString() : 'Pending'}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Companions</p>
                                                                                    <p className="text-[13px] font-black text-[#0B3A64]">{app.number_of_companions || 0} Person(s)</p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    }) : (
                                                        <tr>
                                                            <td colSpan={4} className="py-10 text-center text-slate-300 text-[11px] font-bold uppercase tracking-widest">No recent applications</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Move-out Alerts */}
                                    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col">
                                        <div className="flex justify-between items-center mb-5">
                                            <div>
                                                <h3 className="text-[13px] font-extrabold text-[#0B3A64] uppercase tracking-wide">Move-out Alerts</h3>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Upcoming Departures</p>
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-[#FDECEB] flex items-center justify-center">
                                                <AlertTriangle className="w-3.5 h-3.5 text-[#DE7A6A]" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-3 overflow-y-auto">
                                            {moveOutAlerts.length > 0 ? moveOutAlerts.map((alert: any) => {
                                                return (
                                                    <div key={alert.assignment_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">{alert.initials}</div>
                                                            <div>
                                                                <p className="text-[12px] font-black text-[#0B3A64] leading-none mb-0.5">{alert.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium">Room {alert.unit_number} · {alert.days_left}d left</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[#FFF9E6] text-[#B08E2E]">Upcoming</span>
                                                    </div>
                                                );
                                            }) : (
                                                <div className="flex-1 flex items-center justify-center py-6">
                                                    <p className="text-center text-slate-300 text-[11px] font-bold uppercase tracking-widest">No upcoming move-outs</p>
                                                </div>
                                            )}
                                        </div>
                                        <Link href="/manager/residents">
                                            <button className="mt-5 w-full py-3 border border-slate-200 text-[#0B3A64] text-[11px] font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                                Manage Turnover <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </Link>
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
                                                        {filteredDelinquency.length > 0 ? filteredDelinquency.map((item: any) => {
                                                            return (
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
                                                            );
                                                        }) : (
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
                </div>
            </div>

            {/* ROOM DETAIL MODAL */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 border-none rounded-[28px] overflow-hidden bg-white shadow-2xl">
                    <VisuallyHidden.Root>
                        <DialogTitle>Room {selectedRoom?.id} Details</DialogTitle>
                    </VisuallyHidden.Root>
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
                            {selectedRoom?.occupants.length > 0 ? selectedRoom.occupants.map((occ: any) => {
                                return (
                                    <div key={occ.assignment_id ?? occ.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#0B3A64]/20 hover:shadow-sm transition-all">
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
                                );
                            }) : (
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

            {/* ARCHIVE ACTIVITY DIALOG */}
            <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
                <DialogContent 
                    showCloseButton={false}
                    className="max-w-2xl bg-[#F6F8D5] border-none rounded-[32px] p-0 overflow-hidden shadow-2xl"
                >
                    <DialogTitle className="sr-only">Activity Archive</DialogTitle>
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <div>
                                <h2 className="text-[20px] font-black text-[#0B3A64] uppercase tracking-wide">Activity Archive</h2>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Full history of facility and student updates</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
                                <Clock className="w-4 h-4 text-[#5591AB]" />
                                <span className="text-[11px] font-black text-[#0B3A64]">{activityLog.length} History Logs</span>
                            </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                            {activityLog.length > 0 ? (
                                activityLog.map((log: any, idx: number) => (
                                    <div key={log.log_id || idx} className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-[#5591AB]/30 transition-all group shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-50 flex-shrink-0" style={{ backgroundColor: activityColor(log.action_type) }}></div>
                                                <div>
                                                    <p className="text-[14px] font-black text-[#0B3A64] leading-snug group-hover:text-[#5591AB] transition-colors">{log.description}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
                                                            {log.action_type?.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-[#5591AB] font-bold">
                                                            {new Date(log.timestamp).toLocaleString('en-PH', { 
                                                                month: 'short', day: 'numeric', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit' 
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {log.user_id && (
                                                <div className="flex flex-col items-end">
                                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-1">Triggered By</span>
                                                     <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">ID</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100 mb-4 shadow-sm">
                                        <History className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-extrabold uppercase tracking-widest">No Archived logs</p>
                                    <p className="text-slate-300 text-[11px] mt-1 font-bold">New facility activities will appear here</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <button 
                                onClick={generateActivityPDF}
                                className="w-full py-4 bg-white border-2 border-[#0B3A64] text-[#0B3A64] font-black text-[11px] rounded-2xl hover:bg-slate-50 transition-all shadow-md active:scale-[0.98] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" /> Download PDF Report
                            </button>
                            <button 
                                onClick={() => setIsArchiveModalOpen(false)}
                                className="w-full py-4 bg-[#0B3A64] text-white font-black text-[11px] rounded-2xl hover:bg-[#082d4f] transition-all shadow-lg active:scale-[0.98] uppercase tracking-[0.2em]"
                            >
                                Close Archive
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Pending Approvals Card (fetches from existing applications route) ────────
function PendingApprovalsCard() {
    const [pendingApps, setPendingApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/manager/dashboard')
            .then(r => {
                if (!r.ok) throw new Error(`Dashboard route error: ${r.status} ${r.statusText}`);
                return r.json();
            })
            .then(data => {
                setPendingApps(data.applications ?? []);
            })
            .catch(err => console.error('PendingApprovalsCard fetch failed:', err))
            .finally(() => setLoading(false));
    }, []);

    const urgentCount = pendingApps.length;

    return (
        <div className="bg-[#284485] rounded-[20px] p-5 shadow-sm flex flex-col h-[180px] text-white">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-bold text-white/70 tracking-[0.1em] uppercase">Pending Approvals</h3>
                {urgentCount > 0 && (
                    <span className="bg-[#D03027] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{urgentCount} Urgent</span>
                )}
            </div>
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                {loading ? (
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mt-auto mb-auto text-center">Loading...</p>
                ) : pendingApps.length === 0 ? (
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mt-auto mb-auto text-center">No pending approvals</p>
                ) : pendingApps.slice(0, 3).map((app: any) => {
                    return (
                        <div key={app.application_id} className="bg-white/10 rounded-lg p-2 flex items-start gap-2.5">
                            <div className="text-white/70 mt-0.5"><UserPlus className="w-3.5 h-3.5" /></div>
                            <div className="overflow-hidden">
                                <p className="text-[11px] font-bold text-white leading-tight mb-0.5 truncate">Application Review</p>
                                <p className="text-[9px] text-white/60 font-medium truncate">
                                    {app.users?.first_name} {app.users?.last_name}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
