"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Property } from "../../../../../types/housing/types";

//ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ChevronRight, MapPin } from "lucide-react"

interface AssignedPropertiesProps {
  managerId: string;
}

export default function AssignedProperties({ managerId }: AssignedPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAssigned() {
      try {
        setLoading(true);
        const [dormsRes, rentalsRes] = await Promise.all([
          fetch("/api/admin/housing/dorms"),
          fetch("/api/admin/housing/rental-spaces"),
        ]);
        const [dorms, rentals] = await Promise.all([
          dormsRes.json(),
          rentalsRes.json(),
        ]);
        const all = [...(dorms || []), ...(rentals || [])];
        setProperties(all.filter((property: any) => property.manager_id === managerId));
      } catch (err: any) {
        setError(err?.message || "Unable to load assigned properties.");
      } finally {
        setLoading(false);
      }
    }

    fetchAssigned();
  }, [managerId]);

  return (
     <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-bold text-[#44291B]">Assigned Properties</h2>
        <span className="text-xs text-[#8c8b82]">{properties.length} properties</span>
      </div>

      {loading ? (
        <p className="text-sm text-[#6b6a62]">Loading...</p>
      ) : error ? (
        <p className="text-sm text-[#DF3538]">{error}</p>
      ) : properties.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#e2e4c0] bg-[#FDFFF4] p-8 text-center text-sm text-[#8c8b82]">
          No properties assigned.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const isDorm = property.accommodation_type === "dormitory";
            const totalCap = property.total_capacity ?? 0;
            const occupied = property.units?.reduce((a, u) => a + (u.current_occupancy ?? 0), 0) ?? 0;
            const pct = totalCap > 0 ? Math.round((occupied / totalCap) * 100) : 0;

            return (
              <div
                key={property.accommodation_id}
                onClick={() => router.push(`/dashboard/admin/housing/properties?id=${property.accommodation_id}`)}
                className="group bg-[#FDFFF4] border border-[#e2e4c0] rounded-xl overflow-hidden cursor-pointer hover:border-[#264384] hover:-translate-y-0.5 transition-all duration-150"
              >
                {/* Colored top stripe */}
                <div className={`h-[3px] ${isDorm ? "bg-[#5591AB]" : "bg-[#EB8A0B]"}`} />

                <div className="p-3.5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <p className="text-sm font-medium text-[#44291B] leading-tight">{property.name}</p>
                      <div className="flex items-center gap-1 text-[11px] text-[#8c8b82] mt-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {property.location}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                        isDorm ? "bg-[#ebf2f4] text-[#5591AB] border-[#d1e3e8]" : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5dab8]"
                      }`}>
                        {isDorm ? "Dormitory" : "Rental"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide bg-[#F0F6E9] text-[#78A24C] border-[#d8e7c8]">
                        {property.accommodation_status}
                      </span>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div className="border-t border-[#e2e4c0] pt-2.5 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-1.5 bg-[#F6F8D5] rounded-full overflow-hidden">
                        <div className="h-full bg-[#264384] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-[#264384] whitespace-nowrap">
                      {occupied} / {totalCap}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#264384] opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
