"use client";

import { useState } from "react";
import ApplicationList from "./ApplicationList";
import ReviewApplication from "./ReviewApplication";

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
            />
          </div>
        )}

      </div>
    );
}