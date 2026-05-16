"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/ui-utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Application } from "@/lib/actions/manager-application-actions";

export default function ManagerApplicationList({
    applications,
    loading,
    onSelect,
    selectedId,
    accommodationName,
}: {
    applications: Application[];
    loading: boolean;
    onSelect: (app: Application) => void;
    selectedId: string | null;
    accommodationName: string;
}) {
    // Filter States
    const [statusFilter, setStatusFilter] = useState("all");
    const [period, setPeriod] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [statusFilter, period, search]);

    // Apply client-side filtering
    const filteredApplications = applications.filter((app) => {
        // Status Filter
        if (statusFilter !== "all" && app.application_status !== statusFilter) {
            return false;
        }

        // Search Filter (Name or Email)
        if (search.trim() !== "") {
            const fullName = `${app.users?.first_name} ${app.users?.last_name}`.toLowerCase();
            const email = (app.users?.email || "").toLowerCase();
            const s = search.toLowerCase();
            if (!fullName.includes(s) && !email.includes(s) && !app.application_id.includes(s)) {
                return false;
            }
        }

        // Period Filter
        if (period !== "all") {
            const now = new Date();
            const submittedDate = new Date(app.date_submitted);
            if (period === "semestral") {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(now.getMonth() - 6);
                if (submittedDate < sixMonthsAgo) return false;
            } else if (period === "annual") {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                if (submittedDate < oneYearAgo) return false;
            }
        }

        return true;
    });

    const paginated = filteredApplications.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );
    const totalPages = Math.ceil(filteredApplications.length / rowsPerPage);

    const resetFilters = () => {
        setStatusFilter("all");
        setPeriod("all");
        setSearch("");
    };

    const statusOptions = [
        { value: "pending_dorm_manager", label: "Pending Your Review" },
        { value: "pending_admin", label: "Forwarded to Admin" },
        { value: "rejected", label: "Rejected" },
    ];

    const statusConfig: any = {
        pending_dorm_manager: { class: "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" },
        pending_admin: { class: "bg-sky-50 text-sky-700 border-sky-100" },
        rejected: { class: "bg-rose-50 text-rose-700 border-rose-100" },
        approved: { class: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    };

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
                    Applications
                </h1>
                <p className="text-sm text-[#44291B] font-medium mt-1">
                    {accommodationName ? `Reviewing applications for ${accommodationName}` : "Manage your property applications."}
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
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search applicant..."
                        className="w-full px-2 py-1.5 bg-transparent text-sm outline-none text-[#44291B] placeholder:text-[#44291B]/50 font-medium"
                    />
                </div>

                <div className="flex flex-row items-center gap-2 flex-nowrap shrink-0 ml-auto">
                    {/* Status */}
                    <div className="flex items-center gap-2 text-sm px-2 rounded-xl border border-[#e8e2d6] shrink-0">
                        <Filter className="w-3.5 h-3.5 text-[#44291B]/50" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[120px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-bold h-9 text-xs">
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

                    {/* Period */}
                    <div className="flex items-center gap-2 text-sm px-2 rounded-xl border border-[#e8e2d6] shrink-0">
                        <Filter className="w-3.5 h-3.5 text-[#44291B]/50" />
                        <Select value={period} onValueChange={setPeriod}>
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
                                <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Applicant</th>
                                <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Unit Type</th>
                                <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Date Submitted</th>
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
                                    const applicantName = `${app.users?.first_name} ${app.users?.last_name}`;
                                    const status = app.application_status.toLowerCase();
                                    const isSelected = app.application_id === selectedId;

                                    return (
                                        <tr
                                            key={app.application_id}
                                            onClick={() => onSelect(app)}
                                            className={cn(
                                                "border-b border-[#e8e2d6]/60 last:border-0 cursor-pointer transition-colors",
                                                isSelected ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]"
                                            )}
                                        >
                                            <td className="py-4 px-5">
                                                <p className="text-sm font-bold text-[#44291B]">{applicantName}</p>
                                                <p className="text-xs text-[#44291B]/50">{app.users?.email}</p>
                                            </td>
                                            <td className="py-4 px-3 text-xs text-[#44291B] font-medium capitalize">{app.preferred_unit_type.replace(/_/g, ' ')}</td>
                                            <td className="py-4 px-3 text-xs text-[#44291B] font-medium">
                                                {new Date(app.date_submitted).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap",
                                                    statusConfig[status]?.class || "bg-gray-100 text-gray-600 border-gray-200"
                                                )}>
                                                    {status === "pending_dorm_manager" ? "Pending Review" : status.replace(/_/g, " ")}
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
                        Showing {paginated.length} of {filteredApplications.length} applications
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-50 hover:bg-[#E3E3E3] transition-colors h-8"
                        >
                            Prev
                        </button>
                        <div className="flex items-center px-3 text-xs font-bold text-slate-700">
                            {page} / {totalPages || 1}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
                            disabled={page === totalPages || totalPages === 0}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-50 hover:bg-[#E3E3E3] transition-colors h-8"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
