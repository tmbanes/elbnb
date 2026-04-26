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
  const rowsPerPage = 6;

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
    setApplications((prev) => prev.filter((a) => a.application_id !== id));
    setSelectedAppId(null);
  }

  // Filtering
  const filteredApps = applications.filter(app => {
    const name = `${app.users?.first_name} ${app.users?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || app.application_id.includes(search);
  });

  const paginated = filteredApps.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredApps.length / rowsPerPage);

  const selectedApp = applications.find(a => a.application_id === selectedAppId) || null;

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">
      
      {/* LEFT SIDE (LIST) */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out",
        selectedAppId ? "lg:flex-[7]" : "flex-1"
      )}>
        <div className={cn(
          "h-full flex flex-col py-10 gap-6 transition-all duration-500",
          selectedAppId ? "px-6 lg:px-12" : "px-6 md:px-12 lg:px-24"
        )}>
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
              Review Applications
            </h1>
            <p className="text-sm text-[#44291B]/60 font-medium">
              {accommodationName || "Managing your assigned property"}
            </p>
          </div>

          {/* Search/Filter Bar */}
          <div className="flex items-center justify-between gap-4 bg-[#FDFFF4] p-3 rounded-2xl border border-[#e8e2d6] shadow-sm">
            <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 max-w-md bg-white/50 focus-within:ring-2 focus-within:ring-[#264384]/10 transition-all">
              <div className="pl-3 flex items-center justify-center text-[#44291B]/40">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or ID..."
                className="w-full px-3 py-2 bg-transparent text-sm outline-none text-[#44291B] placeholder:text-[#44291B]/40 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest px-2">
                {filteredApps.length} Results
              </span>
            </div>
          </div>

          {/* Applications Table */}
          <div className="flex-1 bg-[#FDFFF4] rounded-3xl border border-[#e8e2d6] overflow-hidden shadow-sm flex flex-col">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e2d6] bg-white/30">
                    <th className="py-4 px-6 text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Applicant</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest hidden md:table-cell">Stay Info</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest hidden lg:table-cell">Submitted</th>
                    <th className="py-4 px-6 text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e2d6]/50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-[#44291B]/40 font-bold">
                        {search ? "No matches found for your search." : "No applications pending review."}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((app) => {
                      const isSelected = app.application_id === selectedAppId;
                      return (
                        <tr 
                          key={app.application_id}
                          onClick={() => setSelectedAppId(app.application_id)}
                          className={cn(
                            "cursor-pointer transition-all duration-200 group",
                            isSelected ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]/50"
                          )}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#e8edf7] flex items-center justify-center font-bold text-[#264384] text-xs shadow-inner">
                                {app.users?.first_name?.[0]}{app.users?.last_name?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#44291B] group-hover:text-[#264384] transition-colors">
                                  {app.users?.first_name} {app.users?.last_name}
                                </p>
                                <p className="text-[10px] font-bold text-[#44291B]/40 uppercase tracking-tighter">
                                  #{app.application_id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 hidden md:table-cell">
                            <p className="text-xs font-bold text-[#44291B]">{app.duration_of_stay} Months</p>
                            <p className="text-[10px] text-[#44291B]/50 font-medium capitalize">{app.preferred_unit_type.replace(/_/g, ' ')}</p>
                          </td>
                          <td className="py-4 px-6 hidden lg:table-cell">
                            <p className="text-xs font-medium text-[#44291B]/70">
                              {new Date(app.date_submitted).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "rounded-xl h-9 w-9 p-0 transition-all",
                                isSelected ? "bg-[#264384] text-white shadow-md" : "bg-white border border-[#e8e2d6] text-[#44291B]/60 hover:text-[#264384] hover:bg-white"
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

            {/* Pagination Footer */}
            <div className="p-4 bg-white/30 border-t border-[#e8e2d6] flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#44291B]/40 uppercase tracking-widest">
                Page {page} of {totalPages || 1}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 rounded-lg font-bold text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
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
