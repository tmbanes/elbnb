// app/admin/housing/properties/PropertyDetails.tsx
"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { getUnitColumns } from "@/app/admin/housing/components/columns/unitColumns";
import { Property, Complaint } from "../../../../types/housing/types";
import AddUnitModal from "@/app/admin/housing/components/modals/AddUnitModal";

// ui components
import { ChevronLeft, MapPin, Building2, Home, AlertCircle } from "lucide-react";
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

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

  return (
    <div className="p-6 space-y-6">
      <Button variant="link" onClick={onBack} className="pl-0 text-[#264384] h-auto py-0">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      {/* Property Header Card */}
      <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-8 flex-wrap">

            <div className="flex flex-col gap-2 shrink-0 min-w-0">
              <div>
                <h1 className="text-3xl font-bold text-[#44291B] leading-tight">{property.name}</h1>
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

                {/* accommodation status */}
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                  property.accommodation_status === "active" || property.accommodation_status === "Active"
                    ? "bg-[#F0F6E9] text-[#78A24C] border-[#d8e7c8]"
                    : property.accommodation_status === "inactive" || property.accommodation_status === "Inactive"
                      ? "bg-[#FFF7ED] text-[#BA7517] border-[#f5dab8]"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {property.accommodation_status 
                    ? property.accommodation_status.charAt(0).toUpperCase() + property.accommodation_status.slice(1).toLowerCase()
                    : "Unknown"}
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

          {/* Unit Table */}
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
              <Button onClick={openAddUnitModal} className="bg-[#264384] hover:bg-[#5273BC] text-white pr-4">
                + Add Unit
              </Button>
            }
          />

          {/* Complaints */}
          <ComplaintsPanel
            propertyId={property.accommodation_id}
            complaints={complaints}
            onStatusChange={handleStatusChange}
          />

          {/* Unit view/edit/delete modals
          <ViewUnitModal
            isOpen={Boolean(activeUnit && unitAction === "view")}
            onClose={closeUnitAction}
            unit={unitAction === "view" ? activeUnit : null}
            accentColor={isDorm ? "#5591AB" : "#EB8A0B"}
          /> */}

          <EditUnitModal
            isOpen={Boolean(activeUnit && unitAction === "edit")}
            onClose={closeUnitAction}
            unit={unitAction === "edit" ? activeUnit : null}
            onSuccess={(updatedUnit) => {
              if (onAddUnit) onAddUnit();
              closeUnitAction();
            }}
            accentColor={isDorm ? "#5591AB" : "#EB8A0B"}
          />

          {/* Delete Unit Modal */}
          <Modal
            isOpen={Boolean(activeUnit && unitAction === "delete")}
            onClose={closeUnitAction}
            title="Delete Unit"
            description={`Are you sure you want to delete Unit ${activeUnit?.unit_number}? This action cannot be undone.`}
          >
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={closeUnitAction}>Cancel</Button>
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

          {/* Add Unit Modal */}
          <AddUnitModal
            isOpen={addUnitModalOpen}
            onClose={closeAddUnitModal}
            onSuccess={handleUnitAdded}
            accommodationId={property.accommodation_id}
            accentColor={isDorm ? "#5591AB" : "#EB8A0B"}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Property details card */}
          <Card className="bg-[#FDFFF4] shadow-sm">
            <CardHeader className="grid flex-1">
              <CardTitle className="font-bold text-[#44291B]">
                {isDorm ? "Dormitory Details" : "Rental Space Details"}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {isDorm && property.dormitory && (
                <>
                  <ConfigRow label="Semesters Allowed" value={String(property.dormitory.number_of_semestersAllowed)} />
                  <ConfigRow label="Curfew Time"        value={property.dormitory.curfew_time || "—"} />
                  <ConfigRow label="Term Type"          value={property.dormitory.term_type} />
                  <ConfigRow label="Separate by Gender" value={property.dormitory.separate_by_gender ? "Yes" : "No"} highlight={property.dormitory.separate_by_gender} />
                  <ConfigRow label="Allowed Programs"   value={property.dormitory.allowed_programs || "—"} />
                </>
              )}
              {!isDorm && property.renting_space && (
                <>
                  <ConfigRow label="Property Type"   value={property.renting_space.property_type} />
                  <ConfigRow label="Short-Term Stay" value={property.renting_space.allow_shortterm_stay ? "Allowed" : "Not Allowed"} highlight={property.renting_space.allow_shortterm_stay} />
                  <ConfigRow label="Long-Term Stay"  value={property.renting_space.allow_longterm_stay ? "Allowed" : "Not Allowed"} highlight={property.renting_space.allow_longterm_stay} />
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

          {/* Manager */}
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

// complaints panel (update status and styling)
// DUMMY VALUES AND FUNCTIONS FOR DEMO PURPOSES ONLY
const STATUS_ORDER: Complaint["complaint_status"][] = ["open", "under_review", "closed"];

const STATUS_META = {
  open:         { label: "Open",         style: "bg-[#FFF7ED] text-[#BA7517] border-[#f5dab8]" },
  under_review: { label: "Under Review", style: "bg-[#EEF2FB] text-[#264384] border-[#c5d0ef]" },
  closed:       { label: "Closed",       style: "bg-[#F0F6E9] text-[#3B6D11] border-[#d8e7c8]" },
  invalid:      { label: "Invalid",      style: "bg-[#FCEBEB] text-[#A32D2D] border-[#F7C1C1]" },
};

const STATUS_STYLE: Record<string, {
  step: string; dot: string; label: string; desc: string;
}> = {
  open: {
    step:  "border-[#f5dab8] bg-[#FFF7ED]",
    dot:   "bg-[#FFF7ED] border-[#BA7517] text-[#854F0B]",
    label: "text-[#854F0B]",
    desc:  "text-[#BA7517]",
  },
  under_review: {
    step:  "border-[#c5d0ef] bg-[#EEF2FB]",
    dot:   "bg-[#EEF2FB] border-[#264384] text-[#0C447C]",
    label: "text-[#0C447C]",
    desc:  "text-[#264384]",
  },
  closed: {
    step:  "border-[#d8e7c8] bg-[#F0F6E9]",
    dot:   "bg-[#F0F6E9] border-[#3B6D11] text-[#27500A]",
    label: "text-[#27500A]",
    desc:  "text-[#3B6D11]",
  },
};

const STATUS_DESC: Record<string, string> = {
  open:         "Complaint received",
  under_review: "Being investigated",
  closed:       "Issue addressed",
};

interface ComplaintsPanelProps {
  propertyId: string;
  complaints: Complaint[];
  onStatusChange: (id: string, status: Complaint["complaint_status"]) => Promise<void>;
}

function ComplaintsPanel({ complaints, onStatusChange }: ComplaintsPanelProps) {
  const [selected, setSelected] = useState<Complaint | null>(complaints[0] ?? null);
  const [filter, setFilter] = useState<"all" | Complaint["complaint_status"]>("all");

  const visible = filter === "all"
    ? complaints
    : complaints.filter(c => c.complaint_status === filter);

  async function advance(complaint: Complaint, status: Complaint["complaint_status"]) {
    await onStatusChange(complaint.complaint_id, status);
    if (selected?.complaint_id === complaint.complaint_id) {
      setSelected({ ...complaint, complaint_status: status });
    }
  }

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-4 items-start">

      {/* List */}
      <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e4c0]">
          <div>
            <h2 className="text-xl font-bold text-[#44291B]">Complaints</h2>
            <p className="text-sm text-[#8c8b82]">{complaints.length} total</p>
          </div>
          <ToggleGroup
            className="text-[#44291B]"
            type="single"
            variant="outline"
            value={filter}
            onValueChange={(value) => {
              if (value) setFilter(value as typeof filter);
            }}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="open">Open</ToggleGroupItem>
            <ToggleGroupItem value="under_review">In Review</ToggleGroupItem>
            <ToggleGroupItem value="closed">Closed</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#8c8b82]">
            <AlertCircle className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-xs">No complaints in this category</p>
          </div>
        ) : (
          <div>
            {visible.map(c => (
              <div
                key={c.complaint_id}
                onClick={() => setSelected(c)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 border-b border-[#e2e4c0] last:border-0 cursor-pointer transition-colors",
                  selected?.complaint_id === c.complaint_id
                    ? "bg-[#eef2fb]"
                    : "hover:bg-[#F6F8D5]"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#44291B] truncate capitalize">
                    {c.complaint_type}
                  </p>
                  <p className="text-[11px] text-[#8c8b82] mt-0.5">
                    {c.complainant_id} · {c.unit_id}
                    <span className="ml-2 text-[#b0b0a8]">
                      {new Date(c.submit_date).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide shrink-0",
                  STATUS_META[c.complaint_status].style
                )}>
                  {STATUS_META[c.complaint_status].label}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail panel */}
      {selected ? (
        <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden sticky top-4">
          <div className="px-4 py-3 border-b border-[#e2e4c0] flex items-start justify-between gap-2">
            <p className="text-[13px] font-medium text-[#44291B] leading-snug capitalize">
              {selected.complaint_type}
            </p>
            <span className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0",
              STATUS_META[selected.complaint_status].style
            )}>
              {STATUS_META[selected.complaint_status].label}
            </span>
          </div>

          <CardContent className="p-4 space-y-4">

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Filed by", value: selected.complainant_id },
                { label: "Unit",     value: selected.unit_id },
                { label: "Filed on", value: new Date(selected.submit_date).toLocaleDateString("en-PH", {
                    month: "short", day: "numeric", year: "numeric",
                  })
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F6F8D5] rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[#8c8b82] uppercase tracking-wider">{label}</p>
                  <p className="text-[12px] font-medium mt-0.5 text-[#44291B]">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-semibold text-[#8c8b82] uppercase tracking-wider mb-1.5">
                Description
              </p>
              <p className="text-[12px] text-[#44291B] leading-relaxed">
                {selected.complaint_desc}
              </p>
            </div>

            {/* Status stepper */}
            <div>
              <p className="text-[10px] font-semibold text-[#8c8b82] uppercase tracking-wider mb-2">
                Update Status
              </p>
              <div className="space-y-2">
                {STATUS_ORDER.map((s, i) => {
                  const currentIdx = STATUS_ORDER.indexOf(selected.complaint_status);
                  const isDone    = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const style     = STATUS_STYLE[s];

                  return (
                    <button
                      key={s}
                      onClick={() => advance(selected, s)}
                      disabled={isDone}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
                        isCurrent  ? style.step : "",
                        isDone     ? "border-[#d8e7c8] bg-[#F0F6E9] opacity-50 cursor-default" : "",
                        !isCurrent && !isDone
                          ? "border-[#e2e4c0] bg-[#FDFFF4] hover:bg-[#F6F8D5] cursor-pointer"
                          : ""
                      )}
                    >
                      {/* Number indicator — no white bg */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shrink-0",
                        isDone
                          ? "bg-[#F0F6E9] border-[#3B6D11] text-[#27500A]"
                          : isCurrent
                            ? style.dot
                            : "bg-[#FDFFF4] border-[#d3d1c7] text-[#b0b0a8]"
                      )}>
                        {isDone ? "✓" : i + 1}
                      </div>
                      <div>
                        <p className={cn(
                          "text-[12px] font-medium",
                          isCurrent ? style.label
                          : isDone  ? "text-[#3B6D11]"
                                    : "text-[#8c8b82]"
                        )}>
                          {STATUS_META[s].label}
                        </p>
                        <p className={cn(
                          "text-[10px]",
                          isCurrent ? style.desc
                          : isDone  ? "text-[#639922]"
                                    : "text-[#b0b0a8]"
                        )}>
                          {STATUS_DESC[s]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mark as invalid */}
              {selected.complaint_status !== "invalid" && (
                <button
                  onClick={() => advance(selected, "invalid")}
                  className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#F7C1C1] bg-[#FCEBEB] text-left transition-colors hover:bg-[#f9d5d5] cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 bg-[#FCEBEB] border-[#A32D2D] text-[#791F1F] shrink-0">
                    ✕
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#791F1F]">Mark as Invalid</p>
                    <p className="text-[10px] text-[#A32D2D]">Complaint is unfounded</p>
                  </div>
                </button>
              )}
            </div>

          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#FDFFF4] border-[#e2e4c0] border-dashed shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 text-[#8c8b82]">
            <AlertCircle className="w-7 h-7 mb-2 opacity-30" />
            <p className="text-xs">Select a complaint to view details</p>
          </div>
        </Card>
      )}
    </div>
  );
}


//config
function ConfigRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e2e4c0] last:border-0 text-xs">
      <span className="text-[#8c8b82]">{label}</span>
      <span className={cn(
        "font-medium",
        highlight === true  ? "text-[#3B6D11]" :
        highlight === false ? "text-[#EB8A0B]" :
                              "text-[#44291B]"
      )}>
        {value}
      </span>
    </div>
  );
}