"use client";

import ApplicationPreview from "./ApplicationPreview";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { ChevronLeft, Mail, MapPin, Pencil, Trash2, Calendar } from "lucide-react"

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
  const [showPreview, setShowPreview] = useState(false);

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
      <div className="flex items-start justify-between">

        {/* CLOSE BUTTON */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#44291B] hover:bg-[#e8e2d6] shrink-0"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Close
        </Button>

      </div>

      {/* STUDENT INFO */}
      <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm">
        <CardContent className="px-5 py-4 space-y-4">

          {/* TOP INFO */}
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Student Information
          </h3>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-[#e8edf7] flex items-center justify-center font-bold text-[#264384]">
              {data.firstName[0]}{data.lastName[0]}
            </div>

            {/* NAME + DETAILS */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="truncate">
                <h1 className="text-xl font-bold text-[#44291B] leading-tight truncate">
                  {data.firstName} {data.lastName}
                </h1>
                <p className="text-xs text-[#44291B]/70">
                  Application #{data.id.slice(0, 8)} • {data.status}
                </p>
              </div>

              {/* EMAIL + DATE SUBMITTED */}
              <div className="flex flex-wrap gap-2 min-w-0">
                  
                  <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-xs text-[#264384] max-w-full">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{data.email}</span>
                  </span>
                  
                  <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-xs text-[#264384] max-w-full">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate">Submitted: {data.submitted}</span>
                  </span>
                  
                </div>

            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-5 space-y-6">

        {/* STAY DETAILS */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Stay Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label font-semibold">Duration:</p>
              <p>{data.stay.duration}</p>
            </div>

            <div>
              <p className="label font-semibold">Companions:</p>
              <p>{data.stay.companions}</p>
            </div>

            <div>
              <p className="label font-semibold">Check-in:</p>
              <p>{data.stay.checkIn}</p>
            </div>

            <div>
              <p className="label font-semibold">Check-out:</p>
              <p>{data.stay.checkOut}</p>
            </div>
          </div>
        </div>

        {/* ACCOMMODATION */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Accommodation Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label font-semibold">Accommodation:</p>
              <p>{data.stay.dorm}</p>
            </div>

            <div>
              <p className="label font-semibold">Room Type:</p>
              <p>{data.stay.roomType}</p>
            </div>
          </div>

          <select
            className="w-full border rounded-md p-2 text-sm mt-2"
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
          >
            <option value="">Assign unit</option>
            {appData?.availableUnits?.map((unit: any) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                {unit.unit_number}
              </option>
            ))}
          </select>
        </div>

        {/* DOCUMENTS */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Uploaded Documents
          </h3>

          <div className="space-y-2">
            {data.documents.map((doc, i) => (
              <div
                key={i}
                className="flex justify-between items-center border rounded-md px-3 py-2"
              >
                <span>{doc}</span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                >
                  Preview
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL (ONLY ONCE) */}
        {showPreview && (
          <ApplicationPreview onClose={() => setShowPreview(false)} />
        )}

        {/* HISTORY */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Application History
          </h3>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {data.history.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

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
                    className="bg-green-100 text-green-700 border-green-20 flex-1"
                    onClick={() => setConfirmAction("approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-red-600 flex-1"
                    onClick={() => setConfirmAction("reject")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

      </Card>

    </div>
  );
}
