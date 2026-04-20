"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Make sure your path and exports match your project structure
import {
  fetchAdminApplications,
  processApplication,
  type AdminApplication,
  type AdminAction,
  type Unit,
} from "@/lib/actions/admin-application-actions";

export default function ReviewApplication({ 
    applicationId,
  onAction, 
  onClose 
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
                applicationId, // Uses the real ID from your props
                confirmAction,
                confirmAction === "approve" ? selectedUnitId : undefined
            );
            // Optionally close modal on success
            onClose(); 
        } catch (e) {
            setError(e instanceof Error ? e.message : "Action failed.");
            setLoading(false);
            setConfirmAction(null);
        }
    }

    // (TEMPORARY) Hardcoded data for visual mockup. 
    // Replace these fields with {app.first_name}, {app.check_in}, etc., once your real data is ready.
    const data = {
        id: applicationId|| "0001",
        status: "Pending",
        submitted: "April 01, 2026 - 12:00 PM",
        firstName: "Juan",
        lastName: "Dela Cruz",
        middleName: "Santos",
        email: "student@up.edu.ph",
        contact: "09123456789",
        program: "BS Computer Science",
        year: "Sophomore",
        studentNum: "2022-12345",
        stay: {
            duration: "6 months",
            checkIn: "2026-04-05",
            checkOut: "2026-11-29",
            companions: "Solo",
            dorm: "Women's Dorm",
            roomType: "Solo dorm",
        },
        accommodation: {
            name: "Men's Dorm",
            unit: "Unit 203",
            roommates: 0,
        },
        documents: [
            "Valid ID",
            "Application Form",
            "Billing Statement",
        ],
        history: [
            "Application Submitted - Jan 10, 2026",
            "ID Verified - Jan 12, 2026",
        ],
    };

    return (
        <div className="p-6 space-y-6 bg-[#F6F8D5] h-full overflow-y-auto">
            {/* HEADER */}
            <div>
              <h2 className="text-2xl font-bold">
                Application #{data.id.slice(0, 8)} (Status: {data.status})
              </h2>
              <p className="text-sm text-gray-600">Submitted {data.submitted}</p>
              <Button variant="outline" className="mt-2" onClick={onClose}>Close</Button>
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
                          {data.firstName} {data.middleName} {data.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{data.studentNum}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p>{data.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Year Level</p>
                        <p>{data.year}</p>
                    </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p>{data.program}</p>
                </div>
            </Card>

            {/* STAY DETAILS */}
            <Card className="p-4 space-y-4">
                <h3 className="font-semibold text-lg">Stay Details</h3>
                <p><b>Duration:</b> {data.stay.duration}</p>
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
                <p><b>Companions:</b> {data.stay.companions}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Preferred Dorm</p>
                        <p>{data.stay.dorm}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Room Type</p>
                        <p>{data.stay.roomType}</p>
                    </div>
                </div>
            </Card>

            {/* ACCOMMODATION */}
            <Card className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">Accommodation Details</h3>
                <p>
                    Name: {data.accommodation.name} &nbsp;&nbsp; | &nbsp;&nbsp;
                    Unit: {data.accommodation.unit} &nbsp;&nbsp; | &nbsp;&nbsp;
                    Roommates: {data.accommodation.roommates}
                </p>
            </Card>

            {/* DOCUMENTS */}
            <Card className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">Uploaded Documents</h3>
                {data.documents.map((doc, i) => (
                    <div key={i} className="flex justify-between border p-2 rounded items-center">
                        <span>{doc}</span>
                        <Button size="sm" variant="outline">Preview</Button>
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
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {confirmAction ? (
                    <Card className="p-4 bg-white border-blue-200 space-y-4">
                        <p className="font-medium text-gray-900">
                            {confirmAction === "approve" 
                                ? "Assign a Unit and Approve Application" 
                                : "Are you sure you want to reject this application? This cannot be undone."}
                        </p>

                        {/* Show unit selector only if approving */}
                        {confirmAction === "approve" && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Select Unit</label>
                                <select 
                                    className="border rounded-md p-2 text-sm w-full bg-white"
                                    value={selectedUnitId}
                                    onChange={(e) => {
                                        setSelectedUnitId(e.target.value);
                                        setError(null);
                                    }}
                                    disabled={loading}
                                >
                                    <option value="">-- Choose a unit --</option>
                                    <option value="unit-101">Unit 101</option>
                                    <option value="unit-102">Unit 102</option>
                                    <option value="unit-103">Unit 103</option>
                                    {/* Map your real units here: units.map(u => <option key={u.id} value={u.id}>{u.name}</option>) */}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setConfirmAction(null);
                                    setError(null);
                                }} 
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className={confirmAction === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Confirm"}
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="flex gap-4">
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                            onClick={() => setConfirmAction("approve")}
                        >
                            Approve
                        </Button>
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                            onClick={() => setConfirmAction("reject")}
                        >
                            Reject
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}