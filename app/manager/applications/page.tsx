"use client";

import { useState, useEffect, useCallback } from "react";
import ReviewApplication from "./ReviewApplication";
import {
  fetchManagerApplications,
  updateApplicationStatus,
  type Application,
  type ManagerAction,
} from "@/lib/actions/manager-application-actions";
import { Unit } from "@/types/accommodation_units";

// ─── ApplicationRow ───────────────────────────────────────────────────────────
function ApplicationRow({
  app,
  units,
  onAction,
  onClick,
  isSelected,
}: {
  app: Application;
  units: Unit[];
  onAction: (
    id: string,
    action: ManagerAction,
    unitId?: string,
  ) => Promise<void>;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ManagerAction | null>(
    null,
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  async function handleConfirm() {
    if (!confirmAction) return;

    if (confirmAction === "forward" && !selectedUnitId) {
      setError("Please select a unit before forwarding.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onAction(
        app.application_id,
        confirmAction,
        confirmAction === "forward" ? selectedUnitId : undefined,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 border
        ${
          isSelected
            ? "bg-[#f3f6dc] border-[#44291B] shadow-md"
            : "bg-[#FDFFF4] border-gray-200 hover:bg-[#F6F8D5] hover:shadow-md hover:border-[#c9c3a8]"
        }
      `}
    >
      {/* Applicant */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-[#44291B]">
            {app.users?.first_name || "Unknown"}{" "}
            {app.users?.last_name || "User"}
          </p>
          <p className="text-xs text-[#44291B]/70">
            {app.users?.email || "No email provided"}
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 whitespace-nowrap">
          Pending Review
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#44291B]">
        <div>
          <span className="block text-[#44291B] uppercase tracking-wide mb-0.5">
            Unit Type
          </span>
          <span className="capitalize">{app.preferred_unit_type}</span>
        </div>
        <div>
          <span className="block text-[#44291B] uppercase tracking-wide mb-0.5">
            Check-in
          </span>
          <span>{app.check_in}</span>
        </div>
        <div>
          <span className="block text-[#44291B] uppercase tracking-wide mb-0.5">
            Check-out
          </span>
          <span>{app.check_out}</span>
        </div>
        <div>
          <span className="block text-[#44291B] uppercase tracking-wide mb-0.5">
            Duration
          </span>
          <span>
            {app.duration_of_stay} month
            {Number(app.duration_of_stay) !== 1 ? "s" : ""}
          </span>
        </div>
        <div>
          <span className="block text-[#44291B] uppercase tracking-wide mb-0.5">
            Companions
          </span>
          <span>{app.number_of_companions}</span>
        </div>
        <div>
          <span className="block text-[#44291B] uppercase tracking-wide mb-0.5">
            Date Submitted
          </span>
          <span>{app.date_submitted}</span>
        </div>
      </div>

      {/* Confirm prompt */}
      {confirmAction && (
        <div
          className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4 ${
            confirmAction === "forward"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="text-sm font-medium text-gray-700 text-center">
            <span>
              {confirmAction === "forward"
                ? "Forward this application to the admin for final approval?"
                : "Reject this application? This cannot be undone."}
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setSelectedUnitId(""); // Reset unit on cancel
                  setError(null);
                }}
                disabled={loading}
                className="px-2 py-1 rounded border border-gray-300 bg-white text-[#44291B] hover:bg-[#F6F8D5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-2 py-1 rounded text-white cursor-pointer disabled:opacity-50 ${
                  confirmAction === "forward"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "..." : "Confirm"}
              </button>
            </div>
          </div>

          {confirmAction === "forward" && (
            <div className="flex items-center gap-2 pt-2 border-t border-green-200/50 mt-1">
              <label className="font-medium text-green-900">Assign Unit:</label>
              <select
                value={selectedUnitId}
                onChange={(e) => {
                  setSelectedUnitId(e.target.value);
                  setError(null); // Clear error when they select something
                }}
                disabled={loading}
                className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-[#44291B] flex-1 max-w-[200px]"
              >
                <option value="">-- Choose a unit --</option>
                {units.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    {unit.unit_number}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!confirmAction && (
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmAction("forward")}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-green-100 border-green-20 hover:bg-green-200 disabled:opacity-50 text-green-700 rounded transition-colors cursor-pointer"
          >
            Forward to Admin
          </button>
          <button
            onClick={() => setConfirmAction("reject")}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-[#FEE2E2] hover:bg-[#FCA5A5] disabled:opacity-50 text-red-600 rounded transition-colors cursor-pointer"
          >
            Reject
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </p>
      )}
    </div>
    
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManagerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [accommodationName, setAccommodationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const pagePadding = selectedApp
  ? "px-10 sm:px-12"   // split view
  : "px-24";           // full view

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { accommodation, applications: apps, units: fetchedUnits } =
        await fetchManagerApplications();
        
      setAccommodationName(accommodation.name);
      setApplications(apps);
      console.log(`applcations: ${applications}`); // DEBUG
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
  }

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#F6F8D5]">

      {/* LEFT SIDE (LIST) */}
      <div className={`flex-[7] overflow-y-auto py-10 flex flex-col gap-6 ${pagePadding}`}>
        
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-[32px] font-bold text-[#44291B]">
            Applications for Review
          </h1>
          <p className="text-sm text-[#44291B]/70">
            {accommodationName
              ? `${accommodationName} — pending your review`
              : "Loading your assigned accommodation..."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <p className="text-center text-[#44291B] py-20 text-sm">
            Loading applications...
          </p>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-20 text-[#44291B]">
            <p className="text-sm">No applications pending your review.</p>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <>
            <p className="text-sm text-[#44291B]/70">
              {applications.length} application
              {applications.length !== 1 ? "s" : ""} pending review
            </p>

            <div className="flex flex-col gap-3">
              {applications.map((app) => (
                <ApplicationRow
                  key={app.application_id}
                  units={units}
                  app={app}
                  onAction={handleAction}
                  onClick={() => setSelectedApp(app)}
                  isSelected={selectedApp?.application_id === app.application_id}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE (DETAIL PANEL) */}
      {selectedApp && (
        <div className="flex-[3] border-l border-gray-200 overflow-y-auto">
          <ReviewApplication
            application={selectedApp}
            applicationId={selectedApp.application_id}
            units={units}
            onAction={handleAction}
            onClose={() => setSelectedApp(null)}
          />
        </div>
      )}

    </div>
  );
}
