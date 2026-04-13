"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from 'next/navigation'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    preferred_accommodation: string;
    date_submitted: string | null;
    application_status: string;
    user_id: string;
    student?: {
        student_num: string;
    };
    accommodation?: {
        name: string;
    };
};

export default function ApplicationList({
    onSelect,
}: {
    onSelect: (id: string) => void;
}) {
    const supabase = getSupabaseBrowserClient();

    const [applications, setApplications] = useState<Application[]>([]);

    // FILTER STATES
    const [status, setStatus] = useState("all");
    const [dormitory, setDormitory] = useState("all");
    const [period, setPeriod] = useState("all");
    const [search, setSearch] = useState("");
    const [openFilters, setOpenFilters] = useState(true)

    // Reset Filter
    const resetFilters = () => {
        setStatus("all")
        setDormitory("all")
        setPeriod("all")
        setSearch("")
    }

    // Accommodation
    const [accommodations, setAccommodations] = useState<any[]>([]);
    useEffect(() => {
    async function fetchAccommodations() {
        const { data, error } = await supabase
        .from("accommodation")
        .select("accommodation_id, name, accommodation_type");

        if (!error && data) setAccommodations(data);
    }
    fetchAccommodations();
    }, []);

    // Status
    const statusOptions = [
        { value: "pending_admin", label: "Pending Admin" },
        { value: "pending_dorm_manager", label: "Pending Review" },
        { value: "pending_payment", label: "Pending Payment" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "cancelled", label: "Cancelled" },
    ]

    // Active Filter
    const activeFilters = [
        status !== "all" && { label: statusOptions.find(s => s.value === status)?.label, key: "status" },
        dormitory !== "all" && {
            label: accommodations?.find(a => a.accommodation_id === dormitory)?.name,
            key: "dormitory"
        },
        period !== "all" && { label: period, key: "period" },
        search && { label: `Search: ${search}`, key: "search" },
    ].filter((f): f is { label: string; key: string } => Boolean(f && f.label))


    useEffect(() => {
        fetchApplications();
    }, [status, dormitory, period, search]);

    async function fetchApplications() {
        let query = supabase
            .from("accommodation_application")
            .select(`
            application_id,
            application_status,
            date_submitted,
            user_id,
            unit_id,
            unit:unit(
                unit_id,
                accommodation:accommodation(name)
            )
            `)

        // DORMITORY FILTER
        if (dormitory !== "all") {
            query = query.eq("unit_id", dormitory)
        }

        // DATE FILTER
        const now = new Date();

        if (period === "semestral") {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);

            query = query.gte("date_submitted", sixMonthsAgo.toISOString());
        }

        if (period === "annual") {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);

            query = query.gte("date_submitted", oneYearAgo.toISOString());
        }

        // STATUS FILTER
        if (status !== "all") {
        query = query.eq("application_status", status);
        }

        // SEARCH FILTER 
        if (search.trim() !== "") {
            query = query.or(
                `application_id.ilike.%${search}%`
            );
        }

        const { data, error } = await query.order("date_submitted", {
        ascending: false,
        });

        if (error) {
            console.error(error)
            return
        }

        console.log("DATA:", data);

        setApplications(data ?? [])
    }

    return (
        <div className="p-4 bg-[#F6F8D5] text-[#44291B] space-y-4">

        {/* Header */}
        <div>
            <h1 className="text-[32px] font-bold text-[#44291B]">
            Applications
            </h1>
        </div>

        {/* FILTER BAR */}
        <Card className="bg-[#FDFFF4] shadow-md border border-[#e8e2d6] p-4 rounded-xl">
            <div className="flex justify-between items-center mb-0.5">
                <h2 className="text-lg font-semibold leading-none text-[#44291B]">Filters</h2>

                <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenFilters(!openFilters)}
                className="h-7 w-7 text-[#264384]]"
                >
                <ChevronDown
                    className={cn(
                    "w-4 h-4 transition-transform",
                    openFilters && "rotate-180"
                    )}
                />
                </Button>
            </div>
            
            {/* COLLAPSIBLE CONTENT */}
            <div
                className={cn(
                    "transition-all duration-300 overflow-hidden",
                    openFilters ? "max-h-[220px] opacity-100 mt-0.5" : "max-h-0 opacity-0"
                )}
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">

                {/* STATUS */}
                <div className="flex flex-col gap-0.5">
                    <label className="text-[14px] font-medium leading-none text-[#44291B]">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                            {s.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                {/* DORM */}
                <div className="flex flex-col gap-0.5">
                    <label className="text-[14px] font-medium leading-none text-[#44291B]">Dormitory</label>
                    <Select value={dormitory} onValueChange={setDormitory}>
                    <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                        <SelectValue placeholder="Dormitory" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Dormitories</SelectItem>
                        {accommodations.map((acc) => (
                        <SelectItem key={acc.accommodation_id} value={acc.accommodation_id}>
                            {acc.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                {/* PERIOD */}
                <div className="flex flex-col gap-0.5">
                    <label className="text-[14px] font-medium leading-none text-[#44291B]">Period</label>
                    <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Period</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {/* SEARCH */}
                <div className="flex flex-col gap-0.5">
                    <label className="text-[14px] font-medium leading-none text-[#44291B]">Search</label>
                    <Input
                    className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30"
                    placeholder="Search applicant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                </div>
            </div>

            {/* ACTIVE FILTER CHIPS */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                {activeFilters.map((f: any, i) => (
                    <Badge
                    key={i}
                    className="bg-[#264384] text-[#F6F8D5] border border-[#264384] flex items-center gap-1 transition-all duration-200 hover:bg-[#5591AB] hover:scale-[1.03] hover:shadow-sm cursor-default"
                    >
                    {f.label}
                    <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                        if (f.key === "status") setStatus("all")
                        if (f.key === "dormitory") setDormitory("all")
                        if (f.key === "period") setPeriod("all")
                        if (f.key === "search") setSearch("")
                        }}
                    />
                    </Badge>
                ))}
                </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-between items-center mt-0.5">
                <p className="text-sm text-[#44291B]/70">
                Showing {applications.length} applications
                </p>

                <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-[11px] flex items-center gap-1 bg-[#DF3538] text-white hover:bg-[#c92f32] transition-colors"
                >
                <X className="w-3 h-3" />
                Reset
                </Button>
            </div>
        </Card>


        {/* TABLE */}
        <div className="border border-[#e8e2d6] rounded-md overflow-hidden">

            {/* HEADER WITH ROOF IMAGES */}
            <div className="flex items-stretch bg-[#264384]">

                {/* LEFT ROOF IMAGE */}
                {/* <img
                    src="/assets/left_roof.png"
                    className="w-10 h-auto flex-shrink-0"
                    alt="left roof"
                />*/}

                {/* HEADER CONTENT */}
                <Table className="flex-1">
                    <TableHeader>
                        <TableRow className="border-none">
                            <TableHead className="text-white font-semibold text-sm">
                                Applicant Name
                            </TableHead>

                            <TableHead className="text-white font-semibold text-sm">
                                Student ID
                            </TableHead>

                            <TableHead className="text-white font-semibold text-sm">
                                Dormitory
                            </TableHead>

                            <TableHead className="text-white font-semibold text-sm">
                                Application Date
                            </TableHead>

                            <TableHead className="text-white font-semibold text-sm">
                                Status
                            </TableHead>

                            <TableHead className="text-white font-semibold text-sm">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>

                {/* RIGHT ROOF IMAGE */}
                {/*<img
                    src="/assets/right_roof.png"
                    className="w-10 h-auto flex-shrink-0"
                    alt="right roof"
                />*/}
            </div>

            <Table>
                <TableBody>
                    {applications.length === 0 ? (
                        <TableRow className="bg-white border-b border-[#e8e2d6] hover:bg-[#F6F8D5]">
                        <TableCell colSpan={6} className="text-center py-6 bg-white">
                            No applications found
                        </TableCell>
                        </TableRow>
                    ) : (
                        applications.map((app) => (
                        <TableRow key={app.application_id}>
                            
                            {/* Applicant Name (you currently don't have it) */}
                            <TableCell className="bg-white">N/A</TableCell>

                            {/* Student ID (you DON'T have student table yet) */}
                            <TableCell className="bg-white">N/A</TableCell>

                            {/* Dormitory */}
                            <TableCell className="bg-white">
                            {app.unit?.accommodation?.name ?? "N/A"}
                            </TableCell>

                            {/* Date */}
                            <TableCell className="bg-white">
                            {app.date_submitted
                                ? new Date(app.date_submitted).toLocaleDateString()
                                : "N/A"}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="bg-white">
                            <span className="capitalize">
                                {app.application_status}
                            </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="bg-white">
                            <Button onClick={() => onSelect(app.application_id)}>
                                View
                            </Button>
                            </TableCell>

                        </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
    );
}
