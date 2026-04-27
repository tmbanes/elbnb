"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    Search, Bell, Building2, History, FileText,
    Folder, Download, Plus, ArrowRight, LogOut,
    Calendar, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { Archivo } from "next/font/google";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { submitExtensionRequest } from "./actions";
import { createActivityLog } from "@/services/activity_log";

import { useRealtimeSync } from "@/lib/realtime-sync";
import { ViewAccommodation } from "@/components/SearchAccommodations";
import { Accommodation, Unit } from "@/types/accommodation_units";

const archivo = Archivo({ subsets: ["latin"] });

interface StudentDashboardUIProps {
    user: any;
    currentResidency: any;
    history: any[];
    billingSummary: any;
    bills: any[];
    stats: any;
    accommodations: any[];
    documents: any[];
    notifications: any[];
}

export default function StudentDashboardUI({
    user,
    currentResidency,
    history,
    billingSummary,
    bills,
    stats,
    accommodations,
    documents,
    notifications: initialNotifications
}: StudentDashboardUIProps) {
    const [showLogout, setShowLogout] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [testMode, setTestMode] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
            setNotifications(initialNotifications.map(n => ({
                ...n,
                is_read: n.is_read || readIds.includes(n.id)
            })));
        }
    }, [initialNotifications]);

    const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
    
    // Detailed View State
    const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
    const [accommodationUnits, setAccommodationUnits] = useState<Unit[]>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);

    const supabase = getSupabaseBrowserClient();
    const router = useRouter();

    // Sync notifications in real-time via activity_log
    // We listen to all activity_log inserts to trigger a refresh
    useRealtimeSync('activity_log', undefined, 'INSERT');

    const handleLogout = async () => {
        setIsLoggingOut(true);

        if (user?.user_id) {
            await createActivityLog({
                p_user_id: user.user_id,
                p_action_type: "logout",
                p_log_desc: `${user.first_name} logged out `,
                p_entity_type: "auth",
                p_entity_id: user.user_id,
                p_user_role: user.role,
            });
        }



        await supabase.auth.signOut();
        setTimeout(() => {
            window.location.href = "/";
        }, 300);
    };

    // Navigation handlers
    const goToHistory = () => router.push("/student/history");
    const goToAccommodations = () => router.push("/student/accommodations");
    //const goToAccommodationDetails = (id: string) => router.push(`/student/accommodations`);
    const goToBilling = () => router.push("/student/billing");
    const goToApplications = () => router.push("/student/applications");

    const handleViewDetails = async (accommodation: Accommodation) => {
        setSelectedAccommodation(accommodation);
        setIsLoadingUnits(true);
        try {
            const res = await fetch(`/api/shared/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodation.accommodation_id}`);
            if (res.ok) {
                const data = await res.json();
                setAccommodationUnits(data);
            }
        } catch (err) {
            console.error("Failed to fetch units:", err);
        } finally {
            setIsLoadingUnits(false);
        }
    };

    // Renewal Logic
    const renewalStart = currentResidency?.unit?.accommodation?.renewal_start_date;
    const renewalEnd = currentResidency?.unit?.accommodation?.renewal_end_date;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "TBD";
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const today = new Date();
    const isInRenewalPeriod = renewalStart && renewalEnd &&
        today >= new Date(renewalStart) &&
        today <= new Date(renewalEnd);

    const isRenewalAvailable = isInRenewalPeriod || testMode;

    const handleConfirmExtension = async () => {
        if (!user?.user_id || !currentResidency) return;

        setIsSubmittingExtension(true);
        try {
            const result = await submitExtensionRequest(user.user_id, currentResidency);
            if (!result.success) throw new Error(result.error);

            setIsConfirmModalOpen(false);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
        } catch (err: any) {
            console.error("Failed to submit extension:", err);
            alert(`Failed to submit extension: ${err.message}`);
        } finally {
            setIsSubmittingExtension(false);
        }
    };

    // Formatter for Currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    // Active Residency Details
    const dormName = currentResidency?.unit?.accommodation?.name || "No Active Residency";
    const dormAddress = currentResidency?.unit?.accommodation?.location || "N/A";
    const roomNumber = currentResidency?.unit?.unit_number ? `Room ${currentResidency.unit.unit_number}` : "";
    const checkInDate = currentResidency?.move_in_date ? new Date(currentResidency.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A";
    const status = currentResidency?.assignment_status ? (currentResidency.assignment_status.charAt(0).toUpperCase() + currentResidency.assignment_status.slice(1).replace('_', ' ')) : "N/A";
    const unitType = currentResidency?.unit?.unit_type ? (currentResidency.unit.unit_type.charAt(0).toUpperCase() + currentResidency.unit.unit_type.slice(1)) : "N/A";

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (selectedAccommodation) {
        return (
            <div className={`min-h-screen bg-[#F6F8D5] ${archivo.className}`}>
                <ViewAccommodation
                    accommodation={selectedAccommodation}
                    units={accommodationUnits}
                    onBack={() => setSelectedAccommodation(null)}
                    onApply={() => router.push(`/student/accommodations/application?id=${selectedAccommodation.accommodation_id}`)}
                    userRole="student"
                />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#F6F8D5] py-6 px-6 lg:py-10 lg:px-[1in] text-slate-800 flex flex-col items-center ${archivo.className}`}>

            {/* SUCCESS TOAST */}
            {showSuccessToast && (
                <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
                    <div className="bg-white border-l-4 border-emerald-500 shadow-2xl rounded-xl p-4 flex items-center gap-4 max-w-md">
                        <div className="bg-emerald-100 p-2 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">Extension Submitted!</p>
                            <p className="text-slate-500 text-xs">Your request to extend stay has been sent for processing.</p>
                        </div>
                        <button onClick={() => setShowSuccessToast(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-[1100px]">
                {/* TOP BAR */}
                <header className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center w-full mb-12 gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-[350px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search data, students, or rooms..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-100/80 rounded-full text-sm border-none focus:ring-2 focus:ring-slate-300 outline-none font-medium placeholder:text-slate-400"
                            />
                        </div>

                    </div>

                    <div className="flex items-center gap-6 self-end md:self-auto">
                        {/* NOTIFICATIONS BELL */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#A05C5C] text-white text-[9px] font-bold rounded-full ring-2 ring-[#FDFBF7] flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-2 z-[60] overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                                        <button
                                            className="text-[10px] font-bold text-[#668E42] uppercase tracking-wider hover:text-[#557F44] transition-colors"
                                            onClick={() => {
                                                if (typeof window !== 'undefined') {
                                                    const existingIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                                                    const allIds = Array.from(new Set([...existingIds, ...notifications.map(n => n.id)]));
                                                    localStorage.setItem('read_notifications', JSON.stringify(allIds));
                                                }
                                                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                                            }}
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
                                                    }}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#668E42]' : 'bg-transparent'}`}></div>
                                                        <div>
                                                            <p className="text-[13px] font-bold text-slate-900 mb-1 group-hover:text-[#668E42] transition-colors">{n.title}</p>
                                                            <p className="text-[12px] text-slate-500 leading-relaxed mb-1.5">{n.message}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at || n.date_submitted || Date.now()).toLocaleDateString()}</p>
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
                                        className="w-full py-3 text-[11px] font-bold text-slate-500 hover:text-[#668E42] transition-colors border-t border-slate-50"
                                        onClick={() => { setShowNotifications(false); router.push('/student/notifications'); }}
                                    >
                                        View All Activity
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* PROFILE / LOGOUT DROPDOWN */}
                        <div className="relative">
                            <div
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => setShowLogout(!showLogout)}
                            >
                                <div className="flex flex-col items-end">
                                    <span className="text-[13px] font-bold text-slate-900 leading-tight">
                                        {user?.first_name} {user?.last_name}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                                        {user?.role?.toUpperCase() || "STUDENT"}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#5D6BDE] overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                    {user?.profile_picture_url ? (
                                        <Image
                                            src={user.profile_picture_url}
                                            alt="Profile"
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white">
                                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {showLogout && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-2 z-50 overflow-hidden">
                                    <button
                                        onClick={handleLogout}
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

                {/* HERO SECTION */}
                <section className="mb-10">
                    <h3 className="text-[11px] font-extrabold text-[#4A3022] tracking-[0.2em] uppercase mb-2">
                        Welcome Home, {user?.first_name}
                    </h3>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#4A3022] tracking-tight">
                        Pahingahan Para sa Pangarap
                    </h1>
                </section>

                {/* TOP TWO CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* LEFT LARGE CARD */}
                    <div className="lg:col-span-2 bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] relative overflow-hidden flex flex-col justify-between min-h-[340px]">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-[#668E42] text-white text-[10px] font-bold px-3 py-1.5 rounded-[12px] uppercase tracking-wider">
                                    Current Accommodation
                                </span>
                                <Building2 className="w-6 h-6 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            {currentResidency?.unit?.accommodation?.image && (
                                <div className="absolute inset-0 z-0 opacity-10">
                                    <Image 
                                        src={currentResidency.unit.accommodation.image} 
                                        alt="Background" 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            <h2 className="text-2xl md:text-[28px] font-bold text-[#2A3F2D] mb-1 leading-tight">
                                {dormName}{roomNumber ? `, ${roomNumber}` : ""}
                            </h2>
                            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[80%]">
                                {dormAddress}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 w-full">
                            <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Check-in</p>
                                <p className="text-[15px] font-bold text-slate-900">{checkInDate}</p>
                            </div>
                            <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Status</p>
                                <p className="text-[15px] font-bold text-slate-900">{status}</p>
                            </div>
                            <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6] sm:col-span-1 col-span-2">
                                <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Unit Type</p>
                                <p className="text-[15px] font-bold text-slate-900">{unitType}</p>
                            </div>
                        </div>

                        {/* RENEWAL / EXTEND STAY BUTTON - BOTTOM RIGHT */}
                        <div className="mt-8 flex justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-full md:w-auto">
                                            <Button
                                                disabled={!isRenewalAvailable || isSubmittingExtension}
                                                onClick={() => setIsConfirmModalOpen(true)}
                                                className={`w-full md:w-auto h-auto py-3 px-8 rounded-2xl font-bold text-[12px] transition-all flex items-center justify-center gap-2 shadow-lg ${isRenewalAvailable
                                                    ? 'bg-[#668E42] hover:bg-[#557F44] text-white shadow-[#668E42]/10 active:scale-[0.98]'
                                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                                    }`}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                {isSubmittingExtension ? "Submitting..." : "Extend Stay"}
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {!isRenewalAvailable && (
                                        <TooltipContent className="bg-slate-800 text-white border-none p-3 rounded-xl shadow-xl max-w-[250px]">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-medium leading-relaxed">
                                                    Accommodation renewal can only be accessed during the renewal period:
                                                    <span className="block mt-1 font-bold text-white">
                                                        {formatDate(renewalStart)} – {formatDate(renewalEnd)}
                                                    </span>
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    {/* RIGHT SMALL CARD - ACCOMMODATION HISTORY */}
                    <div className="bg-[#6492A7] rounded-[24px] p-6 md:p-8 md:pb-6 shadow-[0_4px_15px_rgba(100,146,167,0.2)] text-white flex flex-col justify-between relative overflow-hidden">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[20px] font-extrabold tracking-[0em] uppercase text-white/90">Accommodation History</span>
                                <History className="w-5 h-5 text-white/70" />
                            </div>

                            <div className="space-y-4 mb-6">
                                {history.length > 0 ? (
                                    history.slice(0, 3).map((item, i) => (
                                        <div key={i} className="border-l-2 border-white/20 pl-4 py-0.5">
                                            <h3 className="text-[15px] font-bold leading-tight">
                                                {item.accommodation?.name || "Past Residence"}
                                            </h3>
                                            <p className="text-[11px] text-white/70 mt-0.5">
                                                {item.check_in ? new Date(item.check_in).getFullYear() : ""} - {item.check_out ? new Date(item.check_out).getFullYear() : "Present"}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-white/60 italic">No previous records found.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={goToHistory}
                                className="w-full py-3 bg-white text-[#6492A7] text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-lg shadow-[#6492A7]/10 active:scale-[0.98] group"
                            >
                                View Full History <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ACCOMMODATIONS PREVIEW - ENCLOSED IN SECTION CONTAINER */}
                <section className="mb-14 bg-white rounded-[40px] p-8 md:p-12 border border-[#eef1d6] shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F6F8D5]/40 rounded-full blur-3xl"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-8 h-[2px] bg-[#709849]"></span>
                                <h3 className="text-[11px] font-extrabold text-[#709849] tracking-[0.25em] uppercase">Student-Friendly Stays</h3>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2A3F2D] tracking-tight">Accommodations</h2>
                            <p className="text-[14px] text-slate-500 font-medium mt-2 max-w-md">Curated options for students including campus residence halls.</p>
                        </div>
                        <button
                            onClick={goToAccommodations}
                            className="flex items-center gap-2 text-[#557F44] font-black text-[13px] hover:translate-x-1 transition-all bg-white px-7 py-3.5 rounded-2xl border border-[#eef1d6] shadow-sm hover:shadow-md"
                        >
                            Explore All Accommodations <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        {accommodations.length > 0 ? (
                            accommodations.slice(0, 3).map((dorm, i) => (
                                <div key={i} className="bg-[#F9FBEC] rounded-[32px] overflow-hidden border border-slate-100/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)] group hover:shadow-2xl hover:shadow-[#709849]/5 transition-all duration-500">
                                    <div className="h-44 relative overflow-hidden bg-[#F8F9EC]">
                                        <div className="w-full h-full bg-[#F6F8D5]/30 group-hover:scale-110 transition-transform duration-700 flex items-center justify-center">
                                            {dorm.image ? (
                                                <Image 
                                                    src={dorm.image} 
                                                    alt={dorm.name} 
                                                    fill 
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Building2 className="w-10 h-10 text-[#709849]/20" />
                                            )}
                                        </div>
                                        <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl text-[11px] font-black text-[#2A3F2D] shadow-lg z-10">
                                            Available
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <h4 className="text-[18px] font-bold text-[#2A3F2D] mb-1.5">{dorm.name}</h4>
                                        <p className="text-[10px] font-extrabold text-[#709849] uppercase tracking-[0.15em] mb-6">{dorm.accommodation_type === 'dormitory' ? 'UP RESIDENCE HALL' : (dorm.property_type || 'PRIVATE STAY')}</p>
                                        <button
                                            onClick={() => handleViewDetails(dorm)}
                                            className="w-full py-3.5 bg-[#6492A7] hover:bg-[#4f7b8f] text-white text-[13px] font-bold rounded-2xl transition-all active:scale-[0.98] shadow-md shadow-[#6492A7]/10"
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium italic">No accommodations available at the moment.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* BOTTOM THREE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* BILLING CARD */}
                    <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Billing Summary</h2>
                                <FileText className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="mb-8">
                                <p className="text-4xl font-extrabold text-[#113a68] leading-none mb-2 tracking-tight">
                                    {formatCurrency(billingSummary?.balance || 0)}
                                </p>
                                <p className="text-[10px] font-extrabold text-[#D03027] tracking-[0.1em] uppercase">
                                    Total Outstanding Balance
                                </p>
                            </div>

                            <div className="space-y-4 mb-8 border-t border-[#eef1d6] pt-5">
                                {bills.length > 0 ? (
                                    bills.slice(0, 2).map((bill, i) => (
                                        <div key={i} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[13px] font-extrabold text-slate-900 truncate max-w-[150px]">
                                                    {bill.billing_period_date ? `Invoice for ${new Date(bill.billing_period_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : "Room Rent"}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Due {new Date(bill.due_date).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-[13px] font-extrabold text-slate-900">{formatCurrency(bill.amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No pending bills found.</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={goToBilling}
                            className="w-full py-3.5 bg-[#6492A7] hover:bg-[#4f7b8f] text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(100,146,167,0.3)] hover:shadow-[0_4px_12px_rgba(100,146,167,0.4)] active:scale-[0.98]"
                        >
                            View All Bills
                        </button>
                    </div>

                    {/* DOCUMENTS CARD */}
                    <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Documents</h2>
                                <Folder className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="space-y-3 mb-8">
                                {documents.length > 0 ? (
                                    documents.slice(0, 2).map((doc, i) => (
                                        <div key={i} className="bg-[#F8F9EC] rounded-[14px] p-3 pl-4 flex justify-between items-center border border-[#eef1d6] group hover:bg-[#f3f5e1] transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-8 h-8 bg-white border border-[#e2e7c3] rounded-[9px] flex items-center justify-center text-[#2C5282] shadow-sm">
                                                    <FileText className="w-4 h-4" strokeWidth={2.5} />
                                                </div>
                                                <div className="max-w-[140px]">
                                                    <p className="text-[13px] font-bold text-slate-900 mb-0.5 truncate">{doc.file_name}</p>
                                                    <p className="text-[9px] font-bold text-[#668E42] tracking-wider uppercase">{doc.status || 'VERIFIED'}</p>
                                                </div>
                                            </div>
                                            <button className="text-[#a5b487] group-hover:text-[#668E42] transition-colors pr-2">
                                                <Download className="w-4 h-4 stroke-[2.5]" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                                        <p className="text-slate-400 text-xs italic">No documents uploaded yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={goToApplications}
                            className="w-full py-3.5 bg-[#F8F9EC] hover:bg-[#eaeebb] text-[#5d8339] text-[13px] font-bold rounded-[14px] flex items-center justify-center gap-2 border border-[#dce3bc] transition-all hover:shadow-sm active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" /> Manage Documents
                        </button>
                    </div>

                    {/* APPLICATIONS CARD */}
                    <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Applications</h2>
                                <History className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="space-y-6 mb-8 px-1">
                                {history.length > 0 ? (
                                    history.slice(0, 3).map((app, i) => (
                                        <div key={i} className="relative pl-6">
                                            <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${app.application_status === 'approved' ? 'bg-[#B3D68B]' : app.application_status === 'rejected' ? 'bg-[#D03027]' : 'bg-[#18395B]'}`}></div>
                                            <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">
                                                {app.date_submitted ? new Date(app.date_submitted).toLocaleDateString() : "Recent Application"}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate max-w-[180px]">
                                                {app.accommodation?.name || "Application"} ({app.application_status ? app.application_status.charAt(0).toUpperCase() + app.application_status.slice(1) : "Pending"})
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No recent applications found.</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={goToAccommodations}
                            className="w-full py-3.5 bg-white hover:bg-slate-50 text-[#1f3d5f] border border-[#dce3bc] text-[13px] font-extrabold rounded-[14px] transition-all hover:border-[#cfd8df] active:scale-[0.98]"
                        >
                            Start New Application
                        </button>
                    </div>
                </div>

                {/* BOTTOM BANNER */}
                <div className="flex flex-col md:flex-row gap-0 rounded-[24px] overflow-hidden shadow-sm h-auto md:h-[220px]">
                    <div className="w-full md:w-[45%] bg-slate-800 relative min-h-[220px] md:min-h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#112F40]/90 to-transparent z-10"></div>
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80 mix-blend-luminosity"
                            style={{ backgroundImage: "url('https://international.uplb.edu.ph/wp-content/uploads/2022/02/M40A9936-min-scaled.jpg')" }}
                        ></div>

                        <div className="absolute bottom-7 left-8 right-8 z-20">
                            <h3 className="text-white font-bold text-[22px] mb-0.5 tracking-tight">{dormName !== "No Active Residency" ? dormName : "Campus Living"}</h3>
                            <p className="text-white/80 text-[11px] font-medium tracking-wide">University of the Philippines Los Baños</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#F8F9EC] p-8 md:p-10 flex flex-col justify-center border-l-4 border-[#123151] relative">
                        <h2 className="text-[#103050] text-[26px] md:text-[28px] font-extrabold italic mb-5 leading-tight tracking-tight">
                            "Pahingahan Para sa Pangarap"
                        </h2>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-[95%]">
                            At Elbnb, we don't just provide housing; we curate an environment where your academic excellence meets premium living. Your journey this semester is ours too.
                        </p>
                    </div>
                </div>
            </div>

            {/* CONFIRMATION MODAL */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                            <Calendar className="w-7 h-7 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">Confirm Extension of Stay</DialogTitle>
                        <DialogDescription className="text-slate-500 text-[15px] font-medium leading-relaxed pt-2">
                            By confirming, you are applying to extend your stay for the next semester. Please ensure your records and documents are updated to avoid delays in processing.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 gap-3 sm:flex-row flex-col">
                        <Button
                            variant="outline"
                            disabled={isSubmittingExtension}
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="flex-1 py-6 rounded-2xl border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmittingExtension}
                            onClick={handleConfirmExtension}
                            className="flex-1 py-6 rounded-2xl bg-[#668E42] hover:bg-[#557F44] text-white font-bold text-[13px] shadow-lg shadow-[#668E42]/20"
                        >
                            {isSubmittingExtension ? "Processing..." : "Confirm Extension"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
