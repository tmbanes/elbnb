"use client";

import { useState } from "react";
import ApplicationList from "./ApplicationList";
import ReviewApplication from "./ReviewApplication";

export default function Page() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-white">

      {/* TABLE */}
      <ApplicationList onSelect={setSelectedId} />

      {/* OVERLAY DETAIL PANEL */}
      {selectedId && (
        <div className="fixed inset-0 bg-black/40 flex justify-end">
          <div className="w-[600px] bg-white h-full shadow-xl relative">
            <ReviewApplication
              applicationId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}