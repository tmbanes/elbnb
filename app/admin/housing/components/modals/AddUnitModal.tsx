"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

interface UnitFormData {
  unit_type: string;
  number_of_units: string;
  max_occupancy: string;
  rental_fee: string;
  billing_period: string;
  furnishing_status: string;
  min_stay_duration: string;
  max_stay_duration: string;
}

const EMPTY_FORM: UnitFormData = {
  unit_type: "",
  number_of_units: "1",
  max_occupancy: "",
  rental_fee: "",
  billing_period: "monthly",
  furnishing_status: "semi-furnished",
  min_stay_duration: "",
  max_stay_duration: "",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (unit: any) => void;
  accommodationId: string;
}

export default function AddUnitModal({
  isOpen,
  onClose,
  onSuccess,
  accommodationId,
}: Props) {
  const [form, setForm] = useState<UnitFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen]);

  function handleChange(field: keyof UnitFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.unit_type.trim()) {
      setError("Unit type is required");
      return;
    }
    if (!form.number_of_units || parseInt(form.number_of_units) < 1) {
      setError("Number of units must be at least 1");
      return;
    }
    if (!form.max_occupancy || parseInt(form.max_occupancy) < 1) {
      setError("Max occupancy must be at least 1");
      return;
    }
    if (!form.rental_fee || parseFloat(form.rental_fee) < 0) {
      setError("Rental fee is required");
      return;
    }

    if (!showConfirm) {
      setError(null);
      setShowConfirm(true);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/housing/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accommodation_id: accommodationId,
          unit_type: form.unit_type.trim(),
          number_of_units: parseInt(form.number_of_units),
          max_occupancy: parseInt(form.max_occupancy),
          rental_fee: parseFloat(form.rental_fee),
          billing_period: form.billing_period,
          furnishing_status: form.furnishing_status,
          min_stay_duration: form.min_stay_duration
            ? parseInt(form.min_stay_duration)
            : null,
          max_stay_duration: form.max_stay_duration
            ? parseInt(form.max_stay_duration)
            : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create units");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }

  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Unit Type"
      description="Define a new unit template for this property"
    >
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}

        {/* Row 1: Unit Type | Number of Units */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label className="text-sm font-medium">
              Unit Type <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.unit_type}
              onChange={(e) => handleChange("unit_type", e.target.value)}
              placeholder="e.g. 1BR, Studio"
              disabled={loading}
              className="bg-[#FDFFF4]"
            />
          </Field>
          <Field>
            <Label className="text-sm font-medium">
              Number of Units <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              value={form.number_of_units}
              onChange={(e) => handleChange("number_of_units", e.target.value)}
              placeholder="1"
              disabled={loading}
              className="bg-[#FDFFF4]"
            />
          </Field>
        </div>

        {/* Row 2: Max Occupancy | Rental Fee */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label className="text-sm font-medium">
              Max Occupancy <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              value={form.max_occupancy}
              onChange={(e) => handleChange("max_occupancy", e.target.value)}
              placeholder="1"
              disabled={loading}
              className="bg-[#FDFFF4]"
            />
          </Field>
          <Field>
            <Label className="text-sm font-medium">
              Rental Fee (₱) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              value={form.rental_fee}
              onChange={(e) => handleChange("rental_fee", e.target.value)}
              placeholder="0"
              disabled={loading}
              className="bg-[#FDFFF4]"
            />
          </Field>
        </div>

        {/* Row 3: Billing Period | Furnishing Status */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label className="text-sm font-medium">
              Billing Period <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.billing_period}
              onValueChange={(val) => handleChange("billing_period", val)}
              disabled={loading}
            >
              <SelectTrigger className="bg-[#FDFFF4]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <Label className="text-sm font-medium">
              Furnishing <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.furnishing_status}
              onValueChange={(val) => handleChange("furnishing_status", val)}
              disabled={loading}
            >
              <SelectTrigger className="bg-[#FDFFF4]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="furnished">Furnished</SelectItem>
                <SelectItem value="semi-furnished">Semi-furnished</SelectItem>
                <SelectItem value="unfurnished">Unfurnished</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Row 4: Min Stay | Max Stay */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label className="text-sm font-medium text-muted-foreground">
              Min Stay (days)
            </Label>
            <Input
              type="number"
              min="1"
              value={form.min_stay_duration}
              onChange={(e) =>
                handleChange("min_stay_duration", e.target.value)
              }
              placeholder="Optional"
              disabled={loading}
              className="bg-[#FDFFF4]"
            />
          </Field>
          <Field>
            <Label className="text-sm font-medium text-muted-foreground">
              Max Stay (days)
            </Label>
            <Input
              type="number"
              min="1"
              value={form.max_stay_duration}
              onChange={(e) =>
                handleChange("max_stay_duration", e.target.value)
              }
              placeholder="Optional"
              disabled={loading}
              className="bg-[#FDFFF4]"
            />
          </Field>
        </div>

        {/* Confirmation Message */}
        {showConfirm && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 animate-in fade-in slide-in-from-top-1">
            <p className="font-semibold">Confirm Creation</p>
            <p>
              Are you sure you want to create {form.number_of_units} units of
              type <span className="font-bold underline">{form.unit_type}</span>?
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-3 border-t">
          <Button
            variant="outline"
            onClick={() => (showConfirm ? setShowConfirm(false) : onClose())}
            disabled={loading}
          >
            {showConfirm ? "Back" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "transition-all duration-200",
              showConfirm
                ? "bg-[#DF3538] hover:bg-[#DF3538]/90 text-white"
                : "bg-[#78A24C] hover:!bg-[#E7FAD3] text-white hover:!text-[#78A24C]"
            )}
          >
            {loading ? "Adding..." : showConfirm ? "Confirm & Create" : "Add Unit Type"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
