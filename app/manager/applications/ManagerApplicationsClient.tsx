"use client";

import { useState, useEffect, useCallback } from "react";
import ReviewApplication from "./ReviewApplication";
import {
  fetchManagerApplications,
  updateApplicationStatus,
  type Application,
  type ManagerAction,
  type ManagerApplicationsResponse,
} from "@/lib/actions/manager-application-actions";
import { Unit } from "@/types/accommodation_units";
import { useRealtimeSync } from "@/lib/realtime-sync";
import { cn } from "@/lib/utils/ui-utils";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Archivo, Archivo_Black } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

export default function ManagerApplicationsClient({ user, initialData }: { user: any, initialData: ManagerApplicationsResponse }) {
  const [applications, setApplications] = useState<Application[]>(initialData.applications);
  const [accommodationName, setAccommodationName] = useState(initialData.accommodation.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>(initialData.units);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const load = useCallback(async () => {
    try {
      const { accommodation, applications: apps, units: fetchedUnits } =
        await fetchManagerApplications();
      setAccommodationName(accommodation.name);
      setApplications(apps);
      setUnits(fetchedUnits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications.");
    }
  }, []);

  useRealtimeSync('accommodation_application', undefined, '*', () => {
    load();
  });

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: string, action: ManagerAction, unitId?: string) {
    await updateApplicationStatus(id, action, unitId);
    
    // Update local state so the UI reflects the change immediately
    setApplications((prev) => prev.map((a) => 
      a.application_id === id 
        ? { ...a, application_status: action === "forward" ? "pending_admin" : "rejected" } 
        : a
    ));
  }

  // Filtering
  const filteredApps = applications.filter(app => {
    const name = `${app.users?.first_name} ${app.users?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || app.application_id.toLowerCase().includes(search.toLowerCase());
  });

  const paginated = filteredApps.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredApps.length / rowsPerPage);

  const selectedApp = applications.find(a => a.application_id === selectedAppId) || null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_dorm_manager":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap bg-amber-50 text-amber-700 border-amber-100 animate-pulse">
            Pending Review
          </span>
        );
      case "pending_admin":
      case "pending_payment":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap bg-sky-50 text-sky-700 border-sky-100">
            Pending Admin
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap bg-rose-50 text-rose-700 border-rose-100">
            Rejected
          </span>
        );
      case "approved":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100">
            Approved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap bg-gray-50 text-gray-700 border-gray-100">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">
      
      {/* LEFT SIDE (LIST) */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out",
        selectedAppId ? "hidden lg:flex lg:flex-[7]" : "flex-1"
      )}>
        <div className={cn(
          "h-full flex flex-col pt-10 pb-6 gap-6 transition-all duration-500 overflow-y-auto scrollbar-hide",
          selectedAppId ? "px-6 lg:px-12" : "px-4 md:px-12 lg:px-20 xl:px-36"
        )}>
          {/* Header */}
          <div className="space-y-1 flex-shrink-0">
            <h1 className={`${archivoBlack.className} pt-6 text-4xl md:text-5xl text-[#44291B] tracking-tight`}>
              Applications
            </h1>
            <p className="text-sm text-[#44291B] font-medium mt-1">
              Managing applications for <span className="text-[#264384] font-bold">{accommodationName || "your assigned property"}</span>.
            </p>
          </div>

          {/* Search/Filter Bar */}
          <div className="flex items-center justify-between gap-4 bg-[#FDFFF4] p-3 rounded-2xl border border-[#e8e2d6] shadow-sm flex-shrink-0">
            <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 max-w-md bg-white focus-within:ring-2 focus-within:ring-[#264384]/10 transition-all">
              <div className="pl-3 flex items-center justify-center text-[#44291B]/50">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search tenant name or ID..."
                className="w-full px-3 py-1.5 bg-transparent text-sm outline-none text-[#44291B] placeholder:text-[#44291B]/50 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest px-2">
                {filteredApps.length} Total
              </span>
            </div>
          </div>

          {/* Applications Table - Fixed Height Container */}
          <div className="flex-1 bg-[#FDFFF4] rounded-2xl border border-[#e8e2d6] overflow-hidden shadow-sm flex flex-col min-h-0">
            <div className="flex-1 overflow-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#FDFFF4] z-10 shadow-sm">
                  <tr className="border-b border-[#e8e2d6]">
                    <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Tenant / ID</th>
                    <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Stay Duration</th>
                    <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Application Date</th>
                    <th className="py-3 px-3 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest">Status</th>
                    <th className="py-3 px-5 text-[10px] font-extrabold text-[#44291B]/50 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#44291B]/40 font-bold">No applications found.</td>
                    </tr>
                  ) : (
                    paginated.map((app) => {
                      const applicantName = `${app.users?.first_name} ${app.users?.last_name}`;
                      const isSelected = app.application_id === selectedAppId;
                      return (
                        <tr 
                          key={app.application_id}
                          onClick={() => setSelectedAppId(app.application_id)}
                          className={cn(
                            "border-b border-[#e8e2d6]/60 last:border-0 cursor-pointer transition-colors",
                            isSelected ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]"
                          )}
                        >
                          <td className="py-4 px-5">
                            <p className="text-sm font-bold text-[#44291B]">{applicantName}</p>
                            <p className="text-[10px] font-bold text-[#44291B]/50 uppercase tracking-tighter">#{app.application_id.slice(0, 8)}</p>
                          </td>
                          <td className="py-4 px-3">
                            <p className="text-xs text-[#44291B] font-bold">{app.duration_of_stay} Months</p>
                            <p className="text-[10px] text-[#44291B]/50 font-medium capitalize">{app.preferred_unit_type.replace(/_/g, ' ')}</p>
                          </td>
                          <td className="py-4 px-3 text-xs text-[#44291B] font-medium">
                            {new Date(app.date_submitted).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-3">
                            {getStatusBadge(app.application_status)}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className={cn(
                                "p-2 rounded-xl h-9 w-9 p-0 flex items-center justify-center ml-auto transition-all",
                                isSelected ? "bg-[#264384] text-white" : "text-slate-500 bg-slate-100/50 hover:text-[#264384] hover:bg-[#AFBFE1]"
                              )}
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

            {/* Pagination Footer - Fixed at bottom of table container */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 bg-[#FDFFF4] border-t border-[#e8e2d6] flex-shrink-0">
              <p className="text-xs font-bold text-slate-500">
                Showing {paginated.length} of {filteredApps.length} applications
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="ghost"
                  className="h-8 rounded-lg font-bold text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <div className="flex items-center px-3 text-xs font-bold text-slate-700">
                  {page} / {totalPages || 1}
                </div>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  variant="ghost"
                  className="h-8 rounded-lg font-bold text-xs"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (DETAIL PANEL) */}
      <div className={cn(
        "bg-white border-l border-[#e8e2d6] transition-all duration-500 ease-in-out flex flex-col shadow-2xl z-20",
        selectedAppId ? "flex-[3] w-full" : "w-0 flex-[0] pointer-events-none opacity-0"
      )}>
        {selectedApp && (
          <ReviewApplication
            application={selectedApp}
            applicationId={selectedApp.application_id}
            units={units}
            onAction={handleAction}
            onClose={() => setSelectedAppId(null)}
          />
        )}
      </div>

    </div>
  );
}
