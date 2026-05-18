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
                selectedId ? "hidden lg:flex" : "flex-1"
            )}>
                <div className={cn(
                    "h-full flex flex-col pt-10 pb-6 gap-6 transition-all duration-500 overflow-y-auto scrollbar-hide",
                    selectedId ? "px-6 lg:px-12" : "px-4 md:px-12 lg:px-20 xl:px-36"
                )}>
                    <ApplicationList onSelect={setSelectedId} selectedId={selectedId} initialData={initialData} />
                </div>
            </div>

            {/* RIGHT SIDE (DETAIL PANEL) */}
            <div className={cn(
                "fixed lg:relative top-0 right-0 z-50 lg:z-0 h-full lg:h-auto w-full bg-[#F6F8D5] flex flex-col transition-all duration-500 ease-in-out border-[#e8e2d6]",
                selectedId
                    ? "lg:w-[450px] translate-x-0 opacity-100 border-l overflow-y-auto"
                    : "lg:w-0 translate-x-full lg:translate-x-0 opacity-0 lg:pointer-events-none border-l-0 overflow-hidden"
            )}>
                {selectedId && (
                    <div className="w-full lg:w-[450px] shrink-0 h-full flex flex-col">
                        <ReviewApplication
                            applicationId={selectedId}
                            onClose={() => setSelectedId(null)}
                            onAction={handleApplicationAction}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
