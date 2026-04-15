// components/housing/modals/AddDormModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

// ui components
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

interface Manager {
  employee_id: string;
  users: { user_id: string; first_name: string; last_name: string };
}

interface DormForm {
// Step 1
  name: string;
  location: string;
  type: string;
  total_capacity: string;
// Step 2
  number_of_semesters_allowed: string;
  curfew_time: string;
  allowed_programs: string;
  term_type: "semestral" | "annual";
  separate_by_gender: boolean;
//Step 3
  manager_id: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingDorm?: any | null; // pass full dorm object when editing
}

//initial empty state
const EMPTY: DormForm = {
  name: "",
  location: "",
  type: "dormitory",
  total_capacity: "",
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
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingDorm;
  const totalSteps = isEditing ? 3 : 4; // No room setup step when editing
  
  // Fetch managers for the dropdown
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/housing/managers")
      .then((r) => r.json())
      .then(setManagers)
      .catch(() => {});
  }, [isOpen]);


// Pre-fill when editing
  useEffect(() => {
    if (existingDorm) {
      setForm({
        name: existingDorm.name ?? "",
        location: existingDorm.location ?? "",
        type: "dormitory",
        total_capacity: String(existingDorm.total_capacity ?? ""),
        number_of_semesters_allowed: String(
          existingDorm.dormitory?.number_of_semestersAllowed ?? "",
        ),
        curfew_time: existingDorm.dormitory?.curfew_time ?? "",
        allowed_programs: existingDorm.dormitory?.allowed_programs ?? "",
        term_type: existingDorm.dormitory?.term_type ?? "semester",
        separate_by_gender: existingDorm.dormitory?.separate_by_gender ?? true,
        manager_id: existingDorm.manager_id ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setStep(1);
    setError(null);
  }, [existingDorm, isOpen]);

//   function handleChange(
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
//     >,
//   ) {
//     const { name, value, type } = e.target;
//     const checked = (e.target as HTMLInputElement).checked;
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   }


  const handleChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    // if (isEditing && existingDorm) {
    //     // ── UPDATE ──────────────────────────────────────────────────────────
    //     const res = await fetch(
    //       `/api/admin/housing/dorms?id=${existingDorm.accommodation_id}`,
    //       {
    //         method: "PATCH",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({
    //           accommodationFields: {
    //             name: form.name,
    //             location: form.location,
    //             manager_id: form.manager_id,
    //             total_capacity: Number(form.total_capacity),
    //           },
    //           dormitoryFields: {
    //             number_of_semestersAllowed: Number(
    //               form.number_of_semesters_allowed,
    //             ),
    //             curfew_time: form.curfew_time || null,
    //             allowed_programs: form.allowed_programs || null,
    //             term_type: form.term_type,
    //             separate_by_gender: form.separate_by_gender,
    //           },
    //         }),
    //       },
    //     );
    //     const data = await res.json();
    //     if (!res.ok) throw new Error(data.error || "Update failed");
    //   } else {
    //     // ── CREATE ──────────────────────────────────────────────────────────
    //     const res = await fetch("/api/admin/housing/dorms", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         name: form.name,
    //         location: form.location,
    //         manager_id: form.manager_id,
    //         total_capacity: Number(form.total_capacity),
    //         number_of_semesters_allowed: Number(
    //           form.number_of_semesters_allowed,
    //         ),
    //         curfew_time: form.curfew_time || null,
    //         allowed_programs: form.allowed_programs || null,
    //         term_type: form.term_type,
    //         separate_by_gender: form.separate_by_gender,
    //       }),
    //     });
    //     const data = await res.json();
    //     if (!res.ok) throw new Error(data.error || "Create failed");
    //   }

    //   onSuccess();
    //   onClose();
    // } catch (err: any) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }

    try {
      const payload = {
        accommodationFields: {
          name: form.name,
          location: form.location,
          manager_id: form.manager_id,
          total_capacity: Number(form.total_capacity),
        },
        dormitoryFields: {
          number_of_semestersAllowed: Number(form.number_of_semesters_allowed),
          curfew_time: form.curfew_time || null,
          allowed_programs: form.allowed_programs || null,
          term_type: form.term_type,
          separate_by_gender: form.separate_by_gender,
        },
      };

      const endpoint = isEditing 
        ? `/api/admin/housing/dorms?id=${existingDorm.accommodation_id}` 
        : "/api/admin/housing/dorms";
      
    // UPDATE - PATCH 
    // CREATE - POST
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? payload : {
            ...payload.accommodationFields,
            ...payload.dormitoryFields,
            number_of_semesters_allowed: payload.dormitoryFields.number_of_semestersAllowed
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step validation ────────────────────────────────────────────────────────
  function canProceed() {
    if (step === 1) return form.name && form.location && form.total_capacity;
    if (step === 2) return form.number_of_semesters_allowed && form.term_type;
    if (step === 3) return form.manager_id;
    return true;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Dormitory" : "Add Dormitory"}
      description={isEditing ? "Modify dormitory details and policies." : "Register a new university dormitory."}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
              ${step === i + 1 
                ? "bg-[#5591AB] text-white" 
                : step > i + 1 
                  ? "bg-[#5591AB] text-white opacity-80" 
                  : "bg-muted text-muted-foreground"}`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`h-[2px] w-6 ${step > i + 1 
                ? "bg-[#5591AB]" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <FieldGroup>
        {/* Step 1 — Dorm Details */}
        {step === 1 && (
          <>
            <Field>
              <Label htmlFor="name" className="font-semibold">Dorm Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Sampaguita Dormitory"
              />
            </Field>
            <Field>
              <Label htmlFor="location" className="font-semibold">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g. Main Campus"
              />
            </Field>
            <Field>
              <Label htmlFor="total_capacity" className="font-semibold">Total Capacity</Label>
              <Input
                id="total_capacity"
                type="number"
                value={form.total_capacity}
                onChange={(e) => handleChange("total_capacity", e.target.value)}
                placeholder="40"
              />
            </Field>
          </>
        )}

        {/* Step 2 — Dorm Policies */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label className="font-semibold">Semesters Allowed</Label>
                <Input
                  type="number"
                  value={form.number_of_semesters_allowed}
                  onChange={(e) => handleChange("number_of_semesters_allowed", e.target.value)}
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
                onChange={(e) => handleChange("allowed_programs", e.target.value)}
                placeholder="All programs..."
              />
            </Field>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="gender" 
                className="data-[state=checked]:bg-[#5591AB] data-[state=checked]:border-[#5591AB]"
                checked={form.separate_by_gender}
                onCheckedChange={(checked) => handleChange("separate_by_gender", checked)}
              />
              <Label htmlFor="gender" className="text-sm font-semibold">Separate by Gender</Label>
            </div>
          </>
        )}

        {/* Step 3 — Assign Manager */}
        {step === 3 && (
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

        {/* Step 4 — Unit Setup (create only) */}
        {step === 4 && !isEditing && (
          <div className="rounded-lg bg-[#E7FAD3] p-4 text-xs text-[#78A24C] border border-[#78A24C]">
            <p className="font-semibold mb-1">Dormitory will be created</p>
            <p>You can add units/rooms from the property detail page after
              creation.</p>
          </div>
        )}

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </FieldGroup>

    {/* Navigation buttons */}
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
            className={isEditing 
              ? "bg-[#5591AB] hover:bg-[#467a8f]" 
              : "bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"}
          >
            {loading 
                ? "Saving..." 
                : isEditing 
                    ? "Save Changes" 
                    : "Create Dormitory"}
          </Button>
        )}
      </div>
    </Modal>
  );
}