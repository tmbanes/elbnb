"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import UnitEntryCard, { UnitFormData, EMPTY_UNIT } from "./UnitEntryCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

interface Manager {
  employee_id: string;
  users: { user_id: string; first_name: string; last_name: string };
}

interface DormForm {
  name: string;
  location: string;
  type: string;
  number_of_semesters_allowed: string;
  curfew_time: string;
  allowed_programs: string;
  term_type: "semestral" | "annual";
  separate_by_gender: boolean;
  manager_id: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingDorm?: any | null;
}

const EMPTY: DormForm = {
  name: "",
  location: "",
  type: "dormitory",
  number_of_semesters_allowed: "",
  curfew_time: "",
  allowed_programs: "",
  term_type: "semestral",
  separate_by_gender: true,
  manager_id: "",
};

export default function AddDormModal({
  isOpen,
  onClose,
  onSuccess,
  existingDorm,
}: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DormForm>(EMPTY);
  const [units, setUnits] = useState<UnitFormData[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingDorm;
  const existingUnits = (existingDorm?.units ?? []) as any[];
  const totalSteps = 4;

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/housing/managers")
      .then((r) => r.json())
      .then(setManagers)
      .catch(() => { });
  }, [isOpen]);

  useEffect(() => {
    if (existingDorm) {
      setForm({
        name: existingDorm.name ?? "",
        location: existingDorm.location ?? "",
        type: "dormitory",
        number_of_semesters_allowed: String(
          existingDorm.dormitory?.number_of_semestersAllowed ?? ""
        ),
        curfew_time: existingDorm.dormitory?.curfew_time ?? "",
        allowed_programs: existingDorm.dormitory?.allowed_programs ?? "",
        term_type: existingDorm.dormitory?.term_type ?? "semestral",
        separate_by_gender:
          existingDorm.dormitory?.separate_by_gender ?? true,
        manager_id: existingDorm.manager_id ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setUnits([]);
    setStep(1);
    setError(null);
  }, [existingDorm, isOpen]);

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
  function canProceed() {
    if (isEditing) {
      return (
        form.name.trim() !== "" &&
        form.location.trim() !== "" &&
        form.number_of_semesters_allowed.trim() !== "" &&
        !!form.term_type &&
        !!form.manager_id
      );
    }
    if (step === 1) {
      const hasAtLeastOneUnit = units.length > 0;
      const hasValidUnitCapacity = units.some(
        (u) => Number(u.max_occupancy) > 0 && u.unit_number.trim() !== ""
      );
      return (
        hasAtLeastOneUnit &&
        hasValidUnitCapacity &&
        units.every(
          (u) =>
            u.unit_number.trim() !== "" &&
            u.max_occupancy !== "" &&
            u.rental_fee !== "" &&
            u.billing_period !== "" &&
            u.furnishing_status !== ""
        )
      );
    }
    if (step === 2) return form.name.trim() !== "" && form.location.trim() !== "";
    if (step === 3)
      return form.number_of_semesters_allowed && form.term_type;
    if (step === 4) return !!form.manager_id;
    return true;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const editableUnits = isEditing ? existingUnits : units;
      const unitCapacitySum = editableUnits.reduce((sum: number, unit: any) => {
        const capacity = Number(unit.max_occupancy);
        return Number.isFinite(capacity) && capacity > 0 ? sum + capacity : sum;
      }, 0);
      const computedTotalCapacity = unitCapacitySum;

      const payload = {
        accommodationFields: {
          name: form.name,
          location: form.location,
          manager_id: form.manager_id,
          total_capacity: computedTotalCapacity,
        },
        dormitoryFields: {
          number_of_semestersAllowed: Number(
            form.number_of_semesters_allowed
          ),
          curfew_time: form.curfew_time || null,
          allowed_programs: form.allowed_programs || null,
          term_type: form.term_type,
          separate_by_gender: form.separate_by_gender,
        },
      };

      const endpoint = isEditing
        ? `/api/housing/dorms?id=${existingDorm.accommodation_id}`
        : "/api/housing/dorms";

      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? payload
            : {
              ...payload.accommodationFields,
              ...payload.dormitoryFields,
              number_of_semesters_allowed:
                payload.dormitoryFields.number_of_semestersAllowed,
            }
        ),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      // ── Create units after dorm is made/updated ──────────────────────────
      if (!isEditing && units.length > 0) {
        const accommodationId = isEditing
          ? existingDorm.accommodation_id
          : data.accommodation_id;
        await Promise.all(
          units
            .filter(
              (u) => u.unit_number.trim() && u.max_occupancy && u.rental_fee
            )
            .map((u) =>
              fetch("/api/housing/units", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accommodation_id: accommodationId,
                  unit_number: u.unit_number.trim(),
                  unit_type: u.unit_type.trim() || null,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Dormitory" : "Add Dormitory"}
      description={
        isEditing
          ? "Modify dormitory details and policies."
          : "Register a new university dormitory."
      }
    >
      {!isEditing && (
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
                ${step === i + 1
                    ? "bg-[#5591AB] text-white"
                    : step > i + 1
                      ? "bg-[#5591AB] text-white opacity-80"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`h-[2px] w-6 ${step > i + 1 ? "bg-[#5591AB]" : "bg-muted"
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
                Dorm Name <span className="text-[#DF3538]">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Sampaguita Dormitory"
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
                placeholder="e.g. Main Campus"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label className="font-semibold">Semesters Allowed</Label>
                <Input
                  type="number"
                  value={form.number_of_semesters_allowed}
                  onChange={(e) =>
                    handleChange(
                      "number_of_semesters_allowed",
                      e.target.value
                    )
                  }
                />
              </Field>
              <Field>
                <Label className="font-semibold">Term Type</Label>
                <Select
                  value={form.term_type}
                  onValueChange={(val) => handleChange("term_type", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <Label className="font-semibold">Curfew Time</Label>
              <Input
                type="time"
                value={form.curfew_time}
                onChange={(e) => handleChange("curfew_time", e.target.value)}
              />
            </Field>
            <Field>
              <Label className="font-semibold">Allowed Programs</Label>
              <Textarea
                value={form.allowed_programs}
                onChange={(e) =>
                  handleChange("allowed_programs", e.target.value)
                }
                placeholder="All programs..."
              />
            </Field>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="gender-edit"
                className="data-[state=checked]:bg-[#5591AB] data-[state=checked]:border-[#5591AB]"
                checked={form.separate_by_gender}
                onCheckedChange={(checked) =>
                  handleChange("separate_by_gender", checked)
                }
              />
              <Label htmlFor="gender-edit" className="text-sm font-semibold">
                Separate by Gender
              </Label>
            </div>
            <Field>
              <Label className="font-semibold">Property Manager</Label>
              <Select
                value={form.manager_id}
                onValueChange={(val) => handleChange("manager_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.employee_id} value={m.users.user_id}>
                      {m.users.first_name} {m.users.last_name}
                    </SelectItem>
                  ))}
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
                      Add Units <span className="text-[#DF3538]">*</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total capacity is auto-calculated from all unit capacities.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addUnit}
                    className="gap-1 border-[#5591AB] text-[#5591AB] hover:bg-[#5591AB] hover:text-white text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Unit
                  </Button>
                </div>

                {units.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Add at least one unit to continue.
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
                        accentColor="#5591AB"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Dorm Details */}
            {step === 2 && (
              <>
                <Field>
                  <Label htmlFor="name" className="font-semibold">
                    Dorm Name <span className="text-[#DF3538]">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Sampaguita Dormitory"
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
                    placeholder="e.g. Main Campus"
                    required
                  />
                </Field>
              </>
            )}

            {/* Step 3 — Dorm Policies */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label className="font-semibold">Semesters Allowed</Label>
                    <Input
                      type="number"
                      value={form.number_of_semesters_allowed}
                      onChange={(e) =>
                        handleChange(
                          "number_of_semesters_allowed",
                          e.target.value
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <Label className="font-semibold">Term Type</Label>
                    <Select
                      value={form.term_type}
                      onValueChange={(val) => handleChange("term_type", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field>
                  <Label className="font-semibold">Curfew Time</Label>
                  <Input
                    type="time"
                    value={form.curfew_time}
                    onChange={(e) => handleChange("curfew_time", e.target.value)}
                  />
                </Field>
                <Field>
                  <Label className="font-semibold">Allowed Programs</Label>
                  <Textarea
                    value={form.allowed_programs}
                    onChange={(e) =>
                      handleChange("allowed_programs", e.target.value)
                    }
                    placeholder="All programs..."
                  />
                </Field>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="gender"
                    className="data-[state=checked]:bg-[#5591AB] data-[state=checked]:border-[#5591AB]"
                    checked={form.separate_by_gender}
                    onCheckedChange={(checked) =>
                      handleChange("separate_by_gender", checked)
                    }
                  />
                  <Label htmlFor="gender" className="text-sm font-semibold">
                    Separate by Gender
                  </Label>
                </div>
              </>
            )}

            {/* Step 4 — Assign Manager */}
            {step === 4 && (
              <Field>
                <Label className="font-semibold">Property Manager</Label>
                <Select
                  value={form.manager_id}
                  onValueChange={(val) => handleChange("manager_id", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.employee_id} value={m.users.user_id}>
                        {m.users.first_name} {m.users.last_name}
                      </SelectItem>
                    ))}
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
            className="bg-[#5591AB] hover:bg-[#467a8f]"
          >
            {loading ? "Saving..." : "Save Changes"}
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
              onClick={() => setStep((s) => s + 1)}
              className="bg-[#5591AB] hover:bg-[#467a8f] text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              disabled={loading || !canProceed()}
              onClick={handleSubmit}
              className={
                isEditing
                  ? "bg-[#5591AB] hover:bg-[#467a8f]"
                  : "bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
              }
            >
              {loading
                ? "Saving..."
                : "Create Dormitory"}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}