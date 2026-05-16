"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { X, ChevronDown, ChevronLeft, ChevronRight, Search, Filter, Eye, Building2, AlertCircle, Plus, Trash2, Receipt } from "lucide-react";
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

import { Archivo, Archivo_Black } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Batch Selection Handlers
    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const app = applications.find(a => a.application_id === id);
        if (!app || !["pending_dorm_manager", "pending_admin"].includes(app.application_status)) return;

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const batchableApps = paginated.filter(app => ["pending_dorm_manager", "pending_admin"].includes(app.application_status));
        const batchableIds = batchableApps.map(app => app.application_id);

        if (batchableIds.length === 0) return;

        const allBatchableSelected = batchableIds.every(id => selectedIds.has(id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allBatchableSelected) {
                batchableIds.forEach(id => next.delete(id));
            } else {
                batchableIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const handleBatchAction = async (action: "approve" | "reject" | "pending_payment") => {
        if (selectedIds.size === 0) return;
        setLoading(true);
        try {
            // Sequential processing to match existing API
            const promises = Array.from(selectedIds).map(id => {
                // For 'approve', it usually needs a unit_id, so we might want to skip batch approve if unit is needed
                // But for 'reject' or 'pending_payment' (move to billing), it's fine.
                const res = fetch("/api/applications", {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ application_id: id, action }),
                });
                return res;
            });
            await Promise.all(promises);

            // Refresh
            fetchApplications();
            setSelectedIds(new Set());
        } catch (e) {
        } finally {
            setLoading(false);
        }
    };

    const rowsPerPage = 5;


    // Fetch Applications based on filters (skip initial)
    const [isInitial, setIsInitial] = useState(true);
    useEffect(() => {
        if (initialData?.applications) {
            const mapped = initialData.applications.map((app: any) => {
                const user = Array.isArray(app.users) ? app.users[0] : app.users;
                if (user && user.student && Array.isArray(user.student)) {
                    user.student = user.student[0];
                }
                return {
                    ...app,
                    users: user,
                    accommodation: Array.isArray(app.accommodation) ? app.accommodation[0] : app.accommodation,
                    unit: Array.isArray(app.unit) ? app.unit[0] : app.unit,
                };
            });
            setApplications(mapped);
        }
    }, [initialData]);

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

        try {
            // 1. Construct the URL with search parameters based on your component filters
            const queryParams = new URLSearchParams({
                status: status,                 // e.g., "pending_admin" or "all"
                accommodation: accommodation,   // e.g., "some-uuid-here" or "all"
                period: period                  // e.g., "semestral", "annual", or "all"
            });

            // 2. Make the request to your Next.js API route
            const response = await fetch(`/api/admin/applications?${queryParams.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch applications");
            }

            const data = await response.json();

            // 3. Set the applications state (the server already flattened it)
            setApplications(data.applications ?? []);

        } catch (err: any) {
            console.error("Frontend fetch error:", err.message);
            // Optional: Set an error state here to show a toast or alert to the user
        } finally {
            setLoading(false);
        }
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

    const [isExiting, setIsExiting] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchActionType, setBatchActionType] = useState<string | null>(null);
    const [availableUnits, setAvailableUnits] = useState<Record<string, any[]>>({});
    const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [batchError, setBatchError] = useState<string | null>(null);
    const [errorAppId, setErrorAppId] = useState<string | null>(null);
    const [batchStep, setBatchStep] = useState<1 | 2>(1);

    // Batch Invoice State
    const [batchInvoiceDueDate, setBatchInvoiceDueDate] = useState("");
    const [batchInvoiceNote, setBatchInvoiceNote] = useState("");
    const [batchInvoiceItems, setBatchInvoiceItems] = useState<Array<{ kind: string; amount: string }>>([{ kind: "first_rental", amount: "" }]);

    const invoiceKindOptions = [
        { value: "first_rental", label: "Room Rent" },
        { value: "security_deposit", label: "Security Deposit" },
        { value: "reservation_fee", label: "Reservation Fee" },
        { value: "other", label: "Other" },
    ];

    const addInvoiceItem = () => setBatchInvoiceItems(prev => [...prev, { kind: "security_deposit", amount: "" }]);
    const removeInvoiceItem = (i: number) => setBatchInvoiceItems(prev => prev.filter((_, idx) => idx !== i));
    const updateInvoiceItem = (i: number, field: "kind" | "amount", value: string) =>
        setBatchInvoiceItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

    const resetBatchModal = () => {
        setShowBatchModal(false);
        setBatchError(null);
        setErrorAppId(null);
        setBatchStep(1);
        setBatchInvoiceDueDate("");
        setBatchInvoiceNote("");
        setBatchInvoiceItems([{ kind: "first_rental", amount: "" }]);
    };

    const handleCloseSelection = () => {
        setSelectedIds(new Set());
        setSelectedUnits({});
        setBatchError(null);
        setErrorAppId(null);
        setBatchStep(1);
        setBatchInvoiceDueDate("");
        setBatchInvoiceNote("");
        setBatchInvoiceItems([{ kind: "first_rental", amount: "" }]);
    };

    const triggerBatchAction = async (action: string) => {
        setBatchActionType(action);

        // Fetch units for selected applications
        const selectedApps = applications.filter(app => selectedIds.has(app.application_id));
        const propertyIds = Array.from(new Set(selectedApps.map(app => app.preferred_accommodation_id).filter(Boolean) as string[]));

        if (propertyIds.length > 0) {
            setLoading(true);
            try {
                const unitMap: Record<string, any[]> = {};
                await Promise.all(propertyIds.map(async (pid) => {
                    const { data, error } = await supabase
                        .from('unit')
                        .select('*')
                        .eq('accommodation_id', pid)
                        .eq('unit_status', 'active');

                    if (!error) {
                        const available = (data || []).filter(u => u.current_occupancy < u.max_occupancy);
                        unitMap[pid] = available;
                    }
                }));
                setAvailableUnits(unitMap);

                // Pre-select units if they exist (from manager forward)
                const initialSelectedUnits: Record<string, string> = {};
                selectedApps.forEach(app => {
                    if (app.unit_id) {
                        initialSelectedUnits[app.application_id] = app.unit_id;
                    }
                });
                setSelectedUnits(initialSelectedUnits);

            } catch (err) {
            } finally {
                setLoading(false);
            }
        }

        setShowBatchModal(true);
    };

    const confirmBatchAction = async () => {
        if (!batchActionType) return;



        // VALIDATION: Check all applications have a unit assigned (for approve actions)
        if (batchActionType === "approve" || batchActionType === "pending_payment") {
            const missingUnit = selectedAppsData.find(app => !selectedUnits[app.application_id]);
            if (missingUnit) {
                const name = missingUnit.users ? `${missingUnit.users.first_name} ${missingUnit.users.last_name}` : "an applicant";
                setBatchError(`${name} needs a unit assigned before you can proceed.`);
                setErrorAppId(missingUnit.application_id);
                return;
            }
        }

        // VALIDATION: Invoice fields required for approve action
        if (batchActionType === "approve" || batchActionType === "pending_payment") {
            if (!batchInvoiceDueDate) {
                setBatchError("Please set a due date for the invoice before proceeding.");
                return;
            }
            const validItems = batchInvoiceItems.filter(item => Number(item.amount) > 0);
            if (validItems.length === 0) {
                setBatchError("Add at least one billing item with an amount greater than 0.");
                return;
            }
            if (batchInvoiceItems.some(item => item.amount !== "" && Number(item.amount) <= 0)) {
                setBatchError("All billing item amounts must be greater than 0.");
                return;
            }
        }

        setBatchError(null);
        setErrorAppId(null);
        resetBatchModal();
        setLoading(true);
        try {
            const ids = Array.from(selectedIds);

            // Step 1: Approve + assign unit for each application
            const patchResults = await Promise.all(ids.map(id =>
                fetch("/api/applications", {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ application_id: id, action: batchActionType, unit_id: selectedUnits[id] }),
                }).then(async res => ({ ok: res.ok, body: await res.json() }))
            ));

            const failedPatch = patchResults.find(r => !r.ok);
            if (failedPatch) {
                setBatchError(failedPatch.body?.error ?? "Failed to process one or more applications.");
                return;
            }

            // Step 2: Send individual invoices — Room Rent uses each unit's rental_fee
            if (batchActionType === "approve" || batchActionType === "pending_payment") {
                const postResults = await Promise.all(ids.map(id => {
                    const app = selectedAppsData.find(a => a.application_id === id);
                    const unitId = selectedUnits[id];
                    const units = availableUnits[app?.preferred_accommodation_id || ""] || [];
                    const unit = units.find((u: any) => u.unit_id === unitId);
                    const rentalFee = unit?.rental_fee;

                    const items = batchInvoiceItems
                        .map(item => {
                            if (item.kind === "first_rental") {
                                const amount = rentalFee ? Number(rentalFee) : Number(item.amount);
                                return { kind: item.kind, amount, required_to_secure_slot: true };
                            }
                            return { kind: item.kind, amount: Number(item.amount), required_to_secure_slot: true };
                        })
                        .filter(item => item.amount > 0);

                    return fetch("/api/applications", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            application_id: id,
                            due_date: batchInvoiceDueDate,
                            items,
                            note: batchInvoiceNote || "",
                            unit_id: unitId,
                        }),
                    }).then(async res => ({ ok: res.ok, body: await res.json() }));
                }));

                const failedPost = postResults.find(r => !r.ok);
                if (failedPost) {
                    setBatchError(failedPost.body?.error ?? "Applications approved but invoice failed to send.");
                    fetchApplications();
                    return;
                }
            }

            fetchApplications();
            resetBatchModal();
            setSelectedIds(new Set());
            setSelectedUnits({});
        } catch (e) {
        } finally {
            setLoading(false);
            setBatchActionType(null);
        }
    };

    const selectedAppsData = applications.filter(app => selectedIds.has(app.application_id));

    return (
        <div className="p-4 bg-[#F6F8D5] text-[#44291B] space-y-6 relative">
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
            <div className="bg-[#FDFFF4] rounded-2xl border border-[#e8e2d6] overflow-hidden shadow-sm relative flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <colgroup>
                            <col className="w-[50px]" />
                            <col className="w-[38%]" />
                            <col className="w-[22%]" />
                            <col className="w-[22%]" />
                            <col className="w-[18%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-[#e8e2d6] bg-[#FDFFF4]">
                                <th className="py-3 px-3">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={
                                                paginated.filter(app => ["pending_dorm_manager", "pending_admin"].includes(app.application_status)).length > 0 &&
                                                paginated.filter(app => ["pending_dorm_manager", "pending_admin"].includes(app.application_status)).every(app => selectedIds.has(app.application_id))
                                            }
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-[#e8e2d6] text-[#264384] focus:ring-[#264384] cursor-pointer disabled:opacity-30"
                                            disabled={paginated.filter(app => ["pending_dorm_manager", "pending_admin"].includes(app.application_status)).length === 0}
                                        />
                                    </div>
                                </th>
                                <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Tenant / Property</th>
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
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#44291B]/40 font-bold italic uppercase tracking-widest text-[10px]">
                                        {accommodations.length === 0 ? "No accommodations found / assigned to your account." : "No applications found."}
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((app) => {
                                    const applicantName = app.users ? `${app.users.first_name} ${app.users.last_name}` : "Unknown Applicant";
                                    const studentNum = (app.users?.student as any)?.student_num ?? "N/A";
                                    const status = app.application_status.toLowerCase();
                                    const isSelected = app.application_id === selectedId;
                                    const isBatchSelected = selectedIds.has(app.application_id);

                                    return (
                                        <tr
                                            key={app.application_id}
                                            onClick={() => onSelect(app.application_id)}
                                            className={cn(
                                                "border-b border-[#e8e2d6]/60 last:border-0 cursor-pointer transition-colors",
                                                isSelected ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]",
                                                isBatchSelected && "bg-[#F6F8D5]/50"
                                            )}
                                        >
                                            <td className="py-4 px-3">
                                                <div className="flex items-center justify-center">
                                                    {["pending_dorm_manager", "pending_admin"].includes(app.application_status) ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={isBatchSelected}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => toggleSelect(app.application_id, e as any)}
                                                            className="w-4 h-4 rounded border-[#e8e2d6] text-[#264384] focus:ring-[#264384] cursor-pointer transition-all"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-4 h-4 rounded border-2 border-[#e8e2d6]/60 bg-slate-100/50 cursor-not-allowed flex items-center justify-center"
                                                            title="Bulk action not available for this status"
                                                        >
                                                            <div className="w-1.5 h-[1.5px] bg-[#e8e2d6] rounded-full" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <p className="text-sm font-bold text-[#44291B]">{applicantName}</p>
                                                <p className="text-xs text-[#44291B]/50">{app.accommodation?.name || "Unassigned"}</p>
                                            </td>
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
            {/* BATCH ACTION BAR - FIXED BOTTOM ISLAND */}
            {selectedIds.size > 0 && !showBatchModal && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#264384]/85 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 flex items-center justify-between z-[100] border border-white/10 backdrop-blur-md transition-all duration-300">
                    <div className="flex items-center gap-4 pl-2">
                        <div className="bg-white/20 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner">
                            {selectedIds.size}
                        </div>
                        <div className="flex flex-col">
                            <span className={cn("text-base tracking-tight leading-none uppercase font-bold", archivo.className)}>Applications Selected</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pr-2">
                        <Button
                            onClick={() => handleBatchAction("reject")}
                            variant="ghost"
                            className="bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs h-11 px-6 rounded-2xl transition-all shadow-lg active:scale-95 group"
                            disabled={loading}
                        >
                            Reject All
                        </Button>
                        <Button
                            onClick={() => triggerBatchAction("pending_payment")}
                            className={cn("bg-white text-[#264384] hover:bg-gray-100 font-bold text-xs h-11 px-8 rounded-2xl shadow-xl transition-all active:scale-95", archivo.className)}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Approve & Assign"}
                        </Button>
                        <div className="w-[1px] h-8 bg-white/10 mx-2" />
                        <button
                            onClick={handleCloseSelection}
                            className="p-2.5 hover:bg-white/10 rounded-full transition-all hover:rotate-90 duration-300"
                            title="Cancel Selection"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            {/* BATCH CONFIRMATION MODAL */}
            {showBatchModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#FDFFF4] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#e8e2d6] animate-in zoom-in-95 duration-300">
                        <div className="p-8 space-y-6">

                            {/* HEADER */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className={cn("text-2xl text-[#44291B]", archivoBlack.className)}>
                                        {batchStep === 1 ? "Assign Units" : "Invoice Configuration"}
                                    </h3>
                                    <p className="text-xs font-bold text-[#44291B]/50 uppercase tracking-widest">
                                        Step {batchStep} of {(batchActionType === "approve" || batchActionType === "pending_payment") ? 2 : 1} &mdash; {selectedIds.size} applications
                                    </p>
                                </div>
                                <button onClick={resetBatchModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-[#44291B]/30" />
                                </button>
                            </div>

                            {/* STEP INDICATOR */}
                            {(batchActionType === "approve" || batchActionType === "pending_payment") && (
                                <div className="flex items-center gap-0">
                                    {/* Step 1 */}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border-2",
                                            batchStep === 1
                                                ? "bg-[#264384] border-[#264384] text-white shadow-lg shadow-[#264384]/30"
                                                : batchStep > 1
                                                    ? "bg-[#264384] border-[#264384] text-white"
                                                    : "bg-white border-[#e8e2d6] text-[#44291B]/30"
                                        )}>
                                            {batchStep > 1 ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : "1"}
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-colors",
                                            batchStep === 1 ? "text-[#264384]" : "text-[#44291B]/30"
                                        )}>Assign Units</span>
                                    </div>

                                    {/* Connector */}
                                    <div className="flex-1 mx-2 mb-4 h-[2px] rounded-full overflow-hidden bg-[#e8e2d6]">
                                        <div className={cn(
                                            "h-full bg-[#264384] transition-all duration-500",
                                            batchStep >= 2 ? "w-full" : "w-0"
                                        )} />
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border-2",
                                            batchStep === 2
                                                ? "bg-[#264384] border-[#264384] text-white shadow-lg shadow-[#264384]/30"
                                                : "bg-white border-[#e8e2d6] text-[#44291B]/30"
                                        )}>
                                            2
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-colors",
                                            batchStep === 2 ? "text-[#264384]" : "text-[#44291B]/30"
                                        )}>Set Invoice</span>
                                    </div>
                                </div>
                            )}

                            {/* STEP 1: UNIT ASSIGNMENT */}
                            {batchStep === 1 && (
                                <div className="max-h-[380px] overflow-y-auto pr-2 scrollbar-hide space-y-4">
                                    {selectedAppsData.map((app) => {
                                        const units = availableUnits[app.preferred_accommodation_id || ""] || [];
                                        const filteredUnits = units.filter(u => u.unit_type === app.preferred_unit_type);
                                        const isRemoving = removingId === app.application_id;

                                        return (
                                            <div
                                                key={app.application_id}
                                                className={cn(
                                                    "transition-all duration-500 ease-in-out origin-top px-2",
                                                    isRemoving ? "max-h-0 opacity-0 mb-0 scale-95 overflow-hidden" : "max-h-[500px] opacity-100 mb-4"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-4 bg-white rounded-2xl border shadow-sm space-y-3 relative group/card transition-all duration-300",
                                                    isRemoving && "translate-x-full",
                                                    errorAppId === app.application_id
                                                        ? "border-rose-300 ring-2 ring-rose-200 bg-rose-50/30"
                                                        : "border-[#e8e2d6]"
                                                )}>
                                                    <button
                                                        onClick={() => {
                                                            setRemovingId(app.application_id);
                                                            setTimeout(() => {
                                                                setSelectedIds(prev => { const next = new Set(prev); next.delete(app.application_id); if (next.size === 0) resetBatchModal(); return next; });
                                                                setSelectedUnits(prev => { const next = { ...prev }; delete next[app.application_id]; return next; });
                                                                setRemovingId(null);
                                                            }, 500);
                                                        }}
                                                        className="absolute top-3 right-3 w-7 h-7 bg-white border border-[#e8e2d6] text-rose-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all hover:bg-rose-50 hover:scale-110 z-10"
                                                        title="Remove from batch"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>

                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-black text-[#44291B]">{app.users ? `${app.users.first_name} ${app.users.last_name}` : "Unknown"}</span>
                                                            {(app.users?.student as any)?.student_num && (
                                                                <span className="text-[10px] font-mono bg-[#264384]/10 text-[#264384] px-1.5 py-0.5 rounded font-bold">{(app.users?.student as any).student_num}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Building2 className="w-3 h-3 text-[#264384]/60" />
                                                            <span className="text-[10px] font-bold text-[#264384] uppercase">{app.accommodation?.name || "No Property"}</span>
                                                        </div>
                                                    </div>

                                                    {(batchActionType === "pending_payment" || batchActionType === "approve") && (
                                                        <div className="space-y-1.5 pt-2 border-t border-[#e8e2d6]/40">
                                                            <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest pl-1">Assign Unit</label>
                                                            <select
                                                                value={selectedUnits[app.application_id] || ""}
                                                                onChange={(e) => {
                                                                    setSelectedUnits(prev => ({ ...prev, [app.application_id]: e.target.value }));
                                                                    if (errorAppId === app.application_id && e.target.value) { setBatchError(null); setErrorAppId(null); }
                                                                }}
                                                                className={cn(
                                                                    "w-full bg-[#F6F8D5]/50 border rounded-xl px-3 py-2 text-xs font-bold text-[#44291B] outline-none focus:ring-2 transition-all",
                                                                    errorAppId === app.application_id && !selectedUnits[app.application_id]
                                                                        ? "border-rose-400 focus:ring-rose-200 bg-rose-50/50"
                                                                        : "border-[#e8e2d6] focus:ring-[#264384]/10"
                                                                )}
                                                            >
                                                                <option value="">Select a unit...</option>
                                                                <optgroup label="Matching Preferred Type">
                                                                    {filteredUnits.map(u => (
                                                                        <option key={u.unit_id} value={u.unit_id}>Unit {u.unit_number} ({u.unit_type.replace(/_/g, " ")})</option>
                                                                    ))}
                                                                </optgroup>
                                                                <optgroup label="Other Available Units">
                                                                    {units.filter(u => u.unit_type !== app.preferred_unit_type).map(u => (
                                                                        <option key={u.unit_id} value={u.unit_id}>Unit {u.unit_number} ({u.unit_type.replace(/_/g, " ")})</option>
                                                                    ))}
                                                                </optgroup>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* STEP 2: INVOICE CONFIGURATION */}
                            {batchStep === 2 && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest pl-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={batchInvoiceDueDate}
                                            onChange={e => setBatchInvoiceDueDate(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            className="w-full bg-[#F6F8D5]/50 border border-[#e8e2d6] rounded-xl px-3 py-2 text-xs font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/10 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest pl-1">Billing Items</label>
                                        {batchInvoiceItems.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <select
                                                    value={item.kind}
                                                    onChange={e => updateInvoiceItem(i, "kind", e.target.value)}
                                                    disabled={item.kind === "first_rental"}
                                                    className="flex-[2] bg-[#F6F8D5]/50 border border-[#e8e2d6] rounded-xl px-3 py-2 text-xs font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {invoiceKindOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                {item.kind === "first_rental" ? (
                                                    <div className="flex-1 flex items-center gap-2 bg-[#264384]/5 border border-[#264384]/20 rounded-xl px-3 py-2">
                                                        <span className="text-xs font-bold text-[#264384]/50">₱</span>
                                                        <span className="text-[10px] font-bold text-[#264384]/60 flex-1">Per unit price</span>
                                                        <span className="text-[9px] bg-[#264384]/10 text-[#264384] px-1.5 py-0.5 rounded font-bold uppercase">Auto</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#44291B]/40">₱</span>
                                                        <input
                                                            type="number" min="0" placeholder="0.00"
                                                            value={item.amount}
                                                            onChange={e => updateInvoiceItem(i, "amount", e.target.value)}
                                                            className="w-full bg-[#F6F8D5]/50 border border-[#e8e2d6] rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/10 transition-all"
                                                        />
                                                    </div>
                                                )}
                                                {batchInvoiceItems.length > 1 ? (
                                                    <button onClick={() => removeInvoiceItem(i)} className="w-8 h-8 flex items-center justify-center text-rose-400 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                ) : (
                                                    <div className="w-8 shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={addInvoiceItem} className="flex items-center gap-1.5 text-[11px] font-bold text-[#264384] hover:text-[#1e3569] transition-colors py-1 pl-1">
                                            <Plus className="w-3.5 h-3.5" />
                                            Add billing item
                                        </button>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest pl-1">Note <span className="normal-case font-medium">(optional)</span></label>
                                        <textarea
                                            value={batchInvoiceNote}
                                            onChange={e => setBatchInvoiceNote(e.target.value)}
                                            placeholder="Internal note for this invoice batch..."
                                            rows={2}
                                            className="w-full bg-[#F6F8D5]/50 border border-[#e8e2d6] rounded-xl px-3 py-2 text-xs font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/10 transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ERROR BANNER */}
                            {batchError && (
                                <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-rose-700 leading-snug">{batchError}</p>
                                        {batchStep === 1 && <p className="text-[10px] text-rose-400 mt-0.5">Scroll up to fix the highlighted application.</p>}
                                    </div>
                                    <button onClick={() => { setBatchError(null); setErrorAppId(null); }} className="ml-auto p-1 hover:bg-rose-100 rounded-full transition-colors">
                                        <X className="w-3.5 h-3.5 text-rose-400" />
                                    </button>
                                </div>
                            )}

                            {/* FOOTER BUTTONS */}
                            <div className="flex items-center gap-3 pt-2">
                                {batchStep === 1 ? (
                                    <>
                                        <Button variant="ghost" onClick={resetBatchModal} className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100">Cancel</Button>
                                        <Button
                                            onClick={() => {
                                                // Validate: no duplicate students
                                                const userIds = selectedAppsData.map(app => app.user_id);
                                                if (new Set(userIds).size < userIds.length) {
                                                    setBatchError("Multiple applications from the same student are selected. Please remove duplicates.");
                                                    setErrorAppId(null);
                                                    return;
                                                }

                                                // Validate units on step 1 before advancing
                                                if (batchActionType === "approve" || batchActionType === "pending_payment") {
                                                    const missing = selectedAppsData.find(app => !selectedUnits[app.application_id]);
                                                    if (missing) {
                                                        const name = missing.users ? `${missing.users.first_name} ${missing.users.last_name}` : "an applicant";
                                                        setBatchError(`${name} needs a unit assigned before proceeding.`);
                                                        setErrorAppId(missing.application_id);
                                                        return;
                                                    }
                                                }
                                                setBatchError(null);
                                                setErrorAppId(null);

                                                // Pre-fill rental fee from selected units
                                                const rentalFees = selectedAppsData.map(app => {
                                                    const unitId = selectedUnits[app.application_id];
                                                    const units = availableUnits[app.preferred_accommodation_id || ""] || [];
                                                    const unit = units.find((u: any) => u.unit_id === unitId);
                                                    return unit?.rental_fee ?? null;
                                                }).filter((f): f is number => f !== null && f > 0);

                                                if (rentalFees.length > 0) {
                                                    const allSame = rentalFees.every(f => f === rentalFees[0]);
                                                    const amount = allSame
                                                        ? String(rentalFees[0])
                                                        : String(Math.round(rentalFees.reduce((a, b) => a + b, 0) / rentalFees.length));
                                                    // Update in-place — don't wipe items the user already configured
                                                    setBatchInvoiceItems(prev => {
                                                        const hasRental = prev.some(it => it.kind === "first_rental");
                                                        if (hasRental) {
                                                            return prev.map(it => it.kind === "first_rental" ? { ...it, amount } : it);
                                                        }
                                                        return [{ kind: "first_rental", amount }, ...prev];
                                                    });
                                                }


                                                setBatchStep(2);
                                            }}
                                            className={cn("flex-[2] h-12 rounded-2xl bg-slate-200 text-slate-600 hover:bg-slate-300 uppercase text-[11px] tracking-widest shadow-sm transition-transform active:scale-95", archivoBlack.className)}
                                        >
                                            Configure Invoice
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="ghost" onClick={() => { setBatchError(null); setBatchStep(1); }} className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100">← Back</Button>
                                        <Button
                                            onClick={confirmBatchAction}
                                            disabled={loading}
                                            className={cn("flex-[2] h-12 rounded-2xl bg-[#264384] text-white hover:bg-[#1e3569] uppercase text-[11px] tracking-widest shadow-lg transition-transform active:scale-95", archivoBlack.className)}
                                        >
                                            {loading ? "Processing..." : "Confirm & Send Invoice"}
                                        </Button>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
