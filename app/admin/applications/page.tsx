"use client";

import { useState } from "react";
import ApplicationList from "./ApplicationList";
import ReviewApplication from "./ReviewApplication";
import { processApplication, type AdminAction } from "@/lib/actions/admin-application-actions";

export default function Page() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
        const [leftWidth, setLeftWidth] = useState(65); // % width
        const [isDragging, setIsDragging] = useState(false);

        // HANDLE DRAG
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newWidth = (e.clientX / window.innerWidth) * 100;

            // Limit resizing
            if (newWidth > 40 && newWidth < 80) {
                setLeftWidth(newWidth);
            }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Attach listeners
    if (typeof window !== "undefined") {
        window.onmousemove = handleMouseMove;
        window.onmouseup = handleMouseUp;
    }

    const handleApplicationAction = async (id: string, action: AdminAction, unitId?: string) => {
      try {
          // Send the decision to your database
          await processApplication(id, action, unitId);
          
          // If successful, close the right pane!
          setSelectedId(null);

          // NOTE: You might also want to trigger a refresh of your ApplicationList here
          // so the approved/rejected item disappears from the left side.
          alert("Success! Application updated."); 
      } catch (error) {
          // Throw the error so the ReviewApplication component can catch it and show the red error box
          throw error; 
      }
  };

    return (
        <div className="h-screen flex overflow-hidden">

        {/* LEFT */}
        <div className={`
          ${selectedId ? "w-[65%]" : "w-full"}
          transition-all duration-300
          overflow-y-auto
        `}>
          <ApplicationList onSelect={setSelectedId} />
        </div>

        {/* RIGHT */}
        {selectedId && (
          <div className="
            w-1/3 min-w-[400px]
            border-l border-[#e8e2d6]
            bg-[#F6F8D5]
            transition-all duration-300
            overflow-y-auto
          ">
            <ReviewApplication
              applicationId={selectedId}
              onClose={() => setSelectedId(null)}
              onAction={handleApplicationAction}/>
          </div>
        )}

      </div>
    );
}