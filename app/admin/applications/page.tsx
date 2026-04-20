"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchAdminApplications,
  processApplication,
  type AdminApplication,
  type AdminAction,
  type Unit,
} from "@/lib/actions/admin-application-actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function availableUnits(units: Unit[], preferredType: string): Unit[] {
  return units.filter(
    (u) =>
      u.unit_status === "active" &&
      u.current_occupancy < u.max_occupancy &&
      u.unit_type === preferredType
  );
}

// ─── ApplicationCard ──────────────────────────────────────────────────────────
function ApplicationCard({
  app,
  onAction,
}: {
  app: AdminApplication;
  onAction: (
    id: string,
    action: AdminAction,
    unitId?: string
  ) => Promise<void>;
}) {
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [confirmAction, setConfirmAction] = useState<AdminAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const units = availableUnits(
    app.accommodation?.unit ?? [],
    app.preferred_unit_type
  );

  // Also show units of any type if none match preferred
  const allAvailableUnits = (app.accommodation?.unit ?? []).filter(
    (u) => u.unit_status === "active" && u.current_occupancy < u.max_occupancy
  );

  const displayUnits = units.length > 0 ? units : allAvailableUnits;

  async function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction === "approve" && !selectedUnitId) {
      setError("Please select a unit before approving.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onAction(
        app.application_id,
        confirmAction,
        confirmAction === "approve" ? selectedUnitId : undefined
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      setLoading(false);
      setConfirmAction(null);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
      {/* Applicant + accommodation */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {app.users.first_name} {app.users.last_name}
          </p>
          <p className="text-xs text-gray-500">{app.users.email}</p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap">
          Pending Admin
        </span>
      </div>

      {/* Accommodation name */}
      <div className="text-xs text-gray-500">
        <span className="text-gray-400 uppercase tracking-wide">Accommodation: </span>
        <span className="text-gray-700 font-medium">
          {app.accommodation?.name ?? app.preferred_accommodation}
        </span>
        {app.accommodation?.location && (
          <span className="text-gray-400"> — {app.accommodation.location}</span>
        )}
      </div>

      {/* Application details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
        <div>
          <span className="block text-gray-400 uppercase tracking-wide mb-0.5">
            Unit Type
          </span>
          <span className="capitalize">{app.preferred_unit_type}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide mb-0.5">
            Check-in
          </span>
          <span>{app.check_in}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide mb-0.5">
            Check-out
          </span>
          <span>{app.check_out}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide mb-0.5">
            Duration
          </span>
          <span>
            {app.duration_of_stay} month
            {Number(app.duration_of_stay) !== 1 ? "s" : ""}
          </span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide mb-0.5">
            Companions
          </span>
          <span>{app.number_of_companions}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide mb-0.5">
            Date Submitted
          </span>
          <span>{app.date_submitted}</span>
        </div>
      </div>

      {/* Unit selection — only shown for approve flow */}
      {(!confirmAction || confirmAction === "approve") && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Assign Unit{" "}
            <span className="text-red-500">*</span>
            {units.length === 0 && allAvailableUnits.length > 0 && (
              <span className="ml-1 text-yellow-600">
                (no {app.preferred_unit_type} units available — showing all)
              </span>
            )}
          </label>
          {displayUnits.length === 0 ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              No available units for this accommodation. Cannot approve.
            </p>
          ) : (
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Select a unit --</option>
              {displayUnits.map((u) => (
                <option key={u.unit_id} value={u.unit_id}>
                  Unit {u.unit_number} — {u.unit_type} — ₱
                  {Number(u.rental_fee).toLocaleString()}/{u.billing_period} —{" "}
                  {u.current_occupancy}/{u.max_occupancy} occupied
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Confirm prompt */}
      {confirmAction && (
        <div
          className={`rounded px-3 py-2 text-xs flex items-center justify-between gap-3 ${
            confirmAction === "approve"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <span>
            {confirmAction === "approve"
              ? `Approve and assign to Unit ${
                  displayUnits.find((u) => u.unit_id === selectedUnitId)
                    ?.unit_number ?? "—"
                }? This will create an assignment record.`
              : "Reject this application? This cannot be undone."}
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirmAction(null)}
              disabled={loading}
              className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`px-2 py-1 rounded text-white cursor-pointer disabled:opacity-50 ${
                confirmAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? "..." : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!confirmAction && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!selectedUnitId) {
                setError("Please select a unit before approving.");
                return;
              }
              setError(null);
              setConfirmAction("approve");
            }}
            disabled={loading || displayUnits.length === 0}
            className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded transition-colors cursor-pointer"
          >
            Approve & Assign
          </button>
          <button
            onClick={() => {
              setError(null);
              setConfirmAction("reject");
            }}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 rounded transition-colors cursor-pointer"
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
export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { applications: apps } = await fetchAdminApplications();
      setApplications(apps);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load applications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(
    id: string,
    action: AdminAction,
    unitId?: string
  ) {
    await processApplication(id, action, unitId);
    // Remove from list — it's no longer pending_admin
    setApplications((prev) => prev.filter((a) => a.application_id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-xl font-semibold text-gray-900">
          Applications for Final Approval
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review applications forwarded by dormitory managers and assign units.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <p className="text-center text-gray-400 py-20 text-sm">
            Loading applications...
          </p>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">No applications pending final approval.</p>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <>
            <p className="text-sm text-gray-500">
              {applications.length} application
              {applications.length !== 1 ? "s" : ""} awaiting final approval
            </p>
            <div className="flex flex-col gap-4">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.application_id}
                  app={app}
                  onAction={handleAction}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
