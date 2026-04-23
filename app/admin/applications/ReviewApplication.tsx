"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Make sure your path and exports match your project structure
import {
  fetchAdminApplications,
  processApplication,
  type AdminApplication,
  type AdminAction,
  getApplicationById,
  type Unit,
} from "@/lib/actions/admin-application-actions";

export default function ReviewApplication({
  applicationId,
  onAction,
  onClose,
}: {
  applicationId: string;
  onAction: (id: string, action: AdminAction, unitId?: string) => Promise<void>;
  onClose: () => void;
}) {
  // --- NEW STATE & LOGIC ---
  const [confirmAction, setConfirmAction] = useState<AdminAction | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appData, setAppData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingData(true);
        const data = await getApplicationById(applicationId);
        setAppData(data);

        if (data?.unit_id) {
          setSelectedUnitId(data.unit_id);
        }
      } catch (err) {
        console.error("Failed to fetch app data:", err);
        setError("Failed to load application details.");
      } finally {
        setIsLoadingData(false);
      }
    }

    if (applicationId) {
      loadData();
    }
  }, [applicationId]);

  if (isLoadingData) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-[#F6F8D5]">
        <p className="animate-pulse text-gray-600">Loading Application...</p>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="p-6 bg-[#F6F8D5]">
        <p className="text-red-600">Error: Could not find application data.</p>
        <Button onClick={onClose} variant="outline" className="mt-4">
          Close
        </Button>
      </div>
    );
  }

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
        applicationId,
        confirmAction,
        confirmAction === "approve" ? selectedUnitId : undefined,
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      setLoading(false);
      setConfirmAction(null);
    }
  }

  const userData = Array.isArray(appData?.users) ? appData.users[0] : appData?.users;
  console.log(userData)

  const data = {
    id: appData?.application_id || "",
    status: appData?.application_status || "Pending",
    submitted: new Date(appData.date_submitted).toLocaleDateString(),
    unit: appData.units?.unit_number || "Not yet assigned",

    firstName: userData?.first_name || "Unknown",
    lastName: userData?.last_name || "",
    email: userData?.email || "No email",

    stay: {
      duration: `${appData.duration_of_stay} months`,
      checkIn: appData.check_in,
      checkOut: appData.check_out,
      companions: appData.number_of_companions || "Solo",
      dorm: appData.accommodation?.name || "Unassigned",
      roomType: appData.preferred_unit_type,
    },

    // These might need to be fetched from a separate table later!
    documents: ["Application Form"],
    history: [
      `Application Submitted - ${new Date(appData.date_submitted).toLocaleDateString()}`,
    ],
  };

  console.log(appData.users);
  return (
    <div className="p-6 space-y-6 bg-[#F6F8D5] h-full overflow-y-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold">
          Application #{data.id.slice(0, 8)} (Status: {data.status})
        </h2>
        <p className="text-sm text-gray-600">Submitted {data.submitted}</p>
        <Button variant="outline" className="mt-2" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* STUDENT INFO */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-lg">Student Information</h3>
        <div className="flex gap-4 items-center">
          <img
            src="/default-avatar.png"
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover bg-gray-200"
          />
          <div>
            <p className="font-semibold">
              {data.firstName} {data.lastName}
            </p>
            {/* <p className="text-sm text-gray-600">{data.studentNum}</p> */}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p>{data.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Year Level</p>
            {/* <p>{data.year}</p> */}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Course</p>
          {/* <p>{data.program}</p> */}
        </div>
      </Card>

      {/* STAY DETAILS */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-lg">Stay Details</h3>
        <p>
          <b>Duration:</b> {data.stay.duration}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Check-in</p>
            <p>{data.stay.checkIn}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Check-out</p>
            <p>{data.stay.checkOut}</p>
          </div>
        </div>
        <p>
          <b>Companions:</b> {data.stay.companions}
        </p>
      </Card>

      {/* ACCOMMODATION */}
      <Card className="p-4 space-y-4 border-[#e8e2d6] bg-white">
        <h3 className="font-semibold text-gray-800 border-b pb-2">
          Accommodation Assignment
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">
              Preferred Dorm
            </p>
            <p className="font-medium">{data.stay.dorm}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">
              Room Type
            </p>
            <p className="font-medium">{data.stay.roomType}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold uppercase text-gray-500">
            Assign Unit
          </label>
          <select
            className="w-full border rounded-md p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all"
            value={selectedUnitId}
            onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setError(null);
            }}
            disabled={loading}
          >
            <option value="">-- Choose a unit --</option>
            {appData?.availableUnits?.map((unit: any) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                {unit.unit_number} ({unit.unit_type})
              </option>
            ))}
          </select>
          {appData?.availableUnits?.length === 0 && (
            <p className="text-[10px] text-red-500">
              No available units found for this building.
            </p>
          )}
        </div>
      </Card>

      {/* DOCUMENTS */}
      <Card className="p-4 space-y-2">
        <h3 className="font-semibold text-lg">Uploaded Documents</h3>
        {data.documents.map((doc, i) => (
          <div
            key={i}
            className="flex justify-between border p-2 rounded items-center"
          >
            <span>{doc}</span>
            <Button size="sm" variant="outline">
              Preview
            </Button>
          </div>
        ))}
      </Card>

      {/* HISTORY */}
      <Card className="p-4 space-y-2">
        <h3 className="font-semibold text-lg">Application History</h3>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {data.history.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Card>

      {/* ACTIONS & CONFIRMATION SECTION */}
      <div className="pt-4 border-t border-gray-300">
        {data.status === "pending_payment" ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              ✓ Application Approved
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Status updated to: <b>Pending Payment</b>. The user has been notified to settle their dues.
            </p>
          </div>
        ) : data.status === "approved" ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
              ✓ Application Approved
            </p>
            <p className="text-xs text-green-600 mt-1">
              This application has been finalized and a unit has been assigned.
            </p>
          </div>
        ) : data.status === "rejected" ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
              Application Rejected
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-xs">
                {error}
              </div>
            )}

            {confirmAction ? (
              <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
                <p className="text-sm font-medium text-gray-700 text-center">
                  {confirmAction === "approve"
                    ? "Finalize approval for this unit?"
                    : "Confirm rejection of this application?"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setConfirmAction(null);
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 text-white ${confirmAction === "approve"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                      }`}
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? "..." : "Confirm"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  onClick={() => setConfirmAction("approve")}
                >
                  Approve
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  onClick={() => setConfirmAction("reject")}
                >
                  Reject
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
