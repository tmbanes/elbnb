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
import { AccommodationApplication } from "@/types/student_profile";
import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils/ui-utils";
import { PaymentModal } from "./PaymentModal";

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

export default function ApplicationsPage({ records }: ApplicationsPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  // --- GRID LOGIC ---
  const MAX_CARDS = 3;
  const displayedApps = activeApplications.slice(0, MAX_CARDS);
  const emptySlotsCount = MAX_CARDS - displayedApps.length;
  const emptyPlaceholders = Array.from({ length: Math.max(0, emptySlotsCount) });

  return (
    <div className="min-h-screen w-full py-8" style={{ backgroundColor: '#F6F8D5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* SECTION 1: ACTIVE APPLICATIONS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-8 bg-[#264384] rounded-full" />
            <h2 className="text-2xl font-bold text-[#44291B]">Active Applications</h2>
          </div>
          
          {activeApplications.length > 0 ? (
            <>
              {displayedApps.length === 1 ? (
                // 1 ACTIVE APP: Render the wide horizontal card
                <div className="flex flex-col gap-6">
                  {displayedApps.map((app) => (
                    <Card key={app.application_id} className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row items-stretch">
                          <div className={cn("w-2 hidden md:block", statusConfig[app.application_status]?.class.split(' ')[0] || "bg-gray-300")} />
                          
                          <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                              <div className="space-y-1">
                                <p className="text-[#44291B]/50 text-xs uppercase font-bold tracking-widest">
                                  {formatAccommodationType((app as any).accommodation?.accommodation_type)}
                                </p>
                                <p className="font-bold text-[#44291B] text-lg">{app.accommodation?.name || "N/A"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[#44291B]/50 text-xs uppercase font-bold tracking-widest">Room Type</p>
                                <p className="font-semibold text-[#44291B]">{formatUnitType(app.preferred_unit_type)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[#44291B]/50 text-xs uppercase font-bold tracking-widest">Date Submitted</p>
                                <p className="text-[#44291B]">{new Date(app.date_submitted).toLocaleDateString()}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[#44291B]/50 text-xs uppercase font-bold tracking-widest">Target Check-in</p>
                                <p className="text-[#44291B]">{app.check_in || "To be confirmed"}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-4 min-w-[180px]">
                              <span className={cn(
                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-tight",
                                statusConfig[app.application_status]?.class || "bg-gray-100 text-gray-600"
                              )}>
                                {statusConfig[app.application_status]?.icon}
                                {formatStatusLabel(app.application_status)}
                              </span>
                              {app.application_status === 'pending_payment' && (
                                <PaymentModal 
                                  applicationId={app.application_id} 
                                  accommodation={app.accommodation?.name || "Unknown Dormitory"} 
                                  unit={app.unit?.unit_number || "Unknown Unit"} 
                                />
                              )}

                              {app.application_status.includes('pending') && (
                                <CancelApplicationModal applicationId={app.application_id} />
                              )}
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
                    <Card key={app.application_id} className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden">
                      <div className={cn("absolute top-0 left-0 w-full h-1.5", statusConfig[app.application_status]?.class.split(' ')[0] || "bg-gray-300")} />
                      
                      <CardContent className="p-6 pt-7 flex flex-col flex-1 gap-5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 pr-2">
                            <p className="text-[#44291B]/50 text-[10px] uppercase font-extrabold tracking-widest">
                              {formatAccommodationType((app as any).accommodation?.accommodation_type)}
                            </p>
                            <p className="font-bold text-[#44291B] text-lg leading-tight">{app.accommodation?.name || "N/A"}</p>
                            <p className="font-medium text-[#44291B]/80 text-sm">{formatUnitType(app.preferred_unit_type)}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-tight",
                            statusConfig[app.application_status]?.class || "bg-gray-100 text-gray-600"
                          )}>
                            {statusConfig[app.application_status]?.icon}
                            {formatStatusLabel(app.application_status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-[#e8e2d6]/60">
                          <div>
                            <p className="text-[#44291B]/50 text-[10px] uppercase font-bold tracking-widest mb-0.5">Date Submitted</p>
                            <p className="text-[#44291B] text-sm font-bold">{new Date(app.date_submitted).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[#44291B]/50 text-[10px] uppercase font-bold tracking-widest mb-0.5">Target Check-in</p>
                            <p className="text-[#44291B] text-sm font-bold">{app.check_in || "TBC"}</p>
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
          
          {/* MODIFIED HEADER WITH DROPDOWN */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#44291B]/20 rounded-full" />
              <h2 className="text-2xl font-bold text-[#44291B]">Application History</h2>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-[#e8e2d6] bg-[#FDFFF4] text-[#44291B] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#264384] font-medium shadow-sm cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="border border-[#e8e2d6] rounded-xl overflow-hidden shadow-sm bg-[#FDFFF4]">
            <div className="relative bg-[#264384] py-4 px-6 overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <span className="text-white text-sm font-bold uppercase tracking-widest">Submission Log</span>
                {/* UPDATED TO REFLECT FILTERED LENGTH */}
                <span className="text-white/60 text-xs font-medium">{filteredHistoricalRecords.length} Records Found</span>
              </div>
              <img src="/assets/left_roof.png" className="absolute left-0 top-0 h-full object-contain pointer-events-none opacity-20" alt="" />
              <img src="/assets/right_roof.png" className="absolute right-0 top-0 h-full object-contain pointer-events-none opacity-20" alt="" />
            </div>

            <Table>
              <TableHeader className="bg-[#FDFFF4]">
                <TableRow className="border-b border-[#e8e2d6] hover:bg-transparent">
                  <TableHead className="text-[#44291B] font-bold h-12">Date</TableHead>
                  <TableHead className="text-[#44291B] font-bold">Dormitory</TableHead>
                  <TableHead className="text-[#44291B] font-bold">Room Type</TableHead>
                  <TableHead className="text-[#44291B] font-bold">Status</TableHead>
                  <TableHead className="text-[#44291B] font-bold text-right pr-6">Actual Move-out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* NOW MAPPING OVER filteredHistoricalRecords */}
                {filteredHistoricalRecords.length > 0 ? (
                  filteredHistoricalRecords.map((record) => (
                    <TableRow key={record.application_id} className="border-b border-[#e8e2d6] hover:bg-[#F6F8D5]/50 transition-colors">
                      <TableCell className="py-4 text-[#44291B]">
                        {new Date(record.date_submitted).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-[#44291B] font-semibold">
                        {record.accommodation?.name || record.preferred_accommodation_id}
                      </TableCell>
                      <TableCell className="text-[#44291B]/80">{formatUnitType(record.preferred_unit_type)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                          statusConfig[record.application_status]?.class || "bg-gray-100"
                        )}>
                          {formatStatusLabel(record.application_status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-[#44291B]/60 italic text-sm">
                        {/* Note: Left exactly as you provided it! */}
                        {(record as any).accomodation_assignment?.actual_Move_Out_Date 
                          ? new Date((record as any).accomodation_assignment.actual_Move_Out_Date).toLocaleDateString() 
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-[#44291B]/40 italic">
                      No historical records available for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}