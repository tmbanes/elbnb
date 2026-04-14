// components/housing/modals/AddRentalSpaceModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

// ui components
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

interface Manager {
  employee_id: string;
  users: { user_id: string; first_name: string; last_name: string };
}

interface RentalForm {
  name: string;
  location: string;
  total_capacity: string;
  property_type: string;
  allow_shortterm_stay: boolean;
  allow_longterm_stay: boolean;
  minimum_stay_days: string;
  maximum_stay_days: string;
  security_deposit_required: boolean;
  manager_id: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingRental?: any | null;
}

// initial empty form state
const EMPTY: RentalForm = {
  name: "",
  location: "",
  total_capacity: "",
  property_type: "boarding",
  allow_shortterm_stay: false,
  allow_longterm_stay: true,
  minimum_stay_days: "",
  maximum_stay_days: "",
  security_deposit_required: false,
  manager_id: "",
};

export default function AddRentalSpaceModal({
  isOpen,
  onClose,
  onSuccess,
  existingRental,
}: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RentalForm>(EMPTY);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingRental;
  const totalSteps = 3;

  // Fetch managers
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/housing/managers")
      .then((r) => r.json())
      .then(setManagers)
      .catch(() => {});
  }, [isOpen]);

  // Pre-fill when editing
  useEffect(() => {
    if (existingRental) {
      setForm({
        name: existingRental.name ?? "",
        location: existingRental.location ?? "",
        total_capacity: String(existingRental.total_capacity ?? ""),
        property_type: existingRental.renting_space?.property_type ?? "boarding",
        allow_shortterm_stay: existingRental.renting_space?.allow_shortterm_stay ?? false,
        allow_longterm_stay: existingRental.renting_space?.allow_longterm_stay ?? true,
        minimum_stay_days: String(existingRental.renting_space?.minimum_stay_days ?? "",),
        maximum_stay_days: String(existingRental.renting_space?.maximum_stay_days ?? "",),
        security_deposit_required:existingRental.renting_space?.security_deposit_required ?? false,
        manager_id: existingRental.manager_id ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setStep(1);
    setError(null);
  }, [existingRental, isOpen]);

  // function handleChange(
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  // ) {
  //   const { name, value, type } = e.target;
  //   const checked = (e.target as HTMLInputElement).checked;
  //   setForm((prev) => ({
  //     ...prev,
  //     [name]: type === "checkbox" ? checked : value,
  //   }));
  // }

  const handleChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canProceed = () => {
    if (step === 1) return form.name && form.location && form.total_capacity && form.property_type;
    if (step === 3) return !!form.manager_id;
    return true;
  };

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    // try {
    //   if (isEditing && existingRental) {
    //     // ── UPDATE ──────────────────────────────────────────────────────────
    //     const res = await fetch(
    //       `/api/admin/housing/rental-spaces?id=${existingRental.accommodation_id}`,
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
    //           rentingFields: {
    //             property_type: form.property_type,
    //             allow_shortterm_stay: form.allow_shortterm_stay,
    //             allow_longterm_stay: form.allow_longterm_stay,
    //             minimum_stay_days: form.minimum_stay_days
    //               ? Number(form.minimum_stay_days)
    //               : null,
    //             maximum_stay_days: form.maximum_stay_days
    //               ? Number(form.maximum_stay_days)
    //               : null,
    //             security_deposit_required: form.security_deposit_required,
    //           },
    //         }),
    //       },
    //     );
    //     const data = await res.json();
    //     if (!res.ok) throw new Error(data.error || "Update failed");
    //   } else {
    //     // ── CREATE ──────────────────────────────────────────────────────────
    //     const res = await fetch("/api/admin/housing/rental-spaces", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         name: form.name,
    //         location: form.location,
    //         manager_id: form.manager_id,
    //         total_capacity: Number(form.total_capacity),
    //         property_type: form.property_type,
    //         allow_shortterm_stay: form.allow_shortterm_stay,
    //         allow_longterm_stay: form.allow_longterm_stay,
    //         minimum_stay_days: form.minimum_stay_days
    //           ? Number(form.minimum_stay_days)
    //           : null,
    //         maximum_stay_days: form.maximum_stay_days
    //           ? Number(form.maximum_stay_days)
    //           : null,
    //         security_deposit_required: form.security_deposit_required,
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
        ? `/api/admin/housing/rental-spaces?id=${existingRental.accommodation_id}`
        : "/api/admin/housing/rental-spaces";

      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? payload : { ...payload.accommodationFields, ...payload.rentingFields }),
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Rental Space" : "Add Rental Space"}
      description={isEditing ? "Update configuration for this rental property." : "Register a new off-campus rental space."}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
              ${step === i + 1 
                ? "bg-[#EB8A0B] text-white" 
                : step > i + 1 
                  ? "bg-[#78A24C] text-white" 
                  : "bg-muted text-muted-foreground"}`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`h-[2px] w-6 ${step > i + 1 
                ? "bg-[#78A24C]" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <FieldGroup>

        {/* Step 1 — Property Details */}
        {step === 1 && (
          <>
            <Field>
              <Label htmlFor="name" className="font-semibold">Property Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Mabini Boarding House"
              />
            </Field>
            <Field>
              <Label htmlFor="location" className="font-semibold">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g. Near East Gate"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="total_capacity" className="font-semibold">Total Capacity</Label>
                <Input
                  id="total_capacity"
                  type="number"
                  value={form.total_capacity}
                  onChange={(e) => handleChange("total_capacity", e.target.value)}
                  placeholder="10"
                />
              </Field>
              <Field>
                <Label className="font-semibold">Property Type</Label>
                <Select value={form.property_type} onValueChange={(val) => handleChange("property_type", val)}>
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
            </div>
          </>
        )}

        {/* Step 2 — Stay Configuration */}
        {step === 2 && (
          <>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shortterm"
                  className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                  checked={form.allow_shortterm_stay}
                  onCheckedChange={(val) => handleChange("allow_shortterm_stay", val)}
                />
                <Label htmlFor="shortterm" className="text-sm font-semibold cursor-pointer">
                    Allow Short-Term Stay</Label>
              </div>

                {/* Only show day inputs if short-term is on */}
                {form.allow_shortterm_stay && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <Field>
                    <Label className="font-semibold">Min Stay (Days)</Label>
                    <Input
                        type="number"
                        value={form.minimum_stay_days}
                        onChange={(e) => handleChange("minimum_stay_days", e.target.value)}
                    />
                    </Field>
                    <Field>
                    <Label className="font-semibold">Max Stay (Days)</Label>
                    <Input
                        type="number"
                        value={form.maximum_stay_days}
                        onChange={(e) => handleChange("maximum_stay_days", e.target.value)}
                    />
                    </Field>
                </div>
                )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="longterm"
                  className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                  checked={form.allow_longterm_stay}
                  onCheckedChange={(val) => handleChange("allow_longterm_stay", val)}
                />
                <Label htmlFor="longterm" className="text-sm font-semibold cursor-pointer">
                    Allow Long-Term Stay</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                    id="deposit"
                    className="data-[state=checked]:bg-[#EB8A0B] data-[state=checked]:border-[#EB8A0B]"
                    checked={form.security_deposit_required}
                    onCheckedChange={(val) => handleChange("security_deposit_required", val)}
                    />
                <Label htmlFor="deposit" className="text-sm font-semibold cursor-pointer">
                    Security Deposit Required</Label>
                </div>
            </div>

            
          </>

          
        )}

        {/* Step 3 — Assign Manager */}
        {step === 3 && (
          <Field>
            <Label className="font-semibold">Assign a Property Manager</Label>
            <Select value={form.manager_id} onValueChange={(val) => handleChange("manager_id", val)}>
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

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </FieldGroup>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={() => (step > 1 
          ? setStep((s) => s - 1) 
          : onClose())}>
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < totalSteps ? (
          <Button 
            disabled={!canProceed()} 
            onClick={() => setStep((s) => s + 1)}
            className="bg-[#EB8A0B] hover:bg-[#EFC58F] text-white"
          >
            Next
          </Button>
        ) : (
          <Button
            disabled={loading || !canProceed()}
            onClick={handleSubmit}
            className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
          >
            {loading 
            ? "Saving..." 
            : isEditing 
              ? "Save Changes" 
              : "Create Rental Space"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
