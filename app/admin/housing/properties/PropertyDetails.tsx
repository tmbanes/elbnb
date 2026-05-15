// app/admin/housing/properties/PropertyDetails.tsx
"use client";

import { useState } from "react";
import { Property } from "../../../../types/housing/types";
import AddUnitModal from "@/app/admin/housing/components/modals/AddUnitModal";
import PropertyGallery from "@/components/housing/PropertyGallery";

// ui components
import {
  ChevronLeft,
  MapPin,
  Building2,
  Home,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  User,
  UserMinus,
  LayoutGrid,
  List,
  Info,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Modal from "@/app/admin/housing/components/modals/Modal";
import EditUnitModal from "@/app/admin/housing/components/modals/EditUnitModal";
import ViewUnitModal from "@/app/admin/housing/components/modals/ViewUnitModal";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  onDeleteUnit: (unitId: string) => Promise<void>;
  onAddUnit?: () => void;
  isDeletingUnit?: boolean;
}

export default function PropertyDetail({
  property,
  onBack,
  onDeleteUnit,
  onAddUnit,
  isDeletingUnit,
}: PropertyDetailProps) {
  const [activeUnit, setActiveUnit] = useState<any | null>(null);
  const [unitAction, setUnitAction] = useState<"view" | "edit" | "delete" | null>(null);
  const [addUnitModalOpen, setAddUnitModalOpen] = useState(false);
  const isDorm = property.accommodation_type === "dormitory";

  const totalCapacity = property.total_capacity ?? 0;
  const currentOccupancy = property.units?.reduce(
    (acc, unit) => acc + (unit.current_occupancy ?? 0), 0
  ) ?? 0;
  const occupancyPercentage = totalCapacity > 0
    ? Math.round((currentOccupancy / totalCapacity) * 100)
    : 0;

  function openUnitAction(unit: any, action: "view" | "edit" | "delete") {
    setActiveUnit(unit);
    setUnitAction(action);
  }
  function closeUnitAction() { setActiveUnit(null); setUnitAction(null); }
  function openAddUnitModal() { setAddUnitModalOpen(true); }
  function closeAddUnitModal() { setAddUnitModalOpen(false); }
  function handleUnitAdded(_unit: any) {
    closeAddUnitModal();
    if (onAddUnit) onAddUnit();
  }

  return (
    <div className="p-6 space-y-6 font-[family-name:var(--font-archivo)]">
      <Button variant="link" onClick={onBack} className="pl-0 text-[#264384] h-auto py-0">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      {/* Property Header & Details Card (Collapsible) */}
      <Collapsible className="group/collapsible">
        <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
          <CardContent className="px-5 py-4">

            <div className="flex items-center justify-between gap-6 flex-wrap">

              {/* 1. Property Identity (Name & Location) */}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-4xl font-[family-name:var(--font-archivo-black)] text-[#44291B] leading-tight break-words">
                  {property.name}
                </h1>
                <div className="flex items-center text-[#6b6a62] text-sm md:text-md mt-0.5 gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="break-words">{property.location}</span>
                </div>
              </div>


              <div className="flex flex-wrap items-center gap-4 md:gap-8 shrink-0 w-full lg:w-auto justify-between lg:justify-end">

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border text-center ${isDorm
                    ? "bg-[#ebf2f4] text-[#5591AB] border-[#d1e3e8]"
                    : "bg-[#fbecd7] text-[#EB8A0B] border-[#f5dab8]"
                    }`}>
                    {isDorm ? "Dormitory" : "Rental Space"}
                  </span>
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

                {/* Assigned Manager */}
                {property.dormitory_manager && (
                  <>
                    {/* Vertical Divider */}
                    <div className="hidden lg:block w-px h-12 bg-[#e2e4c0]" />
                    <div className="flex items-center gap-2.5 bg-transparent">
                      <Avatar className="h-7 w-7 border shadow-sm shrink-0">
                        <AvatarFallback className="bg-[#264384] text-white text-[10px] font-black">
                          {property.dormitory_manager.users.first_name[0]}
                          {property.dormitory_manager.users.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-tight pr-1">
                        <span className="text-sm font-bold text-[#44291B] whitespace-nowrap">
                          {property.dormitory_manager.users.first_name} {property.dormitory_manager.users.last_name}
                        </span>
                        <span className="text-xs text-[#8c8b82] font-medium whitespace-nowrap">
                          Dorm Manager
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-12 bg-[#e2e4c0]" />

                {/* Occupancy Progress Section */}
                <div className="flex flex-col gap-1.5 shrink-0 w-full md:w-[240px]">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-[#44291B] uppercase tracking-wider">
                        Occupancy
                      </span>
                    </div>
                    <span className="text-xl font-bold text-[#264384] leading-none ml-2 mb-0.5">
                      {currentOccupancy}
                      <span className="text-xs font-normal text-[#8c8b82]"> / {totalCapacity}</span>
                    </span>
                  </div>
                  <Progress
                    value={occupancyPercentage}
                    className="h-2 bg-[#F6F8D5] [&>div]:bg-[#264384]"
                  />
                </div>

                {/* Collapsible Trigger */}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-[#8c8b82] hover:text-[#44291B] hover:bg-[#F6F8D5] rounded-full shrink-0">
                    <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardContent>

          <CollapsibleContent className="border-t border-[#e2e4c0] bg-[#FDFFF4]">
            <div className="p-5">
              <div className="space-y-3 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#44291B] pl-1">
                  Property Details
                </p>
                {/* Adjusted grid to span better in the right column */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isDorm && property.dormitory && (
                    <>
                      <ConfigDetail label="Semesters Allowed" value={String(property.dormitory.number_of_semestersAllowed)} />
                      <ConfigDetail label="Curfew Time" value={property.dormitory.curfew_time || "—"} />
                      <ConfigDetail label="Term Type" value={property.dormitory.term_type} />
                      <ConfigDetail label="Gender Policy" value={property.dormitory.separate_by_gender ? "Separated" : "Mixed"} />
                      <div className="sm:col-span-2">
                        <ConfigDetail label="Allowed Programs" value={property.dormitory.allowed_programs || "All Programs"} />
                      </div>
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

              {/* Property Images Section */}
              <div className="mt-8">
                <PropertyGallery accommodationId={property.accommodation_id} />
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Units Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-[family-name:var(--font-archivo-black)] text-[#44291B]">Unit Types</h2>
            <p className="text-sm text-[#44291B]">Manage room units for occupancy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(property.units ?? []).map((unit) => {
            const isOccupied = unit.current_occupancy > 0;
            const occupancyColor = unit.current_occupancy === unit.max_occupancy ? "#A32D2D" : "#264384";

            return (
              <Card
                key={unit.unit_id}
                className="shadow-sm bg-[#FDFFF4] border-[#e2e4c0] transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-md relative overflow-hidden group cursor-pointer"
                style={{ borderTop: `6px solid ${isDorm ? "#5591AB" : "#EB8A0B"}` }}
                onClick={() => openUnitAction(unit, "view")}
              >
                <CardContent className="p-3.5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-[#44291B]">Unit {unit.unit_number}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c8b82]">
                          {unit.unit_type}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8c8b82] hover:text-[#44291B]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#FDFFF4] border-[#e2e4c0]">
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); openUnitAction(unit, "edit"); }}
                          className="gap-2 text-[#44291B] focus:bg-[#F6F8D5]"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit Unit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); openUnitAction(unit, "delete"); }}
                          className="gap-2 text-red-600 focus:text-red-600 focus:bg-[#F6F8D5] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          <span>Delete Unit</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Occupancy / Vacant Chips */}
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

          {/* Add New Unit Card */}
          <button
            onClick={openAddUnitModal}
            className={cn(
              "group bg-[#FDFFF4] border-2 border-dashed border-[#e2e4c0] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 transition-all min-h-[160px]",
              isDorm
                ? "hover:border-[#5591AB] hover:bg-[#ebf2f4]"
                : "hover:border-[#EB8A0B] hover:bg-[#fbecd7]"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#e2e4c0] transition-colors",
              isDorm ? "group-hover:border-[#5591AB]" : "group-hover:border-[#EB8A0B]"
            )}>
              <span className={cn(
                "text-2xl text-[#8c8b82] transition-colors",
                isDorm ? "group-hover:text-[#5591AB]" : "group-hover:text-[#EB8A0B]"
              )}>+</span>
            </div>
            <div>
              <p className={cn(
                "text-sm font-bold text-[#8c8b82] transition-colors",
                isDorm ? "group-hover:text-[#5591AB]" : "group-hover:text-[#EB8A0B]"
              )}>Add New Unit Type</p>
            </div>
          </button>
        </div>

        {/* Modals remain the same */}
        <ViewUnitModal
          isOpen={Boolean(activeUnit && unitAction === "view")}
          onClose={closeUnitAction}
          unit={unitAction === "view" ? activeUnit : null}
          accentColor={isDorm ? "#5591AB" : "#EB8A0B"}
        />

        <EditUnitModal
          isOpen={Boolean(activeUnit && unitAction === "edit")}
          onClose={closeUnitAction}
          unit={unitAction === "edit" ? activeUnit : null}
          onSuccess={(updatedUnit) => {
            if (onAddUnit) onAddUnit();
            closeUnitAction();
          }}
        />

        <Modal
          isOpen={Boolean(activeUnit && unitAction === "delete")}
          onClose={closeUnitAction}
          title="Delete Unit"
          description={`Are you sure you want to delete Unit ${activeUnit?.unit_number}? This action cannot be undone.`}
        >
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeUnitAction} disabled={isDeletingUnit}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={isDeletingUnit}
                onClick={() => {
                  if (activeUnit) {
                    onDeleteUnit(activeUnit.unit_id).then(() => {
                      closeUnitAction();
                      if (onAddUnit) onAddUnit();
                    });
                  }
                }}
              >
                {isDeletingUnit ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : "Delete Unit"}
              </Button>
            </div>
          </div>
        </Modal>

        <AddUnitModal
          isOpen={addUnitModalOpen}
          onClose={closeAddUnitModal}
          onSuccess={handleUnitAdded}
          accommodationId={property.accommodation_id}
        />
      </div>
    </div>
  );
}

//config
function ConfigDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#FDFFF4] p-3 rounded-xl border border-[#e2e4c0] flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c8b82]">{label}</span>
      <span className="text-sm font-bold text-[#44291B]">{value}</span>
    </div>
  );
}