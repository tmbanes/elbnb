"use client";

import { useEffect, useState } from "react";
import ResidentList from "@/app/admin/residents/ResidentList";
import ResidentDetail from "@/app/admin/residents/ResidentDetail";
import { Loader2 } from "lucide-react";

import { Resident } from "@/app/admin/residents/types";
import { DUMMY_RESIDENTS } from "@/app/admin/residents/dummyData";


interface Props {
  apiEndpoint?: string;
  title?: string;
}



export default function ResidentManagement({ apiEndpoint = "/api/manager/residents", title = "Resident Management" }: Props) {
  const [residents, setResidents] = useState<Resident[]>(DUMMY_RESIDENTS);
  const [selectedId, setSelectedId] = useState<string | null>(DUMMY_RESIDENTS[0]?.assignment_id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const selectedResident = residents.find(r => r.assignment_id === selectedId) || null;

  // Dummy action handler
  async function handleAction(assignmentId: string, action: string, date: string, details?: any) {
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
      }
      return r;
    }));
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
