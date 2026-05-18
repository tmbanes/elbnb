"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Modal from "./Modal";
import UnitEntryCard, { UnitFormData, EMPTY_UNIT } from "./UnitEntryCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Manager {
  employee_id: string;
  users: { user_id: string; first_name: string; last_name: string };
  accommodation?: { name: string }[];
}

interface RentalForm {
  name: string;
  location: string;
  property_type: string;
  allow_shortterm_stay: boolean;
  allow_longterm_stay: boolean;
  minimum_stay_days: string;
  maximum_stay_days: string;
  security_deposit_required: boolean;
  manager_id: string;
  accommodation_status: string;
  accomm_sex: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingRental?: any | null;
  managers?: Manager[];
  assignedManagerIds?: Set<string>;
}

const EMPTY: RentalForm = {
  name: "",
  location: "",
  property_type: "boarding",
  allow_shortterm_stay: false,
  allow_longterm_stay: true,
  minimum_stay_days: "",
  maximum_stay_days: "",
  security_deposit_required: false,
  manager_id: "",
  accommodation_status: "active",
  accomm_sex: "",
};

// ── Component ──────────────────────────────────────────────────────────────
export default function AddRentalSpaceModal({
  isOpen,
  onClose,
  onSuccess,
  existingRental,
  managers: managersProp,
  assignedManagerIds,
}: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RentalForm>(EMPTY);
  const [units, setUnits] = useState<UnitFormData[]>([]);
  const [managers, setManagers] = useState<Manager[]>(managersProp || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const isEditing = !!existingRental;
  const existingUnits = (existingRental?.units ?? []) as any[];
  const totalSteps = 4;

  // Fetch managers
  useEffect(() => {
    if (!isOpen) return;
    if (managersProp && managersProp.length > 0) {
      setManagers(managersProp);
      return;
    }
    fetch("/api/housing/managers?all=true")
      .then((r) => r.json())
      .then((data) => {
        setManagers(Array.isArray(data) ? data : []);
      })
      .catch(() => setManagers([]));
  }, [isOpen, managersProp]);

  // Pre-fill / reset
  useEffect(() => {
    if (existingRental) {
      setForm({
        name: existingRental.name ?? "",
        location: existingRental.location ?? "",
        property_type:
          existingRental.renting_space?.property_type ?? "boarding",
        allow_shortterm_stay:
          existingRental.renting_space?.allow_shortterm_stay ?? false,
        allow_longterm_stay:
          existingRental.renting_space?.allow_longterm_stay ?? true,
        minimum_stay_days: String(
          existingRental.renting_space?.minimum_stay_days ?? ""
        ),
        maximum_stay_days: String(
          existingRental.renting_space?.maximum_stay_days ?? ""
        ),
        security_deposit_required:
          existingRental.renting_space?.security_deposit_required ?? false,
        manager_id: existingRental.manager_id ?? "",
        accommodation_status: existingRental.accommodation_status ?? "active",
        accomm_sex: existingRental.accomm_sex ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setUnits([]);
    setStep(1);
    setError(null);
    setShowConfirm(false);
  }, [existingRental, isOpen]);

  const handleChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Unit handlers ──────────────────────────────────────────────────────────
  function addUnit() {
    setUnits((prev) => [...prev, { ...EMPTY_UNIT }]);
  }

  function removeUnit(index: number) {
    setUnits((prev) => prev.filter((_, i) => i !== index));
  }

  function updateUnit(
    index: number,
    field: keyof UnitFormData,
    value: string
  ) {
    setUnits((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    );
  }

  // ── Step validation ────────────────────────────────────────────────────────
  const canProceed = () => {
    if (isEditing) {
      return (
        form.name.trim() !== "" &&
        form.location.trim() !== "" &&
        form.property_type.trim() !== "" &&
        !!form.accomm_sex
        // manager_id is optional when editing
      );
    }
    if (step === 1) {
      if (units.length === 0) return true;
      return units.every(
        (u) =>
          u.unit_type.trim() !== "" &&
          u.number_of_units !== "" &&
          Number(u.number_of_units) > 0 &&
          u.max_occupancy !== "" &&
          Number(u.max_occupancy) > 0 &&
          u.rental_fee !== "" &&
          u.billing_period !== "" &&
          u.furnishing_status !== ""
      );
    }
    if (step === 2)
      return (
        form.name.trim() !== "" &&
        form.location.trim() !== "" &&
        form.property_type.trim() !== "" &&
        !!form.accomm_sex
      );
    if (step === 4) return !!form.manager_id;
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !showConfirm && units.length > 0) {
      setShowConfirm(true);
      return;
    }
    setStep((s) => s + 1);
    setShowConfirm(false);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canProceed()) return;
    setLoading(true);
    setError(null);

    try {
      let computedTotalCapacity: number;
      if (isEditing) {
        const loadedUnits: any[] = existingRental?.units ?? [];
        if (loadedUnits.length > 0) {
          computedTotalCapacity = loadedUnits.reduce(
            (sum: number, u: any) => sum + (Number(u.max_occupancy) || 0), 0
          );
        } else {
          computedTotalCapacity = Number(existingRental?.total_capacity ?? 0);
        }
      } else {
        computedTotalCapacity = units.reduce((sum: number, unit: any) => {
          const capacity = Number(unit.max_occupancy);
          const count = Number(unit.number_of_units || 1);
          return Number.isFinite(capacity) && capacity > 0 ? sum + (capacity * count) : sum;
        }, 0);
      }

      const payload = {
        accommodationFields: {
          name: form.name,
          location: form.location,
          manager_id: form.manager_id === "none" ? null : form.manager_id,
          total_capacity: computedTotalCapacity,
          accommodation_status: form.accommodation_status,
          accomm_sex: form.accomm_sex,
        },
        rentingFields: {
          property_type: form.property_type,
          allow_shortterm_stay: form.allow_shortterm_stay,
          allow_longterm_stay: form.allow_longterm_stay,
          minimum_stay_days: form.minimum_stay_days
            ? Number(form.minimum_stay_days)
            : null,
          maximum_stay_days: form.maximum_stay_days
            ? Number(form.maximum_stay_days)
            : null,
          security_deposit_required: form.security_deposit_required,
        },
      };

      const endpoint = isEditing
        ? `/api/housing/rental-spaces?id=${existingRental.accommodation_id}`
        : "/api/housing/rental-spaces";

      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? payload
            : { ...payload.accommodationFields, ...payload.rentingFields }
        ),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      // ── Create units after accommodation is made/updated ─────────────────
      if (!isEditing && units.length > 0) {
        const accommodationId = isEditing
          ? existingRental.accommodation_id
          : data.accommodation_id;
        await Promise.all(
          units
            .filter(
              (u) => u.unit_type.trim() && u.max_occupancy && u.rental_fee
            )
            .map((u) =>
              fetch("/api/housing/units", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accommodation_id: accommodationId,
                  unit_type: u.unit_type.trim(),
                  number_of_units: Number(u.number_of_units),
                  max_occupancy: Number(u.max_occupancy),
                  rental_fee: Number(u.rental_fee),
                  billing_period: u.billing_period,
                  furnishing_status: u.furnishing_status,
                  min_stay_duration: u.min_stay_duration
                    ? Number(u.min_stay_duration)
                    : null,
                  max_stay_duration: u.max_stay_duration
                    ? Number(u.max_stay_duration)
                    : null,
                }),
              })
            )
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Rental Space" : "Add Rental Space"}
      description={
        isEditing
          ? "Update configuration for this rental property."
          : "Register a new off-campus rental space."
      }
    >
      {!isEditing && (
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
                ${step === i + 1
                    ? "bg-[#EB8A0B] text-white"
                    : step > i + 1
                      ? "bg-[#78A24C] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`h-[2px] w-6 ${step > i + 1 ? "bg-[#78A24C]" : "bg-muted"
                    }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <FieldGroup>
        {isEditing && (
          <div className="space-y-4">
            <Field>
              <Label htmlFor="name" className="font-semibold">
                Property Name <span className="text-[#DF3538]">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Mabini Boarding House"
                required
              />
            </Field>
            <Field>
              <Label htmlFor="location" className="font-semibold">
                Location <span className="text-[#DF3538]">*</span>
              </Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g. Near East Gate"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label className="font-semibold">
                  Property Type <span className="text-[#DF3538]">*</span>
                </Label>
                <Select
                  value={form.property_type}
                  onValueChange={(val) => handleChange("property_type", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="boarding">Boarding House</SelectItem>
                    <SelectItem value="transient">Transient</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label className="font-semibold">
                  Allowed Sex <span className="text-[#DF3538]">*</span>
                </Label>
                <Select
                  value={form.accomm_sex}
                  onValueChange={(val) => handleChange("accomm_sex", val)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select allowed sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="COED">Co-ed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shortterm-edit"
                  className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                  checked={form.allow_shortterm_stay}
                  onCheckedChange={(val) =>
                    handleChange("allow_shortterm_stay", val)
                  }
                />
                <Label htmlFor="shortterm-edit" className="text-sm font-semibold cursor-pointer">
                  Allow Short-Term Stay
                </Label>
              </div>
              {form.allow_shortterm_stay && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Field>
                    <Label className="font-semibold">Min Stay (Days)</Label>
                    <Input
                      type="number"
                      value={form.minimum_stay_days}
                      onChange={(e) =>
                        handleChange("minimum_stay_days", e.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <Label className="font-semibold">Max Stay (Days)</Label>
                    <Input
                      type="number"
                      value={form.maximum_stay_days}
                      onChange={(e) =>
                        handleChange("maximum_stay_days", e.target.value)
                      }
                    />
                  </Field>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="longterm-edit"
                  className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                  checked={form.allow_longterm_stay}
                  onCheckedChange={(val) =>
                    handleChange("allow_longterm_stay", val)
                  }
                />
                <Label htmlFor="longterm-edit" className="text-sm font-semibold cursor-pointer">
                  Allow Long-Term Stay
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deposit-edit"
                  className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                  checked={form.security_deposit_required}
                  onCheckedChange={(val) =>
                    handleChange("security_deposit_required", val)
                  }
                />
                <Label htmlFor="deposit-edit" className="text-sm font-semibold cursor-pointer">
                  Security Deposit Required
                </Label>
              </div>
            </div>
            <Field>
              <Label className="font-semibold">
                Assign a Property Manager <span className="text-[#DF3538]">*</span>
              </Label>
              <Select
                value={form.manager_id}
                onValueChange={(val) => handleChange("manager_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No Manager —</SelectItem>
                  {managers.map((m) => {
                    const isAssigned = assignedManagerIds?.has(m.users.user_id) ?? false;
                    const isCurrentManager = m.users.user_id === existingRental?.manager_id;
                    const shouldDisable = isAssigned && !isCurrentManager;
                    return (
                      <SelectItem
                        key={m.employee_id}
                        value={m.users.user_id}
                        disabled={shouldDisable}
                      >
                        {m.users.first_name} {m.users.last_name}{shouldDisable ? " (assigned)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <Label className="font-semibold">Status</Label>
              <Select
                value={form.accommodation_status}
                onValueChange={(val) => handleChange("accommodation_status", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {!isEditing && (
          <>
            {/* Step 1 — Add Units */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#44291B]">
                      Add Unit Types <span className="text-[#DF3538]">*</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total capacity is auto-calculated from all unit type capacities.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addUnit}
                    className="gap-1 border-[#EB8A0B] text-[#EB8A0B] hover:bg-[#EB8A0B] hover:text-white text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Unit Type
                  </Button>
                </div>

                {units.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Add at least one unit type to continue.
                  </div>
                )}

                {units.length > 0 && (
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {units.map((unit, i) => (
                      <UnitEntryCard
                        key={i}
                        index={i}
                        data={unit}
                        onChange={updateUnit}
                        onRemove={removeUnit}
                        accentColor="#EB8A0B"
                      />
                    ))}
                  </div>
                )}

                {showConfirm && step === 1 && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 animate-in fade-in slide-in-from-top-1">
                    <p className="font-semibold mb-1 text-xs uppercase tracking-wider opacity-70">Confirm Unit Creation</p>
                    <p className="mb-2">Are you sure you want to create the following unit types?</p>
                    <ul className="space-y-1 list-disc list-inside ml-2 text-xs">
                      {units.map((u, i) => (
                        <li key={i}>
                          <span className="font-bold underline">{u.number_of_units}</span> units of type <span className="font-bold underline">{u.unit_type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Property Details */}
            {step === 2 && (
              <>
                <Field>
                  <Label htmlFor="name" className="font-semibold">
                    Property Name <span className="text-[#DF3538]">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Mabini Boarding House"
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="location" className="font-semibold">
                    Location <span className="text-[#DF3538]">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g. Near East Gate"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label className="font-semibold">
                      Property Type <span className="text-[#DF3538]">*</span>
                    </Label>
                    <Select
                      value={form.property_type}
                      onValueChange={(val) => handleChange("property_type", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="boarding">Boarding House</SelectItem>
                        <SelectItem value="transient">Transient</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <Label className="font-semibold">
                      Allowed Sex <span className="text-[#DF3538]">*</span>
                    </Label>
                    <Select
                      value={form.accomm_sex}
                      onValueChange={(val) => handleChange("accomm_sex", val)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select allowed sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Co-ed">Co-ed</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </>
            )}

            {/* Step 3 — Stay Configuration */}
            {step === 3 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shortterm"
                    className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                    checked={form.allow_shortterm_stay}
                    onCheckedChange={(val) =>
                      handleChange("allow_shortterm_stay", val)
                    }
                  />
                  <Label
                    htmlFor="shortterm"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Allow Short-Term Stay
                  </Label>
                </div>

                {form.allow_shortterm_stay && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Field>
                      <Label className="font-semibold">Min Stay (Days)</Label>
                      <Input
                        type="number"
                        value={form.minimum_stay_days}
                        onChange={(e) =>
                          handleChange("minimum_stay_days", e.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      <Label className="font-semibold">Max Stay (Days)</Label>
                      <Input
                        type="number"
                        value={form.maximum_stay_days}
                        onChange={(e) =>
                          handleChange("maximum_stay_days", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="longterm"
                    className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                    checked={form.allow_longterm_stay}
                    onCheckedChange={(val) =>
                      handleChange("allow_longterm_stay", val)
                    }
                  />
                  <Label
                    htmlFor="longterm"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Allow Long-Term Stay
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deposit"
                    className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                    checked={form.security_deposit_required}
                    onCheckedChange={(val) =>
                      handleChange("security_deposit_required", val)
                    }
                  />
                  <Label
                    htmlFor="deposit"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Security Deposit Required
                  </Label>
                </div>
              </div>
            )}

            {/* Step 4 — Assign Manager */}
            {step === 4 && (
              <Field>
                <Label className="font-semibold">
                  Assign a Property Manager <span className="text-[#DF3538]">*</span>
                </Label>
                <Select
                  value={form.manager_id}
                  onValueChange={(val) => handleChange("manager_id", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Manager —</SelectItem>
                    {managers.map((m) => {
                      const isAssigned = assignedManagerIds?.has(m.users.user_id) ?? false;
                      const isCurrentManager = m.users.user_id === existingRental?.manager_id;
                      const shouldDisable = isAssigned && !isCurrentManager;
                      return (
                        <SelectItem
                          key={m.employee_id}
                          value={m.users.user_id}
                          disabled={shouldDisable}
                        >
                          {m.users.first_name} {m.users.last_name}{shouldDisable ? " (assigned)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {error && (
              <p className="text-xs font-medium text-destructive">{error}</p>
            )}
          </>
        )}
        {isEditing && error && (
          <p className="text-xs font-medium text-destructive">{error}</p>
        )}
      </FieldGroup>

      {isEditing ? (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={loading || !canProceed()}
            onClick={handleSubmit}
            className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : "Save Changes"}
          </Button>
        </div>
      ) : (
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < totalSteps ? (
            <Button
              disabled={!canProceed()}
              onClick={handleNext}
              className={cn(
                "transition-all duration-200",
                showConfirm && step === 1
                  ? "bg-[#DF3538] hover:bg-[#DF3538]/90 text-white"
                  : "bg-[#EB8A0B] hover:bg-[#EFC58F] text-white"
              )}
            >
              {showConfirm && step === 1 ? "Confirm & Next" : "Next"}
            </Button>
          ) : (
            <Button
              disabled={loading || !canProceed()}
              onClick={handleSubmit}
              className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : "Create Rental Space"}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}