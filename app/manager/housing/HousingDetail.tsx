"use client";

import { useState } from "react";
import { Property, Unit } from "@/types/housing/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  MapPin,
  User,
  UserMinus,
  ChevronDown,
  Info
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import ViewUnitModal from "./components/ViewUnitModal";
import PropertyGallery from "@/components/housing/PropertyGallery";

interface HousingDetailProps {
  property: Property;
  onBack: () => void;
  hideBack?: boolean;
}

export default function HousingDetail({ property, onBack, hideBack = false }: HousingDetailProps) {
  const isDorm = property.accommodation_type === "dormitory";
  const totalCapacity = property.total_capacity ?? 0;
  const currentOccupancy = property.units?.reduce(
    (acc, unit) => acc + (unit.current_occupancy ?? 0), 0
  ) ?? 0;
  const occupancyPercentage = totalCapacity > 0
    ? Math.round((currentOccupancy / totalCapacity) * 100)
    : 0;

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 font-archivo">
      {/* Back Button */}
      {!hideBack && (
        <Button
          variant="link"
          onClick={onBack}
          className="pl-0 text-[#264384] hover:text-[#1e3569] font-bold text-sm transition-colors group h-auto py-0"
        >
          <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
      )}

      {/* Property Header & Details Card (Collapsible) */}
      <Collapsible className="group/collapsible" defaultOpen={true}>
        <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
          <CardContent className="px-5 py-4">
            <div className="flex items-center justify-between gap-8 flex-wrap">
              {/* Property Name & Location */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div>
                  <h1 className="text-4xl font-black text-[#44291B] font-archivo-black leading-tight break-words">{property.name}</h1>
                  <div className="flex items-center text-[#6b6a62] text-md mt-0.5 gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="break-words">{property.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                {/* Tags */}
                <div className="flex gap-2">
                  <Badge
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border text-center",
                      isDorm
                        ? "bg-[#ebf2f4] text-[#5591AB] border-[#d1e3e8]"
                        : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5dab8]"
                    )}
                  >
                    {isDorm ? "Dormitory" : "Rental Space"}
                  </Badge>
                  <div className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    property.accommodation_status?.toLowerCase() === "active"
                      ? "bg-[#E7FAD3] text-[#78A24C] border-[#d8e7c8]"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  )}>
                    <span className={cn(
                      "mr-1.5 h-1.5 w-1.5 rounded-full",
                      property.accommodation_status?.toLowerCase() === "active" ? "bg-[#78A24C]" : "bg-gray-400"
                    )} />
                    {property.accommodation_status || "Unknown"}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-12 bg-[#e2e4c0]" />

                {/* Occupancy */}
                <div className="flex flex-col gap-1.5 shrink-0 w-[300px]">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-[#44291B] uppercase tracking-wider">
                        Property Occupancy
                      </span>
                      <p className="text-[10px] text-[#8c8b82] italic leading-tight mb-0.5">
                        {occupancyPercentage}% capacity reached
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#264384] leading-none ml-2 mb-0.5">
                      {currentOccupancy}
                      <span className="text-sm font-normal text-[#8c8b82]"> / {totalCapacity}</span>
                    </span>
                  </div>
                  <Progress
                    value={occupancyPercentage}
                    className="h-2 bg-[#F6F8D5] [&>div]:bg-[#264384]"
                  />
                </div>

                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#F6F8D5] text-[#264384] hover:bg-[#eef2fb]">
                    <ChevronDown className="h-5 w-5 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardContent>

          <CollapsibleContent>
            <div className="px-5 pb-5 pt-0 border-t border-[#e2e4c0] bg-white/30">
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-[#44291B]">
                  <Info className="w-4 h-4" />
                  <h3 className="text-sm font-bold font-archivo-black uppercase tracking-wider">Property Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {isDorm && property.dormitory && (
                    <>
                      <ConfigDetail label="Semesters Allowed" value={String(property.dormitory.number_of_semestersAllowed)} />
                      <ConfigDetail label="Curfew Time" value={property.dormitory.curfew_time || "—"} />
                      <ConfigDetail label="Term Type" value={property.dormitory.term_type} />
                      <ConfigDetail label="Gender Policy" value={property.dormitory.separate_by_gender ? "Separated" : "Mixed"} />
                    </>
                  )}
                  {!isDorm && property.renting_space && (
                    <>
                      <ConfigDetail label="Property Type" value={property.renting_space.property_type} />
                      <ConfigDetail label="Security Deposit" value={property.renting_space.security_deposit_required ? "Required" : "None"} />
                      <ConfigDetail label="Min Stay" value={`${property.renting_space.minimum_stay_days || 0} days`} />
                      <ConfigDetail label="Max Stay" value={`${property.renting_space.maximum_stay_days || 0} days`} />
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <PropertyGallery accommodationId={property.accommodation_id} />
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Units Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-black text-[#44291B] font-archivo-black">Units</h2>
          <p className="text-sm text-[#44291B]">Manage rooms for occupancy</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(property.units ?? []).map((unit) => {
            const isOccupied = unit.current_occupancy > 0;
            return (
              <Card
                key={unit.unit_id}
                onClick={() => handleUnitClick(unit)}
                className="shadow-sm bg-[#FDFFF4] border-[#e2e4c0] transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-md relative overflow-hidden group cursor-pointer"
                style={{ borderTop: `6px solid ${isDorm ? "#5591AB" : "#EB8A0B"}` }}
              >
                <CardContent className="p-3.5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-[#44291B] font-archivo-black">Unit {unit.unit_number}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c8b82]">
                          {unit.unit_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider flex items-center gap-1.5",
                      isOccupied
                        ? (isDorm
                          ? "bg-[#ebf2f4] text-[#5591AB] border-[#d1e3e8]"
                          : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5dab8]")
                        : "bg-gray-100 text-[#8c8b82] border-gray-200"
                    )}>
                      {isOccupied ? <User className="w-3 h-3" /> : <UserMinus className="w-3 h-3" />}
                      {isOccupied ? `${unit.current_occupancy} / ${unit.max_occupancy} Occupied` : "Vacant"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <p className="text-sm font-bold text-[#3B6D11]">
                      ₱{unit.rental_fee.toLocaleString()}<span className="text-[10px] font-normal text-[#8c8b82]">/mo</span>
                    </p>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1",
                      unit.unit_status === "active" || unit.unit_status === "occupied"
                        ? "bg-[#E7FAD3] text-[#78A24C] border-[#d8e7c8]"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    )}>
                      <span className={cn(
                        "h-1 w-1 rounded-full",
                        unit.unit_status === "active" || unit.unit_status === "occupied" ? "bg-[#78A24C]" : "bg-gray-400"
                      )} />
                      {unit.unit_status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ViewUnitModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        unit={selectedUnit}
        accentColor={isDorm ? "#5591AB" : "#EB8A0B"}
      />
    </div>
  );
}

function ConfigDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#FDFFF4] p-3 rounded-xl border border-[#e2e4c0] flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c8b82]">{label}</span>
      <span className="text-sm font-bold text-[#44291B]">{value}</span>
    </div>
  );
}
