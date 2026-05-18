"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CancelApplicationModal } from "./CancelModal";
import { AccommodationApplication } from "@/types/user_profile";
import { Check, Clock, X, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils/ui-utils";
import { PaymentModal } from "./PaymentModal";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archivo_Black } from "next/font/google";

const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

interface ApplicationsPageProps {
  records: AccommodationApplication[];
}

function formatStatusLabel(status: string) {
  if (!status) return "Unknown";
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Helper to cleanly format the raw accommodation type string
function formatAccommodationType(type: string | undefined) {
  if (!type) return "Accommodation";
  if (type === "renting_space") return "Renting Space";
  if (type === "dormitory") return "Dormitory";
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Helper to cleanly format preferred unit type string
function formatUnitType(type: string | undefined) {
  if (!type) return "N/A";
  if (type.trim().toLowerCase() === "wholeunit") return "Whole Unit";
  const cleanString = type.replace(/[_-]/g, ' ');
  return cleanString
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
    .join(' ');
}

// Helper to consistently format dates with slashes (MM/DD/YYYY)
function formatDate(dateString: string | undefined | null, fallback = "—") {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  // If it's somehow an invalid date, just return the original string or fallback
  if (isNaN(date.getTime())) return dateString;

  // Using 'en-US' guarantees the M/D/YYYY format with slashes
  // Using UTC time zone prevents dates from shifting backwards by 1 day due to local timezones
  return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
}

import { useRealtimeSync } from "@/lib/realtime-sync";

export default function ApplicationsPage({ records }: ApplicationsPageProps) {
  const router = useRouter();
  // Sync applications in real-time
  useRealtimeSync('accommodation_application', undefined, '*');

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 5;

  const statusConfig: any = {
    approved: { class: "bg-[#78A24C] text-white", icon: <Check className="w-3 h-3" /> },
    rejected: { class: "bg-[#DF3538] text-white", icon: <X className="w-3 h-3" /> },
    cancelled: { class: "bg-[#EB8A0B] text-white", icon: <X className="w-3 h-3" /> },
    pending_admin: { class: "bg-[#F2C908] text-black", icon: <Clock className="w-3 h-3" /> },
    pending_payment: { class: "bg-[#F2C908] text-black", icon: <Clock className="w-3 h-3" /> },
    pending_dorm_manager: { class: "bg-[#F2C908] text-black", icon: <Clock className="w-3 h-3" /> },
  };

  const activeStatuses = ['pending_admin', 'pending_dorm_manager', 'pending_payment'];
  const activeApplications = records.filter(r => activeStatuses.includes(r.application_status));
  const historicalRecords = records.filter(r => !activeStatuses.includes(r.application_status));

  const filteredHistoricalRecords = historicalRecords.filter(record => {
    if (statusFilter === "all") return true;
    return record.application_status === statusFilter;
  });

  const totalPages = Math.ceil(filteredHistoricalRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredHistoricalRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const MAX_CARDS = 3;
  const displayedApps = activeApplications.slice(0, MAX_CARDS);

  return (
    <div className="min-h-screen w-full py-8" style={{ backgroundColor: '#F6F8D5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/guest/dashboard")}
            className="flex items-center gap-2 text-[#44291B]/60 hover:text-[#44291B] hover:bg-[#F6F8D5] -ml-2 mb-2 transition-all group w-fit"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
          </Button>
          <header className="mb-2">
            <h1 className={`${archivoBlack.className} pt-6 text-4xl md:text-5xl`} style={{ color: '#44291B' }}>
              Accommodation Overview
            </h1>
            <p className="mt-2 text-sm sm:text-sm" style={{ color: '#44291B' }}>
              Manage your active requests and view past history.
            </p>
          </header>
        </div>

        {/* SECTION 1: ACTIVE APPLICATIONS */}
        <section className="space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#264384] rounded-full" />
              <h2 className={`${archivoBlack.className} text-xl md:text-2xl text-[#44291B] tracking-tight`}>Active Applications</h2>
            </div>
            
            <Button
              onClick={() => router.push("/guest/accommodations")}
              disabled={activeApplications.length >= MAX_CARDS}
              className={cn(
                "flex items-center gap-2 font-bold tracking-wide transition-all",
                activeApplications.length >= MAX_CARDS 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" // Grayed out state
                  : "bg-[#264384] hover:bg-[#1a2d5c] text-white shadow-sm" // Active state
              )}
            >
              <Plus className="w-4 h-4" />
              Start New Application
            </Button>
          </div>

          {activeApplications.length > 0 ? (
            <>
              {displayedApps.length === 1 ? (
                // 1 ACTIVE APP: Horizontal Card
                <div className="flex flex-col gap-6">
                  {displayedApps.map((app) => (
                    <Card key={app.application_id} className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm overflow-hidden hover:shadow-lg hover:scale-[1.02] transform transition-all duration-300">
                      <CardContent className="p-0 h-full">
                        <div className="flex flex-col md:flex-row items-stretch h-full">
                          <div className={cn("w-2 hidden md:block", statusConfig[app.application_status]?.class.split(' ')[0] || "bg-gray-300")} />

                          <div className="flex-1 p-6 flex flex-col gap-6">
                            {/* Top Section: Info (Left) and Actions (Right) */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">

                              {/* Left Info Group */}
                              <div className="space-y-1">
                                <p className="text-[#44291B]/50 text-[10px] uppercase font-extrabold tracking-widest">
                                  {formatAccommodationType((app as any).accommodation?.accommodation_type)}
                                </p>
                                <p className="font-bold text-[#44291B] text-xl leading-tight">{app.accommodation?.name || "N/A"}</p>
                                <p className="font-medium text-[#44291B]/80 text-sm">{formatUnitType(app.preferred_unit_type)}</p>

                                <div className="pt-2">
                                  <span className={cn(
                                    "inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                    statusConfig[app.application_status]?.class || "bg-gray-100 text-gray-600"
                                  )}>
                                    {statusConfig[app.application_status]?.icon}
                                    {formatStatusLabel(app.application_status)}
                                  </span>
                                </div>
                              </div>

                              {/* Right Actions Group */}
                              <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px] w-full md:w-auto">
                                {app.application_status === 'pending_payment' && (
                                  <div className="w-full [&>button]:w-full">
                                    <PaymentModal
                                      applicationId={app.application_id}
                                      accommodation={app.accommodation?.name || "Unknown Dormitory"}
                                      unit={app.unit?.unit_number || "Unknown Unit"}
                                    />
                                  </div>
                                )}
                                {app.application_status.includes('pending') && (
                                  <div className="w-full [&>button]:w-full">
                                    <CancelApplicationModal applicationId={app.application_id} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bottom Section: Dates in Bordered Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto pt-4 border-t border-[#e8e2d6]/60">
                              <div>
                                <p className="text-[#44291B]/50 text-[10px] uppercase font-bold tracking-widest mb-0.5">Date Submitted</p>
                                <p className="text-[#44291B] text-sm font-bold">{formatDate(app.date_submitted)}</p>
                              </div>
                              <div>
                                <p className="text-[#44291B]/50 text-[10px] uppercase font-bold tracking-widest mb-0.5">Target Check-in</p>
                                <p className="text-[#44291B] text-sm font-bold">{formatDate(app.check_in, "TBC")}</p>
                              </div>
                            </div>

                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // 2 OR 3 ACTIVE APPS: Render the vertical cards in a dynamic grid
                <div className={cn(
                  "grid gap-6 items-stretch",
                  displayedApps.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}>
                  {displayedApps.map((app) => (
                    <Card key={app.application_id} className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm hover:shadow-lg hover:scale-[1.02] transform transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                      <div className={cn("absolute top-0 left-0 w-full h-1.5", statusConfig[app.application_status]?.class.split(' ')[0] || "bg-gray-300")} />

                      <CardContent className="p-6 pt-7 flex flex-col flex-1 gap-5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 pr-2">
                            <p className="text-[#44291B]/50 text-[10px] uppercase font-extrabold tracking-widest">
                              {formatAccommodationType((app as any).accommodation?.accommodation_type)}
                            </p>
                            <p className="font-bold text-[#44291B] text-lg leading-tight">{app.accommodation?.name || "N/A"}</p>
                            <p className="font-medium text-[#44291B]/80 text-sm">{formatUnitType(app.preferred_unit_type)}</p>

                            <div className="pt-2">
                              <span className={cn(
                                "inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                statusConfig[app.application_status]?.class || "bg-gray-100 text-gray-600"
                              )}>
                                {statusConfig[app.application_status]?.icon}
                                {formatStatusLabel(app.application_status)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-[#e8e2d6]/60">
                          <div>
                            <p className="text-[#44291B]/50 text-[10px] uppercase font-bold tracking-widest mb-0.5">Date Submitted</p>
                            <p className="text-[#44291B] text-sm font-bold">{formatDate(app.date_submitted)}</p>
                          </div>
                          <div>
                            <p className="text-[#44291B]/50 text-[10px] uppercase font-bold tracking-widest mb-0.5">Target Check-in</p>
                            <p className="text-[#44291B] text-sm font-bold">{formatDate(app.check_in, "TBC")}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          {app.application_status === 'pending_payment' && (
                            <PaymentModal
                              applicationId={app.application_id}
                              accommodation={app.accommodation?.name || "Unknown Dormitory"}
                              unit={app.unit?.unit_number || "Unknown Unit"}
                            />
                          )}
                          {app.application_status.includes('pending') && (
                            <div className="w-full [&>button]:w-full">
                              <CancelApplicationModal applicationId={app.application_id} />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="bg-[#FDFFF4] border-[#e8e2d6] border-dashed">
              <CardContent className="p-10 text-center text-[#44291B]/40">
                No active applications at the moment.
              </CardContent>
            </Card>
          )}
        </section>

        {/* SECTION 2: HISTORY */}
        <section className="space-y-4">

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#44291B]/20 rounded-full" />
              <h2 className={`${archivoBlack.className} text-xl md:text-2xl text-[#44291B] tracking-tight`}>Application History</h2>
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-auto min-w-[180px] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] px-3 text-sm font-medium text-[#44291B] flex items-center gap-2 hover:bg-[#F6F8D5] transition-colors focus:ring-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#44291B]/40 shrink-0" />
                  <SelectValue placeholder="All Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent className="z-[70] rounded-xl border border-[#e8e2d6] bg-[#FDFFF4] text-[#44291B]">
                <SelectItem value="all" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">
                  All statuses
                </SelectItem>
                <SelectItem value="approved" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">
                  Approved
                </SelectItem>
                <SelectItem value="rejected" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">
                  Rejected
                </SelectItem>
                <SelectItem value="cancelled" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* TABLE CONTAINER - Styled from AdminBillingClient */}
          <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Note: Kept your custom blue header as it houses your specific submission log assets */}
            <div className="relative bg-[#264384] py-4 px-6 overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <span className="text-white text-sm font-bold uppercase tracking-widest">Submission Log</span>
                <span className="text-white/60 text-xs font-medium">{filteredHistoricalRecords.length} Records Found</span>
              </div>
              <img src="/assets/left_roof.png" className="absolute left-0 top-0 h-full object-contain pointer-events-none opacity-20" alt="" />
              <img src="/assets/right_roof.png" className="absolute right-0 top-0 h-full object-contain pointer-events-none opacity-20" alt="" />
            </div>

            <div className="overflow-x-auto text-slate-700">
              <Table className="w-full text-left border-collapse">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="px-6 py-4 font-semibold text-slate-700 h-auto">Date</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-slate-700 h-auto">Dormitory</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-slate-700 h-auto">Room Type</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-slate-700 h-auto">Status</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-slate-700 h-auto text-right pr-6">Actual Move-out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => (
                      <TableRow key={record.application_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <TableCell className="px-6 py-4 font-medium text-slate-900">
                          {formatDate(record.date_submitted)}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-bold text-slate-900">
                          {record.accommodation?.name || record.preferred_accommodation_id}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-slate-600">
                          {formatUnitType(record.preferred_unit_type)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                            statusConfig[record.application_status]?.class || "bg-gray-100"
                          )}>
                            {formatStatusLabel(record.application_status)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right text-xs text-slate-500 font-medium">
                          {formatDate(
                            Array.isArray(record.accommodation_assignment)
                              ? record.accommodation_assignment[0]?.actual_move_out_date
                              : record.accommodation_assignment?.actual_move_out_date
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                        No historical records available for this filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION - Styled from AdminBillingClient */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistoricalRecords.length)} of {filteredHistoricalRecords.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}