"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { AccommodationApplication } from "@/types/application_workflow";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ChevronDown, X, Check, Clock } from "lucide-react";
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

export default function ApplicationList({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const supabase = getSupabaseBrowserClient();

  const [applications, setApplications] = useState<AccommodationApplication[]>(
    [],
  );

  // FILTER STATES
  const [status, setStatus] = useState("all");
  const [dormitory, setDormitory] = useState("all");
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [openFilters, setOpenFilters] = useState(true);

  // Reset Filter
  const resetFilters = () => {
    setStatus("all");
    setDormitory("all");
    setPeriod("all");
    setSearch("");
  };

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
      query = query.or(`application_id.ilike.%${search}%`);
    }

    const { data, error } = await query.order("date_submitted", {
      ascending: false,
    });

    if (error) {
      console.error(error);
      return;
    }

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

        {/* COLLAPSIBLE CONTENT */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            openFilters
              ? "max-h-[220px] opacity-100 mt-0.5"
              : "max-h-0 opacity-0",
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
            {/* STATUS */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[14px] font-medium leading-none text-[#44291B]">
                Status
              </label>
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
              <label className="text-[14px] font-medium leading-none text-[#44291B]">
                Dormitory
              </label>
              <Select value={dormitory} onValueChange={setDormitory}>
                <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                  <SelectValue placeholder="Dormitory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dormitories</SelectItem>
                  {accommodations.map((acc) => (
                    <SelectItem
                      key={acc.accommodation_id}
                      value={acc.accommodation_id}
                    >
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PERIOD */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[14px] font-medium leading-none text-[#44291B]">
                Period
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Period</SelectItem>
                  <SelectItem value="start">Semestral</SelectItem>
                  <SelectItem value="end">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SEARCH */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[14px] font-medium leading-none text-[#44291B]">
                Search
              </label>
              <Input
                className="w-full h-8 bg-white border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30"
                placeholder="Search applicant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

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
        <div className="relative bg-[#264384]">
          {/* ROOF IMAGES (DO NOT AFFECT LAYOUT) */}
          <img
            src="/assets/left_roof.png"
            className="absolute left-0 top-0 h-full object-contain pointer-events-none"
            alt="left roof"
          />
          <img
            src="/assets/right_roof.png"
            className="absolute right-0 top-0 h-full object-contain pointer-events-none"
            alt="right roof"
          />

          {/* HEADER */}
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="border-none">
                <TableHead className="text-white text-sm font-semibold px-6 py-4">
                  Applicant Name
                </TableHead>

                <TableHead className="text-white text-sm font-semibold px-6 py-4">
                  Accommodation Name
                </TableHead>

                <TableHead className="text-white text-sm font-semibold px-6 py-4">
                  Application Date
                </TableHead>

                <TableHead className="text-white text-sm font-semibold px-6 py-4">
                  Status
                </TableHead>

                <TableHead className="text-white text-sm font-semibold px-6 py-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        {/* BODY */}
        <Table className="w-full table-fixed">
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j} className="px-6 py-4">
                      <div className="h-4 w-full bg-gray-200 animate-pulse rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No applications found
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => {
                const status = app.application_status?.toLowerCase();
                const userData = Array.isArray(app.users) ? app.users[0] : app.users;
                const applicantName = userData
                  ? `${userData.first_name} ${userData.last_name}`
                  : "Unknown Applicant";
                const accName =
                  app.accommodation?.name ||
                  "N/A";


                const statusConfig: any = {
                  approved: {
                    class: "bg-[#78A24C] text-black",
                    icon: <Check className="w-3 h-3" />,
                  },
                  rejected: {
                    class: "bg-[#DF3538] text-black",
                    icon: <X className="w-3 h-3" />,
                  },
                  cancelled: {
                    class: "bg-[#EB8A0B] text-black",
                    icon: <X className="w-3 h-3" />,
                  },
                  pending_admin: {
                    class: "bg-[#F2C908] text-black",
                    icon: <Clock className="w-3 h-3" />,
                  },
                  pending_payment: {
                    class: "bg-[#F2C908] text-black",
                    icon: <Clock className="w-3 h-3" />,
                  },
                  pending_dorm_manager: {
                    class: "bg-[#F2C908] text-black",
                    icon: <Clock className="w-3 h-3" />,
                  },
                };

                return (
                  <TableRow
                    key={app.application_id}
                    onClick={() => onSelect(app.application_id)}
                    className="
                        bg-white border-b border-[#e8e2d6]
                        hover:bg-[#F6F8D5]
                        hover:shadow-md
                        hover:scale-[1.01]
                        transition-all duration-200 ease-in-out
                        cursor-pointer
                        "
                  >
                    <TableCell className="px-6 py-4 font-medium">
                      {applicantName}
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      {accName}
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      {app.date_submitted
                        ? new Date(app.date_submitted).toLocaleDateString()
                        : "N/A"}
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize",
                          statusConfig[status]?.class ||
                          "bg-gray-100 text-gray-600",
                        )}
                      >
                        {statusConfig[status]?.icon}
                        {app.application_status.replaceAll("_", " ")}
                      </span>
                    </TableCell>

                    <TableCell
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        onClick={() => onSelect(app.application_id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
