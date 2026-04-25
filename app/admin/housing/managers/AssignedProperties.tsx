"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Property } from "../../../../types/housing/types";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, MapPin, Loader2 } from "lucide-react";

interface AssignedPropertiesProps {
  managerId: string;
}

function PropertyCard({
  property,
  isDorm,
  occupied,
  pct,
  totalCap,
  router,
}: {
  property: Property;
  isDorm: boolean;
  occupied: number;
  pct: number;
  totalCap: number;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <Card
      onClick={() => router.push(`/admin/housing?id=${property.accommodation_id}`)}
      className="shadow-sm bg-[#FDFFF4] transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-md cursor-default overflow-hidden" // Added overflow-hidden
      style={{ borderTop: `6px solid ${isDorm ? "#5591AB" : "#EB8A0B"}` }}
    >
      <CardContent className="p-4">

        <div className="flex items-start justify-between gap-2 mb-4 min-w-0">


          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#44291B] leading-tight group-hover:text-[#264384] transition-colors truncate">
              {property.name}
            </h3>

            {/* Location */}
            <div className="flex items-start gap-1 text-[11px] text-[#8c8b82] min-w-0">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              <span className="truncate block" title={property.location}>
                {property.location}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={`text-[9px] uppercase tracking-wider h-5 px-2 font-bold ${isDorm
                ? "bg-[#ebf2f4] text-[#5591AB] border-[#d1e3e8]"
                : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5dab8]"
                }`}
            >
              {isDorm ? "Dormitory" : "Rental"}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] uppercase tracking-wider h-5 px-2 font-bold bg-[#F0F6E9] text-[#78A24C] border-[#d8e7c8]"
            >
              {property.accommodation_status}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 pt-5 border-t border-[#e2e4c0]">

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#264384]">
              Occupancy
            </span>

            <span className="text-[11px] font-medium text-[#44291B]">
              {occupied} / {totalCap}
            </span>
          </div>



          <div className="flex items-center gap-3">
            <Progress
              value={pct}
              className="h-1.5 bg-[#F6F8D5]"
            />
            <ChevronRight className="w-4 h-4 text-[#264384] opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />

          </div>
        </div>
      </CardContent>
    </Card>
  );
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
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 pr-2 pl-2">
        <h2 className="text-sm font-bold text-[#44291B] tracking-wide">
          Assigned Properties
        </h2>
        <p className="text-xs text-[#44291B]">
          {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#264384] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-[#DF3538]">
          {error}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#e2e4c0] bg-[#FDFFF4] p-10 text-center">
          <p className="text-sm text-[#8c8b82] font-medium">No properties assigned to this manager.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {properties.map((property) => {
            const isDorm = property.accommodation_type === "dormitory";
            const totalCap = property.total_capacity ?? 0;
            const occupied = property.units?.reduce((a, u) => a + (u.current_occupancy ?? 0), 0) ?? 0;
            const pct = totalCap > 0 ? Math.round((occupied / totalCap) * 100) : 0;

            return (
              <PropertyCard
                key={property.accommodation_id}
                property={property}
                isDorm={isDorm}
                occupied={occupied}
                pct={pct}
                totalCap={totalCap}
                router={router}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}