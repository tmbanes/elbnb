"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { X, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
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

export default function ApplicationList({
    onSelect,
}: {
    onSelect: (id: string) => void;
}) {
    const supabase = getSupabaseBrowserClient();

    // Data State
    const [applications, setApplications] = useState<Application[]>([]);
    const [accommodations, setAccommodations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter States
    const [status, setStatus] = useState("all");
    const [accommodation, setAccommodation] = useState("all");
    const [period, setPeriod] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [openFilters, setOpenFilters] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<string[]>([]);

    const rowsPerPage = 10;

    // Fetch Accommodations for Filter
    useEffect(() => {
        async function fetchAccommodations() {
            const { data, error } = await supabase
                .from("accommodation")
                .select("accommodation_id, name, accommodation_type");

            if (!error && data) setAccommodations(data);
        }
        fetchAccommodations();
    }, []);

    // Fetch Applications based on filters
    useEffect(() => {
        fetchApplications();
        setPage(1);
    }, [status, accommodation, period, search]);

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

        // Search Filter (ID only for now as per original code, could be extended)
        if (search.trim() !== "") {
            query = query.ilike("application_id", `%${search}%`);
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

    // Derived State for Pagination
    const filteredApplication = applications; // Filtering is done server-side now
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

    const toggleSelection = (id: string) => {
        setSelectedApplication((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedApplication.length === paginated.length && paginated.length > 0) {
            setSelectedApplication([]);
        } else {
            setSelectedApplication(paginated.map(app => app.application_id));
        }
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
        approved: { class: "bg-green-100 text-green-700 border-green-200" },
        rejected: { class: "bg-red-100 text-red-700 border-red-200" },
        cancelled: { class: "bg-rose-100 text-rose-700 border-rose-200" },
        waitlisted: { class: "bg-slate-100 text-slate-700 border-slate-200" },
        pending_admin: { class: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
        pending_payment: { class: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
        pending_dorm_manager: { class: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
    };

    return (
        <div className="p-4 bg-[#F6F8D5] text-[#44291B] space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-[32px] font-bold text-[#44291B]">Applications</h1>
                <p className="text-sm text-[#44291B]/70">
                    Overview of all tenant applications, statuses, and review decisions.
                </p>
            </div>

            {/* FILTER BAR */}
            <Card className="bg-[#FDFFF4] shadow-md border border-[#e8e2d6] p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-[#44291B]">Filters</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpenFilters(!openFilters)}
                        className="h-7 w-7"
                    >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", openFilters && "rotate-180")} />
                    </Button>
                </div>

                {openFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#44291B] uppercase">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-9 bg-white border-[#e8e2d6]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {statusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#44291B] uppercase">Accommodation</label>
                            <Select value={accommodation} onValueChange={setAccommodation}>
                                <SelectTrigger className="h-9 bg-white border-[#e8e2d6]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Properties</SelectItem>
                                    {accommodations.map((acc) => (
                                        <SelectItem key={acc.accommodation_id} value={acc.accommodation_id}>{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#44291B] uppercase">Period</label>
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="h-9 bg-white border-[#e8e2d6]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="semestral">Last 6 Months</SelectItem>
                                    <SelectItem value="annual">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#44291B] uppercase">Search ID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="App ID..."
                                    className="pl-9 h-9 bg-white border-[#e8e2d6]"
                                />
                            </div>
                        </div>

                        <Button onClick={resetFilters} variant="outline" className="h-9 border-red-200 text-red-600 hover:bg-red-50">
                            <X className="w-4 h-4 mr-2" /> Reset
                        </Button>
                    </div>
                )}
            </Card>

            {/* TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedApplication.length === paginated.length && paginated.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Tenant / Property</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Student ID #</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Application Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-slate-100">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-6 bg-slate-100 rounded" /></td>
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No applications found.</td>
                                </tr>
                            ) : (
                                paginated.map((app) => {
                                    const applicantName = app.users ? `${app.users.first_name} ${app.users.last_name}` : "Unknown Applicant";
                                    const studentNum = (app.users?.student as any)?.student_num ?? "N/A";
                                    const status = app.application_status.toLowerCase();

                                    return (
                                        <tr
                                            key={app.application_id}
                                            onClick={() => onSelect(app.application_id)}
                                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedApplication.includes(app.application_id)}
                                                    onChange={() => toggleSelection(app.application_id)}
                                                    className="rounded border-slate-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{applicantName}</p>
                                                <p className="text-xs text-slate-500">{app.accommodation?.name || "Unassigned"}</p>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{studentNum}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {app.date_submitted ? new Date(app.date_submitted).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                                                    statusConfig[status]?.class || "bg-gray-100 text-gray-600"
                                                )}>
                                                    {app.application_status.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="ghost" className="text-[#264384] hover:bg-[#ebf2f4]">View</Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                        Showing {paginated.length} of {filteredApplication.length} applications
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-8 bg-white"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <div className="flex items-center px-3 text-xs font-bold text-slate-600">
                            {page} / {totalPages || 1}
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="h-8 bg-white"
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
