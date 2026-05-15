"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { X, ChevronDown, ChevronLeft, ChevronRight, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/ui-utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Application = {
    application_id: string;
    application_status: string;
    date_submitted: string | null;
    user_id: string;
    unit_id: string | null;
    preferred_unit_type: string | null;
    preferred_accommodation_id: string | null;
    users?: {
        user_id: string;
        first_name: string;
        last_name: string;
        student?: {
            student_num: string;
        };
    };
    accommodation?: {
        name: string;
    };
    unit?: {
        unit_id: string;
    };
};

import { useRealtimeSync } from "@/lib/realtime-sync";

export default function ApplicationList({
    onSelect,
    selectedId,
    initialData,
}: {
    onSelect: (id: string) => void;
    selectedId: string | null;
    initialData: any;
}) {
    const supabase = getSupabaseBrowserClient();
    
    // Sync applications in real-time
    useRealtimeSync('accommodation_application', undefined, '*', () => {
        fetchApplications();
    });

    // Data State
    const [applications, setApplications] = useState<Application[]>(initialData.applications);
    const [accommodations, setAccommodations] = useState<any[]>(initialData.accommodations);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [status, setStatus] = useState("all");
    const [accommodation, setAccommodation] = useState("all");
    const [period, setPeriod] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [openFilters, setOpenFilters] = useState(true);

    const rowsPerPage = 5;


    // Fetch Applications based on filters (skip initial)
    const [isInitial, setIsInitial] = useState(true);
    useEffect(() => {
        if (isInitial) {
            setIsInitial(false);
            return;
        }
        fetchApplications();
        setPage(1);
    }, [status, accommodation, period]); // Removed 'search' from dependencies to use client-side filtering

    async function fetchApplications() {
        setLoading(true);
        let query = supabase
            .from("accommodation_application")
            .select(`
                application_id,
                application_status,
                date_submitted,
                user_id,
                unit_id,
                preferred_unit_type,
                preferred_accommodation_id,
                users (
                    user_id,
                    first_name,
                    last_name,
                    student:student (
                        student_num
                    )
                ),
                accommodation:preferred_accommodation_id (
                    name
                ),
                unit:unit_id (
                    unit_id
                )
            `);

        // Status Filter
        if (status !== "all") {
            query = query.eq("application_status", status);
        }

        // Accommodation Filter
        if (accommodation !== "all") {
            query = query.eq("preferred_accommodation_id", accommodation);
        }

        // Period Filter
        if (period !== "all") {
            const now = new Date();
            if (period === "semestral") {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(now.getMonth() - 6);
                query = query.gte("date_submitted", sixMonthsAgo.toISOString());
            } else if (period === "annual") {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                query = query.gte("date_submitted", oneYearAgo.toISOString());
            }
        }

        const { data, error } = await query.order("date_submitted", { ascending: false });

        if (error) {
            console.error("Error fetching applications:", error);
            setLoading(false);
            return;
        }

        // Flatten data if Supabase returns arrays for single joins
        const mappedData = (data as any[])?.map((app) => ({
            ...app,
            users: Array.isArray(app.users) ? app.users[0] : app.users,
            accommodation: Array.isArray(app.accommodation) ? app.accommodation[0] : app.accommodation,
            unit: Array.isArray(app.unit) ? app.unit[0] : app.unit,
        }));

        setApplications(mappedData ?? []);
        setLoading(false);
    }

    // Derived State for Pagination - Client-side search for better UX (Name, Student ID, App ID)
    const filteredApplication = applications.filter(app => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        const firstName = app.users?.first_name?.toLowerCase() || "";
        const lastName = app.users?.last_name?.toLowerCase() || "";
        const fullName = `${firstName} ${lastName}`;
        const studentNum = (app.users?.student as any)?.student_num?.toLowerCase() || "";
        const appId = app.application_id?.toLowerCase() || "";
        
        return fullName.includes(s) || 
               firstName.includes(s) || 
               lastName.includes(s) || 
               studentNum.includes(s) || 
               appId.includes(s);
    });

    const paginated = filteredApplication.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );
    const totalPages = Math.ceil(filteredApplication.length / rowsPerPage);

    // Handlers
    const resetFilters = () => {
        setStatus("all");
        setAccommodation("all");
        setPeriod("all");
        setSearch("");
    };

    const statusOptions = [
        { value: "pending_admin", label: "Pending Admin" },
        { value: "pending_dorm_manager", label: "Pending Review" },
        { value: "pending_payment", label: "Pending Payment" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "cancelled", label: "Cancelled" },
        { value: "waitlisted", label: "Waitlisted" }
    ];

    const statusConfig: any = {
        approved: { class: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        rejected: { class: "bg-rose-50 text-rose-700 border-rose-100" },
        cancelled: { class: "bg-slate-50 text-slate-700 border-slate-100" },
        waitlisted: { class: "bg-amber-50 text-amber-700 border-amber-100" },
        pending_admin: { class: "bg-sky-50 text-sky-700 border-sky-100" },
        pending_payment: { class: "bg-purple-50 text-purple-700 border-purple-100" },
        pending_dorm_manager: { class: "bg-amber-50 text-amber-700 border-amber-100" },
    };

    return (
        <div className="p-4 bg-[#F6F8D5] text-[#44291B] space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
                    Applications
                </h1>
                <p className="text-sm text-[#44291B] font-medium mt-1">
                    Overview of all tenant applications, statuses, and review decisions.
                </p>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-row items-center justify-between gap-2 bg-[#FDFFF4] p-3 rounded-2xl border border-[#e8e2d6] shadow-sm mt-4 overflow-x-auto scrollbar-hide">

                {/* Search */}
                <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 min-w-[140px] max-w-xs">
                    <div className="pl-3 flex items-center justify-center text-[#44291B]/50">
                        <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search..."
                        className="w-full px-2 py-1.5 bg-transparent text-sm outline-none text-[#44291B] placeholder:text-[#44291B]/50 font-medium"
                    />
                </div>

                <div className="flex flex-row items-center gap-2 flex-nowrap shrink-0 ml-auto">
                    {/* Status */}
                    <div className="flex items-center gap-2 text-sm px-2 rounded-xl border border-[#e8e2d6] shrink-0">
                        <Filter className="w-3.5 h-3.5 text-[#44291B]/50" />
                        <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                            <SelectTrigger className="w-[100px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-bold h-9 text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="z-[70] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] text-[#44291B]">
                                <SelectItem value="all" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Statuses</SelectItem>
                                {statusOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Accommodation */}
                    <div className="flex items-center gap-2 text-sm px-2 rounded-xl border border-[#e8e2d6] shrink-0">
                        <Filter className="w-3.5 h-3.5 text-[#44291B]/50" />
                        <Select value={accommodation} onValueChange={(val) => { setAccommodation(val); setPage(1); }}>
                            <SelectTrigger className="w-[110px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-bold h-9 text-xs">
                                <SelectValue placeholder="Property" />
                            </SelectTrigger>
                            <SelectContent className="z-[70] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] text-[#44291B]">
                                <SelectItem value="all" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Properties</SelectItem>
                                {accommodations.map((acc) => (
                                    <SelectItem key={acc.accommodation_id} value={acc.accommodation_id} className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Period */}
                    <div className="flex items-center gap-2 text-sm px-2 rounded-xl border border-[#e8e2d6] shrink-0">
                        <Filter className="w-3.5 h-3.5 text-[#44291B]/50" />
                        <Select value={period} onValueChange={(val) => { setPeriod(val); setPage(1); }}>
                            <SelectTrigger className="w-[90px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-bold h-9 text-xs">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent className="z-[70] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] text-[#44291B]">
                                <SelectItem value="all" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Time</SelectItem>
                                <SelectItem value="semestral" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Last 6 Months</SelectItem>
                                <SelectItem value="annual" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Last Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reset */}
                    <Button
                        onClick={resetFilters}
                        variant="ghost"
                        className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors shrink-0"
                        title="Reset Filters"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-[#FDFFF4] rounded-2xl border border-[#e8e2d6] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <colgroup>
                            <col className="w-[35%]" />
                            <col className="w-[18%]" />
                            <col className="w-[17%]" />
                            <col className="w-[18%]" />
                            <col className="w-[12%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-[#e8e2d6] bg-[#FDFFF4]">
                                <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Tenant / Property</th>
                                <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Student ID #</th>
                                <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Application Date</th>
                                <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Status</th>
                                <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-[#e8e2d6]/60">
                                        <td colSpan={5} className="px-6 py-4"><div className="h-6 bg-[#F6F8D5] rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#44291B]/40 font-bold">No applications found.</td>
                                </tr>
                            ) : (
                                paginated.map((app) => {
                                    const applicantName = app.users ? `${app.users.first_name} ${app.users.last_name}` : "Unknown Applicant";
                                    const studentNum = (app.users?.student as any)?.student_num ?? "N/A";
                                    const status = app.application_status.toLowerCase();
                                    const isSelected = app.application_id === selectedId;

                                    return (
                                        <tr
                                            key={app.application_id}
                                            onClick={() => onSelect(app.application_id)}
                                            className={cn(
                                                "border-b border-[#e8e2d6]/60 last:border-0 cursor-pointer transition-colors",
                                                isSelected ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]"
                                            )}
                                        >
                                            <td className="py-4 px-5">
                                                <p className="text-sm font-bold text-[#44291B]">{applicantName}</p>
                                                <p className="text-xs text-[#44291B]/50">{app.accommodation?.name || "Unassigned"}</p>
                                            </td>
                                            <td className="py-4 px-3 font-mono text-xs text-[#44291B] font-medium">{studentNum}</td>
                                            <td className="py-4 px-3 text-xs text-[#44291B] font-medium">
                                                {app.date_submitted ? new Date(app.date_submitted).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap",
                                                    statusConfig[status]?.class || "bg-gray-100 text-gray-600 border-gray-200"
                                                )}>
                                                    {status === "pending_dorm_manager" ? "Pending Manager" : app.application_status.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="p-2 text-slate-500 bg-slate-100/50 hover:text-[#264384] hover:bg-[#AFBFE1] rounded-xl h-9 w-9 p-0 flex items-center justify-center ml-auto transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 bg-[#FDFFF4] border-t border-[#cfd6e4]">
                    <p className="text-xs font-bold text-slate-500">
                        Showing {paginated.length} of {filteredApplication.length} applications
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
    );
}
