// app/admin/housing/properties/PropertyDetails.tsx
"use client";

import { useState } from "react";
import { Property, Complaint } from "../../../../types/housing/types";
import AddUnitModal from "@/app/admin/housing/components/modals/AddUnitModal";

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
  Plus,
  X,
  Upload,
  Image as ImageIcon
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
}

export default function PropertyDetail({
  property,
  onBack,
  onDeleteUnit,
  onAddUnit,
}: PropertyDetailProps) {
  const [activeUnit, setActiveUnit] = useState<any | null>(null);
  const [unitAction, setUnitAction] = useState<"view" | "edit" | "delete" | null>(null);
  const [addUnitModalOpen, setAddUnitModalOpen] = useState(false);
  const [propertyImages, setPropertyImages] = useState<string[]>([
    "https://placehold.co/600x400/e2e4c0/44291B?text=Property+Photo+1",
    "https://placehold.co/600x400/e2e4c0/44291B?text=Property+Photo+2"
  ]);
  const isDorm = property.accommodation_type === "dormitory";

  // DUMMY COMPLAINTS FOR DEMO PURPOSES ONLY
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      complaint_id: "c1",
      complainant_id: "user123",
      accommodation_id: property.accommodation_id,
      unit_id: "u1",
      complaint_type: "maintenance",
      complaint_desc: "The light in the room is not working.",
      complaint_status: "open",
      submit_date: "2024-04-15T10:00:00Z",
    },
    {
      complaint_id: "c2",
      complainant_id: "user456",
      accommodation_id: property.accommodation_id,
      unit_id: "u2",
      complaint_type: "utility",
      complaint_desc: "Water heater is broken.",
      complaint_status: "under_review",
      submit_date: "2024-04-10T14:30:00Z",
    },
    {
      complaint_id: "c3",
      complainant_id: "user789",
      accommodation_id: property.accommodation_id,
      unit_id: "u3",
      complaint_type: "sanitation",
      complaint_desc: "Bathroom needs cleaning.",
      complaint_status: "closed",
      submit_date: "2024-04-05T09:15:00Z",
    },
  ]);

  const handleStatusChange = async (id: string, status: Complaint["complaint_status"]) => {
    setComplaints(prev =>
      prev.map(c => c.complaint_id === id ? { ...c, complaint_status: status } : c)
    );
  };

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

  // dummy add image functionality for testing
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropertyImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage(index: number) {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
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
            <div className="flex items-center justify-between gap-8 flex-wrap">

              <div>
                <h1 className="text-2xl md:text-4xl font-[family-name:var(--font-archivo-black)] text-[#44291B] leading-tight break-words">{property.name}</h1>
                <div className="flex items-center text-[#6b6a62] text-sm md:text-md mt-0.5 gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="break-words">{property.location}</span>
                </div>
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

              {/* Vertical Divider */}
              <div className="hidden lg:block w-px h-12 bg-[#e2e4c0]" />

              {/* Assigned Manager (Moved to Header) */}
              {property.dormitory_manager && (
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
              )}

              {/* Vertical Divider */}
              <div className="hidden md:block w-px h-12 bg-[#e2e4c0]" />

              {/*Occupancy */}
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

              {/* Details Trigger */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-[#8c8b82] hover:text-[#44291B] hover:bg-[#F6F8D5] rounded-full shrink-0">
                  <ChevronDown className="h-5 w-5 transition-transform duration-200 group-state-open:rotate-180" />
                </Button>
              </CollapsibleTrigger>
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
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#44291B]">
                    Property Gallery
                  </p>
                  <span className="text-[10px] text-[#8c8b82] font-medium">
                    {propertyImages.length} images uploaded
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {propertyImages.map((src, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-[#e2e4c0] bg-white shadow-sm">
                      <img
                        src={src}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Upload Placeholder */}
                  <label className="relative aspect-square rounded-xl border-2 border-dashed border-[#e2e4c0] hover:border-[#264384]/30 hover:bg-[#F6F8D5]/30 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <div className="w-8 h-8 rounded-full bg-[#ebf2f4] flex items-center justify-center group-hover:bg-[#264384]/10 transition-colors duration-200">
                      <Plus className="w-4 h-4 text-[#264384]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#264384]/60 uppercase tracking-tight">Add Photo</span>
                  </label>
                </div>
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
            <p className="text-sm text-[#8c8b82]">Manage room templates for occupancy</p>
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
              <Button variant="outline" onClick={closeUnitAction}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (activeUnit) {
                    onDeleteUnit(activeUnit.unit_id).then(() => {
                      closeUnitAction();
                      if (onAddUnit) onAddUnit();
                    });
                  }
                }}
              >
                Delete Unit
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

      {/* Complaints Panel - Full Width Split */}
      {/* <ComplaintsPanel
        propertyId={property.accommodation_id}
        complaints={complaints}
        onStatusChange={handleStatusChange}
      /> */}
    </div>
  );
}

// const STATUS_ORDER: Complaint["complaint_status"][] = ["open", "under_review", "closed"];
// const STATUS_META = {
//   open: { label: "Open", style: "bg-[#FFF7ED] text-[#BA7517] border-[#f5dab8]" },
//   under_review: { label: "Under Review", style: "bg-[#EEF2FB] text-[#264384] border-[#c5d0ef]" },
//   closed: { label: "Closed", style: "bg-[#F0F6E9] text-[#3B6D11] border-[#d8e7c8]" },
//   invalid: { label: "Invalid", style: "bg-[#FCEBEB] text-[#A32D2D] border-[#F7C1C1]" },
// };

// const STATUS_STYLE: Record<string, {
//   step: string; dot: string; label: string; desc: string;
// }> = {
//   open: {
//     step: "border-[#f5dab8] bg-[#FFF7ED]",
//     dot: "bg-[#FFF7ED] border-[#BA7517] text-[#854F0B]",
//     label: "text-[#854F0B]",
//     desc: "text-[#BA7517]",
//   },
//   under_review: {
//     step: "border-[#c5d0ef] bg-[#EEF2FB]",
//     dot: "bg-[#EEF2FB] border-[#264384] text-[#0C447C]",
//     label: "text-[#0C447C]",
//     desc: "text-[#264384]",
//   },
//   closed: {
//     step: "border-[#d8e7c8] bg-[#F0F6E9]",
//     dot: "bg-[#F0F6E9] border-[#3B6D11] text-[#27500A]",
//     label: "text-[#27500A]",
//     desc: "text-[#3B6D11]",
//   },
// };

// const STATUS_DESC: Record<string, string> = {
//   open: "Complaint received",
//   under_review: "Being investigated",
//   closed: "Issue addressed",
// };

// interface ComplaintsPanelProps {
//   propertyId: string;
//   complaints: Complaint[];
//   onStatusChange: (id: string, status: Complaint["complaint_status"]) => Promise<void>;
// }

// function ComplaintsPanel({ complaints, onStatusChange }: ComplaintsPanelProps) {
//   const [selected, setSelected] = useState<Complaint | null>(complaints[0] ?? null);
//   const [filter, setFilter] = useState<"all" | Complaint["complaint_status"]>("all");

//   const visible = filter === "all"
//     ? complaints
//     : complaints.filter(c => c.complaint_status === filter);

//   async function advance(complaint: Complaint, status: Complaint["complaint_status"]) {
//     await onStatusChange(complaint.complaint_id, status);
//     if (selected?.complaint_id === complaint.complaint_id) {
//       setSelected({ ...complaint, complaint_status: status });
//     }
//   }

//   return (
//     <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">

//       {/* List */}
//       <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
//         <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e4c0]">
//           <div>
//             <h2 className="text-xl font-[family-name:var(--font-archivo-black)] text-[#44291B]">Complaints</h2>
//             <p className="text-sm text-[#8c8b82]">{complaints.length} total</p>
//           </div>
//           <ToggleGroup
//             className="text-[#44291B]"
//             type="single"
//             variant="outline"
//             value={filter}
//             onValueChange={(value) => {
//               if (value) setFilter(value as typeof filter);
//             }}
//           >
//             <ToggleGroupItem value="all">All</ToggleGroupItem>
//             <ToggleGroupItem value="open">Open</ToggleGroupItem>
//             <ToggleGroupItem value="under_review">In Review</ToggleGroupItem>
//             <ToggleGroupItem value="closed">Closed</ToggleGroupItem>
//           </ToggleGroup>
//         </div>

//         {visible.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-10 text-[#8c8b82]">
//             <AlertCircle className="w-6 h-6 mb-2 opacity-40" />
//             <p className="text-xs">No complaints in this category</p>
//           </div>
//         ) : (
//           <div>
//             {visible.map(c => (
//               <div
//                 key={c.complaint_id}
//                 onClick={() => setSelected(c)}
//                 className={cn(
//                   "flex items-center gap-3 px-4 py-3.5 border-b border-[#e2e4c0] last:border-0 cursor-pointer transition-colors",
//                   selected?.complaint_id === c.complaint_id
//                     ? "bg-[#eef2fb]"
//                     : "hover:bg-[#F6F8D5]"
//                 )}
//               >
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[13px] font-medium text-[#44291B] truncate capitalize">
//                     {c.complaint_type}
//                   </p>
//                   <p className="text-[11px] text-[#8c8b82] mt-0.5">
//                     {c.complainant_id} · {c.unit_id}
//                     <span className="ml-2 text-[#b0b0a8]">
//                       {new Date(c.submit_date).toLocaleDateString("en-PH", {
//                         month: "short", day: "numeric", year: "numeric",
//                       })}
//                     </span>
//                   </p>
//                 </div>
//                 <span className={cn(
//                   "text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide shrink-0",
//                   STATUS_META[c.complaint_status].style
//                 )}>
//                   {STATUS_META[c.complaint_status].label}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </Card>

//       {/* Detail panel */}
//       {selected ? (
//         <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden sticky top-4">
//           <div className="px-4 py-3 border-b border-[#e2e4c0] flex items-start justify-between gap-2">
//             <p className="text-[13px] font-medium text-[#44291B] leading-snug capitalize">
//               {selected.complaint_type}
//             </p>
//             <span className={cn(
//               "text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0",
//               STATUS_META[selected.complaint_status].style
//             )}>
//               {STATUS_META[selected.complaint_status].label}
//             </span>
//           </div>

//           <CardContent className="p-4 space-y-4">

//             {/* Meta grid */}
//             <div className="grid grid-cols-2 gap-2">
//               {[
//                 { label: "Filed by", value: selected.complainant_id },
//                 { label: "Unit", value: selected.unit_id },
//                 {
//                   label: "Filed on", value: new Date(selected.submit_date).toLocaleDateString("en-PH", {
//                     month: "short", day: "numeric", year: "numeric",
//                   })
//                 },
//               ].map(({ label, value }) => (
//                 <div key={label} className="bg-[#F6F8D5] rounded-lg px-3 py-2">
//                   <p className="text-[10px] text-[#8c8b82] uppercase tracking-wider">{label}</p>
//                   <p className="text-[12px] font-medium mt-0.5 text-[#44291B]">{value}</p>
//                 </div>
//               ))}
//             </div>

//             {/* Description */}
//             <div>
//               <p className="text-[10px] font-semibold text-[#8c8b82] uppercase tracking-wider mb-1.5">
//                 Description
//               </p>
//               <p className="text-[12px] text-[#44291B] leading-relaxed">
//                 {selected.complaint_desc}
//               </p>
//             </div>

//             {/* Status stepper */}
//             <div>
//               <p className="text-[10px] font-semibold text-[#8c8b82] uppercase tracking-wider mb-2">
//                 Update Status
//               </p>
//               <div className="space-y-2">
//                 {STATUS_ORDER.map((s, i) => {
//                   const currentIdx = STATUS_ORDER.indexOf(selected.complaint_status);
//                   const isDone = i < currentIdx;
//                   const isCurrent = i === currentIdx;
//                   const style = STATUS_STYLE[s];

//                   return (
//                     <button
//                       key={s}
//                       onClick={() => advance(selected, s)}
//                       disabled={isDone}
//                       className={cn(
//                         "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
//                         isCurrent ? style.step : "",
//                         isDone ? "border-[#d8e7c8] bg-[#F0F6E9] opacity-50 cursor-default" : "",
//                         !isCurrent && !isDone
//                           ? "border-[#e2e4c0] bg-[#FDFFF4] hover:bg-[#F6F8D5] cursor-pointer"
//                           : ""
//                       )}
//                     >
//                       {/* Number indicator — no white bg */}
//                       <div className={cn(
//                         "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shrink-0",
//                         isDone
//                           ? "bg-[#F0F6E9] border-[#3B6D11] text-[#27500A]"
//                           : isCurrent
//                             ? style.dot
//                             : "bg-[#FDFFF4] border-[#d3d1c7] text-[#b0b0a8]"
//                       )}>
//                         {isDone ? "✓" : i + 1}
//                       </div>
//                       <div>
//                         <p className={cn(
//                           "text-[12px] font-medium",
//                           isCurrent ? style.label
//                             : isDone ? "text-[#3B6D11]"
//                               : "text-[#8c8b82]"
//                         )}>
//                           {STATUS_META[s].label}
//                         </p>
//                         <p className={cn(
//                           "text-[10px]",
//                           isCurrent ? style.desc
//                             : isDone ? "text-[#639922]"
//                               : "text-[#b0b0a8]"
//                         )}>
//                           {STATUS_DESC[s]}
//                         </p>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>

//               {/* Mark as invalid */}
//               {selected.complaint_status !== "invalid" && (
//                 <button
//                   onClick={() => advance(selected, "invalid")}
//                   className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#F7C1C1] bg-[#FCEBEB] text-left transition-colors hover:bg-[#f9d5d5] cursor-pointer"
//                 >
//                   <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 bg-[#FCEBEB] border-[#A32D2D] text-[#791F1F] shrink-0">
//                     ✕
//                   </div>
//                   <div>
//                     <p className="text-[12px] font-medium text-[#791F1F]">Mark as Invalid</p>
//                     <p className="text-[10px] text-[#A32D2D]">Complaint is unfounded</p>
//                   </div>
//                 </button>
//               )}
//             </div>

//           </CardContent>
//         </Card>
//       ) : (
//         <Card className="bg-[#FDFFF4] border-[#e2e4c0] border-dashed shadow-sm">
//           <div className="flex flex-col items-center justify-center py-12 text-[#8c8b82]">
//             <AlertCircle className="w-7 h-7 mb-2 opacity-30" />
//             <p className="text-xs">Select a complaint to view details</p>
//           </div>
//         </Card>
//       )}
//     </div>
//   );
// }


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