"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";


import { X } from "lucide-react"
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
  ];

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [status, dormitory, period, search]);

  async function fetchApplications() {
    let query = supabase.from("accommodation_application").select(`
            application_id,
            application_status,
            date_submitted,
            user_id,
            unit_id,
            preferred_unit_type,
            preferred_accommodation_id,
            check_in,
            check_out,
            number_of_companions,
            duration_of_stay,
            users (
              first_name,
              last_name
            ),
            accommodation:preferred_accommodation_id (
              name
            ),
            unit:unit_id (
                unit_id
            )
            `);

    // DORMITORY FILTER
    if (dormitory !== "all") {
      query = query.eq("preferred_accommodation_id", dormitory);
    }

    const [selectedApplication, setSelectedApplication] = useState<string[]>([]);
    
    // FILTER STATES
    const [status, setStatus] = useState("all");
    const [accommodation, setAccommodation] = useState("all");
    const [period, setPeriod] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filteredApplication = applications.filter((app) => {
        const matchesSearch =
            app.application_id.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            status === "all" || app.application_status === status;

        return matchesSearch && matchesStatus;
    });

    // Reset Filter
    const resetFilters = () => {
        setStatus("all")
        setAccommodation("all")
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

    // Toggle Selection
    const toggleSelection = (id: string) => {
        setSelectedApplication((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    // Handle Select All
    const handleSelectAll = () => {
        if (selectedApplication.length === filteredApplication.length) {
            setSelectedApplication([]);
        } else {
            setSelectedApplication(filteredApplication.map(app => app.application_id));
        }
    };

    // Status
    const statusOptions = [
        { value: "pending_admin", label: "Pending Admin" },
        { value: "pending_dorm_manager", label: "Pending Review" },
        { value: "pending_payment", label: "Pending Payment" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "cancelled", label: "Cancelled" },
        { value: "waitlisted", label: "Waitlisted" }
    ]

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
        setPage(1);
    }, [status, accommodation, period, search]);

        async function fetchApplications() {
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

        // ACCOMMODATION FILTER
        if (accommodation !== "all") {
            query = query.eq("unit_id", accommodation)
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

        setLoading(false);
    }

    const rowsPerPage = 5;
    const paginated = filteredApplication.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(filteredApplication.length / rowsPerPage);
    
    return (
        <div className="space-y-4">

        {/* Header */}
        <div>
            <h1 className="text-[32px] font-bold text-[#44291B]">
            Applications
            </h1>
            <p className="text-sm text-[#44291B]/70">
                Overview of all tenant applications, statuses, and review decisions.
            </p>
        </div>

        {/* FILTER BAR */}
        <Card className="bg-[#FDFFF4] shadow-md border border-[#e8e2d6] p-3 rounded-xl space-y-2">

        {/* HEADER */}
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#44291B]">Filters</h2>
    console.log("DATA:", data);

    const mappedData = (data as any[])?.map((app) => ({
      ...app,
      users: Array.isArray(app.users) ? app.users[0] : app.users,
      accommodation: Array.isArray(app.accommodation)
        ? app.accommodation[0]
        : app.accommodation,
      unit: Array.isArray(app.unit) ? app.unit[0] : app.unit,
    }));

    setApplications(mappedData ?? []);

    setLoading(false);
  }

  return (
    <div className="p-4 bg-[#F6F8D5] text-[#44291B] space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold text-[#44291B]">Applications</h1>
      </div>

      {/* FILTER BAR */}
      <Card className="bg-[#FDFFF4] shadow-md border border-[#e8e2d6] p-4 rounded-xl">
        <div className="flex justify-between items-center mb-0.5">
          <h2 className="text-lg font-semibold leading-none text-[#44291B]">
            Filters
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenFilters(!openFilters)}
            className="h-7 w-7 text-[#264384]]"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                openFilters && "rotate-180",
              )}
            />
          </Button>
        </div>

        {/* FILTER ROW */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-1.5">

            {/* STATUS */}
            <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#44291B]">Status</label>
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                <SelectValue />
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

            {/* ACCOMMODATION */}
            <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#44291B]">Accommodation</label>
            <Select value={accommodation} onValueChange={setAccommodation}>
                <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {accommodations.map((acc) => (
                    <SelectItem key={acc.accommodation_id} value={acc.accommodation_id}>
                    {acc.name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>

            {/* PERIOD */}
            <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#44291B]">Period</label>
            <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
            </Select>
            </div>

            {/* SEARCH */}
            <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#44291B]">Search</label>
            <Input
                className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
            />
            </div>

            {/* RESET */}
            <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[#FDFFF4]">
                    Reset
                </label>

                <Button
                    onClick={resetFilters}
                    className="h-8 w-8 bg-[#FEE2E2] hover:bg-[#FCA5A5] text-red-600"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

        </div>

        {/* FOOTER */}
        <div className="text-sm text-[#44291B]/70 flex justify-between items-center">
            <div>
                Showing {paginated.length} of {filteredApplication.length} applications
            </div>
        </div>

        </Card>


        {/* TABLE */}
        <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden print:hidden">
            <div className="overflow-x-auto text-slate-700">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-semibold w-12 pt-[18px]">
                        <input 
                            type="checkbox" 
                            checked={selectedApplication.length === paginated.length && paginated.length > 0}
                            onChange={handleSelectAll} 
                            className="rounded border-slate-300" 
                        />
                    </th>
                    <th className="px-6 py-4 font-semibold">Tenant / Property</th>
                    <th className="px-6 py-4 font-semibold">Student ID #</th>
                    <th className="px-6 py-4 font-semibold">Application Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
                </thead>

                <tbody>
                    {paginated.map((app: any) => {

                    const status = app.application_status?.toLowerCase();
                    const userData = Array.isArray(app.users) ? app.users[0] : app.users;
                    const applicantName = userData
                        ? `${userData.first_name} ${userData.last_name}`
                        : "Unknown Applicant";
                    const studentNum = Array.isArray(userData?.student)
                        ? userData.student[0]?.student_num ?? "N/A"
                        : userData?.student?.student_num ?? "N/A";
                    const accName =
                        app.accommodation?.name ||
                        "N/A";

                    const statusConfig: any = {
                        approved: { class: "bg-green-100 text-green-700 border-green-200" },
                        rejected: { class: "bg-red-100 text-red-700 border-red-200" },
                        cancelled: { class: "bg-rose-100 text-rose-700 border-rose-200" },
                        waitlisted: { class: "bg-slate-100 text-slate-700 border-slate-200"},
                        pending_admin: { class: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
                        pending_payment: { class: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
                        pending_dorm_manager: { class: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" },
                    };

                    return (
                        <tr
                            key={app.application_id}
                            onClick={() => onSelect(app.application_id)}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                        >

                        {/* CHECKBOX */}
                        <td className="px-6 py-4">
                            <input
                            type="checkbox"
                            onChange={() => toggleSelection(app.application_id)}
                            checked={selectedApplication.includes(app.application_id)}
                            className="rounded border-slate-300"
                            />
                        </td>

                        {/* TENANT / PROPERTY */}
                        <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">
                                {applicantName}
                            </p>
                            <p className="text-xs text-slate-500">
                            Dorm: {accName}
                            </p>
                        </td>

                        {/* STUDENT ID */}
                        <td className="px-6 py-4 font-mono text-xs">
                            {studentNum}
                        </td>

                        {/* APPLICATION DATE */}
                        <td className="px-6 py-4">
                            <p className="text-slate-900">
                            {app.date_submitted
                                ? new Date(app.date_submitted).toLocaleDateString()
                                : "N/A"}
                            </p>
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                            <span
                            className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-flex items-center gap-1.5",
                                statusConfig[status]?.class || "bg-gray-100 text-gray-600"
                            )}
                            >
                            {statusConfig[status]?.icon}
                            {app.application_status.replaceAll("_", " ").toUpperCase()}
                            </span>
                        </td>

                        {/* ACTIONS */}
                        <td
                            className="px-6 py-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-end gap-2">
                            <button
                                onClick={() => onSelect(app.application_id)}
                                className="px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                            >
                                View
                            </button>
                            </div>
                        </td>

                        </tr>
                    );
                    })}

                    {filteredApplication.length === 0 && (
                    <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                        No applications found matching filters.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
        </div>        
        </div>
        <div 
            className="flex justify-end items-center gap-1 px-4 py-1 border-t border-slate-200 text-sm text-slate-600"
        >
            <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-2 py-1 rounded hover:bg-slate-100"
            >
                ←
            </button>

            <span>
                Page {page} of {totalPages}
            </span>

            <button
                onClick={() =>
                setPage((p) =>
                    Math.min(p + 1, Math.ceil(filteredApplication.length / rowsPerPage))
                )
                }
                className="px-2 py-1 rounded hover:bg-slate-100"
            >
                →
            </button>

        </div>
    </div>
    );
}
