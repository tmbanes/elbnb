"use client";

import { useState } from "react";
import ApplicationList from "./ApplicationList";
import ReviewApplication from "./ReviewApplication";
import {
    processApplication,
    type AdminAction,
} from "@/lib/actions/admin-application-actions";
import { cn } from "@/lib/utils";

interface ApplicationsClientProps {
    user: any;
    initialData: any;
}

export default function ApplicationsClient({ user, initialData }: ApplicationsClientProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleApplicationAction = async (
        id: string,
        action: AdminAction,
        unitId?: string,
    ) => {
        try {
            await processApplication(id, action, unitId);
            setSelectedId(null);
            // Optional: You might want to refresh initialData here or rely on state
        } catch (error) {
            throw error;
        }
    };

    return (
        <div className="h-[100dvh] flex overflow-hidden bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">

            {/* LEFT SIDE (LIST) */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out",
                selectedId ? "lg:flex-[7]" : "flex-1"
            )}>
                <div className={cn(
                    "h-full flex flex-col pt-10 pb-6 gap-6 transition-all duration-500 overflow-y-auto scrollbar-hide",
                    selectedId ? "px-6 lg:px-12" : "px-6 md:px-12 lg:px-24"
                )}>
                    <ApplicationList onSelect={setSelectedId} selectedId={selectedId} initialData={initialData} />
                </div>
            </div>

            {/* RIGHT SIDE (DETAIL PANEL) */}
            <div className={cn(
                "bg-[#F6F8D5] border-l border-[#e8e2d6] transition-all duration-500 ease-in-out flex flex-col z-20 overflow-hidden",
                selectedId ? "flex-[3] w-full" : "w-0 flex-[0] pointer-events-none opacity-0"
            )}>
                {selectedId && (
                    <ReviewApplication
                        applicationId={selectedId}
                        onClose={() => setSelectedId(null)}
                        onAction={handleApplicationAction}
                    />
                )}
            </div>
        </div>
    );
}
