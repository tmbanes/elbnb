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
import { Search, Filter, Eye, ChevronLeft, ChevronRight, X, Building2, AlertCircle } from "lucide-react";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const app = applications.find(a => a.application_id === id);
    if (!app || app.application_status !== "pending_dorm_manager") return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const batchableApps = paginated.filter(app => app.application_status === "pending_dorm_manager");
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

  const handleBatchAction = async (action: ManagerAction) => {
    if (selectedIds.size === 0) return;
    
    // Check if units are assigned for all forwards
    if (action === "forward") {
      const allAssigned = Array.from(selectedIds).every(id => selectedUnits[id]);
      if (!allAssigned) {
        setBatchError("Please assign a unit for all applications before forwarding.");
        return;
      }
    }

    setLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id => 
        updateApplicationStatus(id, action, selectedUnits[id])
      );
      await Promise.all(promises);
      
      setApplications(prev => prev.map(a => 
        selectedIds.has(a.application_id) 
          ? { ...a, application_status: action === "forward" ? "pending_admin" : "rejected" }
          : a
      ));
      setSelectedIds(new Set());
      setSelectedUnits({});
    } catch (e) {
      setError("Failed to process some applications.");
    } finally {
      setLoading(false);
    }
  };

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

    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchActionType, setBatchActionType] = useState<ManagerAction | null>(null);
    const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [batchError, setBatchError] = useState<string | null>(null);

    const handleCloseSelection = () => {
        setSelectedIds(new Set());
        setSelectedUnits({});
        setBatchError(null);
    };

    const triggerBatchAction = (action: ManagerAction) => {
      setBatchActionType(action);
      setShowBatchModal(true);
    };

    const confirmBatchAction = async () => {
      if (!batchActionType) return;
      
      // Duplicate applicant check
      const selectedApps = applications.filter(app => selectedIds.has(app.application_id));
      const userIds = selectedApps.map(app => app.user_id);
      if (new Set(userIds).size < userIds.length) {
        setBatchError("Duplicate applicants detected. You cannot forward more than one application per student.");
        return;
      }

      setBatchError(null);
      await handleBatchAction(batchActionType);
      if (!batchError) setShowBatchModal(false);
    };

    const selectedAppsData = applications.filter(app => selectedIds.has(app.application_id));

    return (
      <div className="h-[100dvh] flex overflow-hidden bg-[#F6F8D5] font-[family-name:var(--font-archivo)] relative">

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
          <div className="flex-1 bg-[#FDFFF4] rounded-2xl border border-[#e8e2d6] overflow-hidden shadow-sm flex flex-col min-h-0 relative">
            <div className="flex-1 overflow-auto scrollbar-hide">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[50px]" />
                  <col className="w-[30%]" />
                  <col className="w-[18%]" />
                  <col className="w-[17%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="sticky top-0 bg-[#FDFFF4] z-10 shadow-sm">
                  <tr className="border-b border-[#e8e2d6]">
                    <th className="py-3 px-3">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={
                            paginated.filter(app => app.application_status === "pending_dorm_manager").length > 0 && 
                            paginated.filter(app => app.application_status === "pending_dorm_manager").every(app => selectedIds.has(app.application_id))
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-[#e8e2d6] text-[#264384] focus:ring-[#264384] cursor-pointer disabled:opacity-30"
                          disabled={paginated.filter(app => app.application_status === "pending_dorm_manager").length === 0}
                        />
                      </div>
                    </th>
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
                      <td colSpan={6} className="px-6 py-12 text-center text-[#44291B]/40 font-bold">No applications found.</td>
                    </tr>
                  ) : (
                    paginated.map((app) => {
                      const applicantName = `${app.users?.first_name} ${app.users?.last_name}`;
                      const isSelected = app.application_id === selectedAppId;
                      const isBatchSelected = selectedIds.has(app.application_id);

                      return (
                        <tr
                          key={app.application_id}
                          onClick={() => setSelectedAppId(app.application_id)}
                          className={cn(
                            "border-b border-[#e8e2d6]/60 last:border-0 cursor-pointer transition-colors",
                            isSelected ? "bg-[#F6F8D5]" : "hover:bg-[#F6F8D5]",
                            isBatchSelected && "bg-[#F6F8D5]/50"
                          )}
                        >
                          <td className="py-4 px-3">
                            <div className="flex items-center justify-center">
                              {app.application_status === "pending_dorm_manager" ? (
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
              onClick={() => triggerBatchAction("forward")}
              className={cn("bg-white text-[#264384] hover:bg-gray-100 font-bold text-xs h-11 px-8 rounded-2xl shadow-xl transition-all active:scale-95", archivo.className)}
              disabled={loading}
            >
              {loading ? "Processing..." : "Forward to Admin"}
            </Button>
            
            <div className="w-[1px] h-8 bg-white/10 mx-2" />
            
            <button 
              onClick={handleCloseSelection}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all hover:rotate-90 duration-300"
              title="Cancel Selection"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* BATCH CONFIRMATION MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#FDFFF4] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#e8e2d6] animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className={cn("text-2xl text-[#44291B]", archivoBlack.className)}>Confirm Batch Action</h3>
                  <p className="text-xs font-bold text-[#44291B]/50 uppercase tracking-widest">Summary of {selectedIds.size} applications</p>
                </div>
                <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-[#44291B]/30" />
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-2 scrollbar-hide space-y-4">
                {selectedAppsData.map((app) => {
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
                        "p-4 bg-white rounded-2xl border border-[#e8e2d6] shadow-sm space-y-3 relative group/card transition-all duration-500",
                        isRemoving && "translate-x-full"
                      )}>
                        {/* REMOVE BUTTON */}
                        <button 
                            onClick={() => {
                                setRemovingId(app.application_id);
                                setTimeout(() => {
                                    setSelectedIds(prev => {
                                        const next = new Set(prev);
                                        next.delete(app.application_id);
                                        if (next.size === 0) setShowBatchModal(false);
                                        return next;
                                    });
                                    setSelectedUnits(prev => {
                                        const next = { ...prev };
                                        delete next[app.application_id];
                                        return next;
                                    });
                                    setRemovingId(null);
                                }, 500);
                            }}
                            className="absolute top-3 right-3 w-7 h-7 bg-white border border-[#e8e2d6] text-rose-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all hover:bg-rose-50 hover:scale-110 z-10"
                            title="Remove from batch"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[#44291B]">{app.users ? `${app.users.first_name} ${app.users.last_name}` : "Unknown"}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3 h-3 text-[#264384]/60" />
                              <span className="text-[10px] font-bold text-[#264384] uppercase">{accommodationName}</span>
                            </div>
                          </div>
                        </div>

                        {batchActionType === 'forward' && (
                          <div className="space-y-1.5 pt-2 border-t border-[#e8e2d6]/40">
                            <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest pl-1">Assign Unit</label>
                            <select 
                              value={selectedUnits[app.application_id] || ""}
                              onChange={(e) => setSelectedUnits(prev => ({ ...prev, [app.application_id]: e.target.value }))}
                              className="w-full bg-[#F6F8D5]/50 border border-[#e8e2d6] rounded-xl px-3 py-2 text-xs font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/10 transition-all"
                            >
                              <option value="">Select a unit...</option>
                              <optgroup label="Matching Preferred Type">
                                {filteredUnits.map(u => (
                                  <option key={u.unit_id} value={u.unit_id}>Unit {u.unit_number} ({u.unit_type.replace(/_/g, ' ')})</option>
                                ))}
                              </optgroup>
                              <optgroup label="Other Available Units">
                                {units.filter(u => u.unit_type !== app.preferred_unit_type).map(u => (
                                  <option key={u.unit_id} value={u.unit_id}>Unit {u.unit_number} ({u.unit_type.replace(/_/g, ' ')})</option>
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

              {batchError && (
                  <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      <p className="text-[11px] font-bold text-rose-700 uppercase tracking-tight leading-tight">{batchError}</p>
                  </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmBatchAction}
                  disabled={loading}
                  className={cn("flex-[2] h-12 rounded-2xl bg-[#264384] text-white hover:bg-[#1e3569] uppercase text-[11px] tracking-widest shadow-lg transition-transform active:scale-95", archivoBlack.className)}
                >
                  {loading ? "Processing..." : `Confirm & ${batchActionType === 'forward' ? 'Forward' : 'Reject'}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
