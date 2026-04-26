"use client";

import { useState, useEffect, useCallback } from "react";
import ReviewApplication from "./ReviewApplication";
import ManagerApplicationList from "./ManagerApplicationList";
import {
  fetchManagerApplications,
  updateApplicationStatus,
  type Application,
  type ManagerAction,
} from "@/lib/actions/manager-application-actions";
import { Unit } from "@/types/accommodation_units";
import { cn } from "@/lib/utils/ui-utils";

export default function ManagerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [accommodationName, setAccommodationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { accommodation, applications: apps, units: fetchedUnits } =
        await fetchManagerApplications();
        
      setAccommodationName(accommodation.name);
      setApplications(apps);
      setUnits(fetchedUnits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: string, action: ManagerAction, unitId?: string) {
    await updateApplicationStatus(id, action, unitId);
    // Remove from list immediately since it's no longer pending_dorm_manager
    setApplications((prev) => prev.filter((a) => a.application_id !== id));
    setSelectedApp(null);
  }

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">
      {/* LEFT SIDE (LIST) */}
      <div className={cn(
        "min-w-0 overflow-y-auto py-8 transition-all duration-500 ease-in-out px-6 md:px-12",
        selectedApp ? "flex-[7]" : "flex-1"
      )}>
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-bold shadow-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <ManagerApplicationList 
          applications={applications}
          loading={loading}
          onSelect={setSelectedApp}
          selectedId={selectedApp?.application_id || null}
          accommodationName={accommodationName}
        />
      </div>

      {/* RIGHT SIDE (DETAIL PANEL) */}
      <div className={cn(
        "border-l border-[#e8e2d6] bg-[#F6F8D5] overflow-y-auto flex flex-col transition-all duration-500 ease-in-out",
        selectedApp ? "flex-[3] opacity-100" : "flex-[0] opacity-0 pointer-events-none border-none"
      )}>
        {selectedApp && (
          <ReviewApplication
            application={selectedApp}
            applicationId={selectedApp.application_id}
            units={units}
            onAction={handleAction}
            onClose={() => setSelectedApp(null)}
          />
        )}
      </div>
    </div>
  );
}
