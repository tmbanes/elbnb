"use client";

import { Property } from "@/types/housing/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface HousingListProps {
  properties: Property[];
  onSelect: (property: Property) => void;
}

export default function HousingList({ properties, onSelect }: HousingListProps) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 font-archivo">
      {properties.map((property) => {
        const isDorm = property.accommodation_type === "dormitory";
        const totalCap = property.total_capacity ?? 0;
        const occupied = property.units?.reduce((a, u) => a + (u.current_occupancy ?? 0), 0) ?? 0;
        const pct = totalCap > 0 ? Math.round((occupied / totalCap) * 100) : 0;

        return (
          <Card
            key={property.accommodation_id}
            onClick={() => onSelect(property)}
            className="shadow-sm bg-[#FDFFF4] border-[#e2e4c0] transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-md cursor-pointer overflow-hidden group"
            style={{ borderTop: `6px solid ${isDorm ? "#5591AB" : "#EB8A0B"}` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-4 min-w-0">
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#44291B] font-archivo-black leading-tight group-hover:text-[#264384] transition-colors truncate">
                    {property.name}
                  </h3>
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
                    className={cn(
                      "text-[9px] uppercase tracking-wider h-5 px-2 font-bold",
                      isDorm
                        ? "bg-[#ebf2f4] text-[#5591AB] border-[#d1e3e8]"
                        : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5dab8]"
                    )}
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
                    className="h-1.5 bg-[#F6F8D5] [&>div]:bg-[#264384]"
                  />
                  <ChevronRight className="w-4 h-4 text-[#264384] opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
