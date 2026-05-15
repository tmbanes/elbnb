"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Accommodation, Unit } from "@/types/accommodation_units";
import { ViewAccommodation } from "@/components/SearchAccommodations";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface StudentAccommodationsPreviewProps {
    initialAccommodations: Accommodation[];
}

export function StudentAccommodationsPreview({ initialAccommodations }: StudentAccommodationsPreviewProps) {
    const router = useRouter();
    const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);

    const { data: units, isValidating: isLoadingUnits } = useSWR<Unit[]>(
        selectedAccommodation 
            ? `/api/shared/dashboard/tiles?type=units-by-accommodation&accommodationId=${selectedAccommodation.accommodation_id}` 
            : null,
        fetcher
    );

    if (selectedAccommodation) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#F6F8D5] overflow-y-auto">
                <ViewAccommodation
                    accommodation={selectedAccommodation}
                    units={units || []}
                    onBack={() => setSelectedAccommodation(null)}
                    onApply={() => router.push(`/student/accommodations/application?id=${selectedAccommodation.accommodation_id}`)}
                    userRole="student"
                />
            </div>
        );
    }

    return (
        <section className="mb-14 bg-white rounded-[40px] p-8 md:p-12 border border-[#eef1d6] shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F6F8D5]/40 rounded-full blur-3xl"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-[2px] bg-[#709849]"></span>
                        <h3 className="text-[11px] font-extrabold text-[#709849] tracking-[0.25em] uppercase">Student-Friendly Stays</h3>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#2A3F2D] tracking-tight">Accommodations</h2>
                    <p className="text-[14px] text-slate-500 font-medium mt-2 max-w-md">Curated options for students including campus residence halls.</p>
                </div>
                <button
                    onClick={() => router.push("/student/accommodations")}
                    className="flex items-center gap-2 text-[#557F44] font-black text-[13px] hover:translate-x-1 transition-all bg-white px-7 py-3.5 rounded-2xl border border-[#eef1d6] shadow-sm hover:shadow-md"
                >
                    Explore All Accommodations <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                {initialAccommodations.length > 0 ? (
                    initialAccommodations.slice(0, 3).map((dorm, i) => (
                        <div key={i} className="bg-[#F9FBEC] rounded-[32px] overflow-hidden border border-slate-100/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)] group hover:shadow-2xl hover:shadow-[#709849]/5 transition-all duration-500">
                            <div className="h-44 relative overflow-hidden bg-[#F8F9EC]">
                                <div className="w-full h-full bg-[#F6F8D5]/30 group-hover:scale-110 transition-transform duration-700 flex items-center justify-center">
                                    {dorm.image ? (
                                        <Image 
                                            src={dorm.image} 
                                            alt={dorm.name} 
                                            fill 
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-[#709849]/20" />
                                    )}
                                </div>
                                <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl text-[11px] font-black text-[#2A3F2D] shadow-lg z-10">
                                    Available
                                </div>
                            </div>
                            <div className="p-8">
                                <h4 className="text-[18px] font-bold text-[#2A3F2D] mb-1.5">{dorm.name}</h4>
                                <p className="text-[10px] font-extrabold text-[#709849] uppercase tracking-[0.15em] mb-6">{dorm.accommodation_type === 'dormitory' ? 'UP RESIDENCE HALL' : (dorm.property_type || 'PRIVATE STAY')}</p>
                                <button
                                    onClick={() => setSelectedAccommodation(dorm)}
                                    className="w-full py-3.5 bg-[#6492A7] hover:bg-[#4f7b8f] text-white text-[13px] font-bold rounded-2xl transition-all active:scale-[0.98] shadow-md shadow-[#6492A7]/10 flex items-center justify-center gap-2"
                                >
                                    {isLoadingUnits && selectedAccommodation?.accommodation_id === dorm.accommodation_id ? "Loading..." : "Details"}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium italic">No accommodations available at the moment.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
