"use client";

import { useEffect, useState } from "react";
import ResidentList from "./ResidentList";
import ResidentDetail from "./ResidentDetail";
import { Loader2 } from "lucide-react";

import { Resident } from "./types";
import { DUMMY_RESIDENTS } from "./dummyData";

interface AccommodationOption {
    accommodation_id: string;
    name: string;
}

interface Props {
    apiEndpoint?: string;
    title?: string;
}

export default function ResidentManagement({ apiEndpoint = "/api/admin/residents", title = "Resident Management" }: Props) {
    const [residents, setResidents] = useState<Resident[]>(DUMMY_RESIDENTS);
    const [selectedId, setSelectedId] = useState<string | null>(DUMMY_RESIDENTS[0]?.assignment_id || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [accommodations] = useState<AccommodationOption[]>([
        { accommodation_id: "acc-1", name: "University Hall" },
        { accommodation_id: "acc-2", name: "Garden Residences" },
        { accommodation_id: "acc-3", name: "Sunrise Apartments" },
        { accommodation_id: "acc-4", name: "Greenwood Oaks" },
        { accommodation_id: "acc-5", name: "Skyline Tower" }
    ]);

    const selectedResident = residents.find(r => r.assignment_id === selectedId) || null;

    // Fetch residents on mount - DISABLED FOR DUMMY DATA
    /*
    useEffect(() => {
      async function fetchResidents() {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(apiEndpoint);
  
          const contentType = response.headers.get('content-type');
          let data;
          
          try {
            data = contentType?.includes('application/json') ? await response.json() : { error: await response.text() };
          } catch (parseErr) {
            data = { error: `Failed to parse response: ${(parseErr as Error).message}` };
          }
  
          if (!response.ok) {
            const errorMsg = data.error || `Failed to fetch residents: ${response.statusText}`;
            throw new Error(errorMsg);
          }
  
          if (data.success && Array.isArray(data.data)) {
            setResidents(data.data);
            // Select first resident if available
            if (data.data.length > 0 && !selectedId) {
              setSelectedId(data.data[0].assignment_id);
            }
          } else if (!data.success) {
            throw new Error(data.error || 'Failed to fetch residents');
          }
        } catch (err) {
          console.error("Error fetching residents:", err);
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }
  
      fetchResidents();
    }, [apiEndpoint]);
    */


    async function handleAction(assignmentId: string, action: string, date: string, details?: any) {
        // Dummy action handler
        setResidents(prev => prev.map(r => {
            if (r.assignment_id === assignmentId) {
                if (action === "record-move-in") {
                    return { ...r, assignment_status: "active", move_in_date: date };
                }
                if (action === "record-move-out") {
                    return { ...r, assignment_status: "completed", actual_move_out_date: date };
                }
                if (action === "terminate") {
                    return { ...r, assignment_status: "terminated", actual_move_out_date: date };
                }
                if (action === "override") {
                    // Simulate transfer
                    return {
                        ...r,
                        unit: {
                            ...r.unit,
                            unit_number: details?.targetUnit || r.unit.unit_number
                        }
                    };
                }
            }
            return r;
        }));
    }




    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#264384] animate-spin" />
                    <p className="text-[#44291B]/60 font-medium">Loading residents...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#44291B]">Error Loading Residents</h2>
                    <p className="text-sm text-[#44291B]/60">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-[#264384] text-white font-bold rounded-lg hover:bg-[#1a2d5a] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex overflow-hidden bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">
            {/* LEFT: Resident List */}
            <div className={`
        flex-1 min-w-0 
        transition-all duration-300
        overflow-y-auto
        ${selectedId ? "hidden lg:block" : "block"}
      `}>
                <ResidentList
                    residents={residents}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    title={title}
                    accommodations={accommodations}
                />
            </div>

            {/* RIGHT: Detail View */}
            <div className={`
        w-full lg:w-[450px]
        border-l border-[#e8e2d6]
        bg-[#F6F8D5]
        transition-all duration-300
        overflow-y-auto
        flex flex-col
        ${selectedId ? "block" : "hidden lg:flex"}
      `}>
                {selectedResident ? (
                    <ResidentDetail
                        resident={selectedResident}
                        onAction={handleAction}
                        onBack={() => setSelectedId(null)}
                        isLoading={actionLoading}
                        showOverride={true}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center p-12 text-center">
                        <div className="max-w-sm space-y-3">
                            <div className="w-16 h-16 bg-[#ebf2f4] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🏘️</span>
                            </div>
                            <h2 className="text-xl font-bold text-[#44291B]">No Resident Selected</h2>
                            <p className="text-sm text-[#44291B]/60 leading-relaxed">
                                Select a resident from the list to view their accommodation history, move-in status, and manage their stay.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
