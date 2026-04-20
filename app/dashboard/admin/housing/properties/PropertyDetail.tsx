"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { getUnitColumns } from "@/app/dashboard/admin/housing/components/columns/unitColumns";
import { Property } from "../../../../../types/housing/types";

// ui components
import { ChevronLeft, MapPin, Building2, Home } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Modal from "@/app/dashboard/admin/housing/components/modals/Modal";

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  onDeleteUnit: (unitId: string) => Promise<void>;
}

export default function PropertyDetail({
  property,
  onBack,
  onDeleteUnit,
}: PropertyDetailProps) {
  const [activeUnit, setActiveUnit] = useState<any | null>(null);
  const [unitAction, setUnitAction] = useState<"view" | "edit" | "delete" | null>(null);
  const isDorm = property.accommodation_type === "dormitory";

  // Calculate occupancy stats
  const totalCapacity = property.total_capacity ?? 0;
  const currentOccupancy = property.units?.reduce(
    (acc, unit) => acc + (unit.current_occupancy ?? 0), 
    0
  ) ?? 0;
  const occupancyPercentage = totalCapacity > 0 
    ? Math.round((currentOccupancy / totalCapacity) * 100) 
    : 0;

  function openUnitAction(unit: any, action: "view" | "edit" | "delete") {
    setActiveUnit(unit);
    setUnitAction(action);
  }

  function closeUnitAction() {
    setActiveUnit(null);
    setUnitAction(null);
  }

  return (
    <div className="p-6 space-y-6">
      <Button 
        variant="link" 
        onClick={onBack} 
        className="pl-0 text-[#264384] h-auto py-0"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Properties
      </Button>

      {/* Property Detail Card */}
      {/* TODO - add additional components */}
      <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-8 flex-wrap">

            {/* Left — name, location, badges (Shrink to fit available space) */}
            <div className="flex flex-col gap-2 shrink-0 min-w-0">
              <div>
                <h1 className="text-2xl font-bold text-[#44291B] leading-tight">{property.name}</h1>
                <div className="flex items-center text-[#6b6a62] text-xs mt-0.5 gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {property.location}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                  isDorm
                    ? "bg-[#ebf2f4] text-[#5591AB] border-[#d1e3e8]"
                    : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5dab8]"
                }`}>
                  {isDorm ? "Dormitory" : "Rental Space"}
                </span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                  property.accommodation_status === "active"
                    ? "bg-[#F0F6E9] text-[#78A24C] border-[#d8e7c8]"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {property.accommodation_status}
                </span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-12 bg-[#e2e4c0]" />

            {/*Occupancy */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
              <div className="flex justify-between items-baseline">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-[#44291B] uppercase tracking-wider">
                    Property Occupancy
                  </span>
                  <p className="text-[10px] text-[#8c8b82] italic leading-tight">
                    {occupancyPercentage}% total capacity reached
                  </p>
                </div>
                <span className="text-2xl font-bold text-[#264384] leading-none">
                  {currentOccupancy}
                  <span className="text-sm font-normal text-[#8c8b82]"> / {totalCapacity} <span className="text-[10px]">spaces</span></span>
                </span>
              </div>
              <Progress
                value={occupancyPercentage}
                className="h-2 bg-[#F6F8D5] [&>div]:bg-[#264384]"
              />
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          
          {/* UNIT TABLE */}
          <DataTable
            columns={getUnitColumns(
              (unit) => openUnitAction(unit, "view"),
              (unit) => openUnitAction(unit, "edit"),
              onDeleteUnit,
            )}
            data={property.units ?? []}
            header={
              <div>
                <h2 className="text-xl font-bold text-[#44291B]">Units</h2>
                <p className="text-sm text-[#44291B]">Manage all units under this property</p>
              </div>
            }
            toolbar={
              //TODO - add fucntionality for Adding Unit
              <Button className="bg-[#264384] hover:bg-[#5273BC] text-white pr-4">
                + Add Unit
              </Button>
            }
          />

          {/* SAMPLE MODALS ONLY
          TODO - implement functionality & styling */}
          <Modal
            isOpen={Boolean(activeUnit && unitAction)}
            onClose={closeUnitAction}
            title={
              unitAction === "view" ? "View Unit" : unitAction === "edit" ? "Edit Unit" : "Delete Unit"
            }
            description={
              activeUnit ? `Placeholder for ${unitAction} action on unit ${activeUnit.unit_number}.` : undefined
            }
          >
            <div className="space-y-4">
              {activeUnit && (
                <div className="space-y-2 text-sm">
                  <p><strong>Unit:</strong> {activeUnit.unit_number}</p>
                  <p><strong>Type:</strong> {activeUnit.unit_type}</p>
                  <p><strong>Occupancy:</strong> {activeUnit.current_occupancy} / {activeUnit.max_occupancy}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={closeUnitAction}>Close</Button>
                {(unitAction === "edit" || unitAction === "delete") && (
                  <Button disabled>{unitAction === "edit" ? "Save" : "Confirm"}</Button>
                )}
              </div>
            </div>
          </Modal>
        </div>
        
        {/* PROPERTY DETAIL CARD */}
        <div className="space-y-6">
          <Card className="bg-[#FDFFF4] shadow-sm">
            <CardHeader className="bg-[#FDFFF4]">
              <CardTitle className="font-bold text-[#44291B]">
                {isDorm ? "Dormitory Details" : "Rental Space Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isDorm && property.dormitory && (
                <>
                  <ConfigRow label="Semesters Allowed" value={String(property.dormitory.number_of_semestersAllowed)} />
                  <ConfigRow label="Curfew Time" value={property.dormitory.curfew_time || "—"} />
                  <ConfigRow label="Term Type" value={property.dormitory.term_type} />
                  <ConfigRow label="Separate by Gender" value={property.dormitory.separate_by_gender ? "Yes" : "No"} />
                  <ConfigRow label="Allowed Programs" value={property.dormitory.allowed_programs || "—"} />
                </>
              )}
              {!isDorm && property.renting_space && (
                <>
                <ConfigRow label="Property Type" value={property.renting_space.property_type} />
                <ConfigRow label="Short-Term Stay" value={property.renting_space.allow_shortterm_stay ? "Allowed" : "Not Allowed"} />
                <ConfigRow label="Long-Term Stay" value={property.renting_space.allow_longterm_stay ? "Allowed" : "Not Allowed"} />
                {property.renting_space.allow_shortterm_stay && (
                <>
                    <ConfigRow label="Min Stay Days" value={String(property.renting_space.minimum_stay_days ?? "—")} />
                    <ConfigRow label="Max Stay Days" value={String(property.renting_space.maximum_stay_days ?? "—")} />
                </>
                )}
                <ConfigRow label="Security Deposit" value={property.renting_space.security_deposit_required ? "Required" : "Not Required"} />
                </>
              )}
            </CardContent>
          </Card>
          
          {/* MANAGER DETAILS CARD */}
          {property.dormitory_manager && (
            <Card className="bg-[#FDFFF4] shadow-sm">
              <CardHeader className="grid flex-1">
                <CardTitle className="font-bold text-[#44291B]">Assigned Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage/>
                        <AvatarFallback className="rounded-lg">DM</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium text-[#44291B]">
                            {property.dormitory_manager.users.first_name}{" "}
                            {property.dormitory_manager.users.last_name}
                        </span>
                        <span className="truncate text-xs pl-0.5 text-[#44291B]">
                            {property.dormitory_manager.users.email}
                        </span>
                    </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}