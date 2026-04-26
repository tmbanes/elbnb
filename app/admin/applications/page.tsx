"use client";

import { useState } from "react";
import ApplicationList from "./ApplicationList";
import ReviewApplication from "./ReviewApplication";
import {
    processApplication,
    type AdminAction,
} from "@/lib/actions/admin-application-actions";
import { cn } from "@/lib/utils";

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

    const handleApplicationAction = async (
        id: string,
        action: AdminAction,
        unitId?: string,
    ) => {
        try {
            // Send the decision to your database
            await processApplication(id, action, unitId);

            // If successful, close the right pane!
            setSelectedId(null);

            alert("Success! Application updated.");
        } catch (error) {
            // Throw the error so the ReviewApplication component can catch it and show the red error box
            throw error;
        }
    };

    return (
        <div className="min-h-screen py-8 px-5 md:px-12 lg:px-30 bg-[#F6F8D5] flex overflow-hidden font-[family-name:var(--font-archivo)]">

            {/* LEFT */}
            <div className={cn(
                "flex-1 min-w-0 overflow-y-auto transition-all duration-300",
                selectedId ? "hidden lg:block" : "block"
            )}>
                <ApplicationList onSelect={setSelectedId} selectedId={selectedId} />
            </div>

            {/* RIGHT */}
            {selectedId && (
                <div className="
                  w-full lg:w-[600px]
                  border-l border-[#e8e2d6]
                  bg-[#F6F8D5]
                  overflow-y-auto
                  flex flex-col
                  transition-all duration-300
                ">
                    <ReviewApplication
                        applicationId={selectedId}
                        onClose={() => setSelectedId(null)}
                        onAction={handleApplicationAction}
                    />
                </div>
            )}
        </div>
    );
}
