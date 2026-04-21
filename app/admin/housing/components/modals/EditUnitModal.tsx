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
import { Card, CardContent } from "@/components/ui/card";

interface Unit {
  unit_id: string;
  unit_number: string;
  unit_type: string;
  max_occupancy: number;
  rental_fee: number;
  billing_period: string;
  furnishing_status: string;
  min_stay_duration: number | null;
  max_stay_duration: number | null;
  accommodation_id?: string;
}

interface UnitFormData {
  unit_number: string;
  unit_type: string;
  max_occupancy: string;
  rental_fee: string;
  billing_period: string;
  furnishing_status: string;
  min_stay_duration: string;
  max_stay_duration: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  onSuccess: (updatedUnit: Unit) => void;
  accentColor?: string;
}

export default function EditUnitModal({
  isOpen,
  onClose,
  unit,
  onSuccess,
  accentColor = "#EB8A0B",
}: Props) {
  const [form, setForm] = useState<UnitFormData>({
    unit_number: "",
    unit_type: "",
    max_occupancy: "",
    rental_fee: "",
    billing_period: "monthly",
    furnishing_status: "semi-furnished",
    min_stay_duration: "",
    max_stay_duration: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && unit) {
      setForm({
        unit_number: unit.unit_number || "",
        unit_type: unit.unit_type || "",
        max_occupancy: String(unit.max_occupancy) || "",
        rental_fee: String(unit.rental_fee) || "",
        billing_period: unit.billing_period || "monthly",
        furnishing_status: unit.furnishing_status || "semi-furnished",
        min_stay_duration: unit.min_stay_duration ? String(unit.min_stay_duration) : "",
        max_stay_duration: unit.max_stay_duration ? String(unit.max_stay_duration) : "",
      });
      setError(null);
    }
  }, [isOpen, unit]);

  function handleChange(field: keyof UnitFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    // Validate required fields
    if (!form.unit_number.trim()) {
      setError("Unit number is required");
      return;
    }
    if (!form.max_occupancy || parseInt(form.max_occupancy) < 1) {
      setError("Max occupancy must be at least 1");
      return;
    }
    if (!form.rental_fee || parseInt(form.rental_fee) < 0) {
      setError("Rental fee is required");
      return;
    }

    if (!unit) {
      setError("Unit data is missing");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/housing/units?id=${unit.unit_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_number: form.unit_number,
          unit_type: form.unit_type,
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
        throw new Error(data.error || "Failed to update unit");
      }

      // Return updated unit object for consistency
      onSuccess({
        ...unit,
        unit_id: unit.unit_id,
        unit_number: form.unit_number,
        unit_type: form.unit_type,
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
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (!unit) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Unit"
      description={`Editing Unit ${unit.unit_number}`}
    >
      <Card
        className="shadow-sm bg-[#FDFFF4] transition-all duration-300 ease-in-out"
        style={{ borderTop: `6px solid ${accentColor}` }}
      >
        <CardContent className="pt-6 space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Unit No. | Unit Type */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label className="text-sm font-semibold">
                Unit No. <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.unit_number}
                onChange={(e) => handleChange("unit_number", e.target.value)}
                placeholder="e.g. 101"
                disabled={loading}
              />
            </Field>
            <Field>
              <Label className="text-sm font-semibold text-muted-foreground">
                Unit Type
              </Label>
              <Input
                value={form.unit_type}
                onChange={(e) => handleChange("unit_type", e.target.value)}
                placeholder="e.g. 1BR, Studio"
                disabled={loading}
              />
            </Field>
          </div>

          {/* Max Occupancy | Rental Fee */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label className="text-sm font-semibold">
                Max Occupancy <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                value={form.max_occupancy}
                onChange={(e) => handleChange("max_occupancy", e.target.value)}
                placeholder="1"
                disabled={loading}
              />
            </Field>
            <Field>
              <Label className="text-sm font-semibold">
                Rental Fee (₱) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={form.rental_fee}
                onChange={(e) => handleChange("rental_fee", e.target.value)}
                placeholder="0"
                disabled={loading}
              />
            </Field>
          </div>

          {/* Billing Period | Furnishing Status */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label className="text-sm font-semibold">
                Billing Period <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.billing_period}
                onValueChange={(val) => handleChange("billing_period", val)}
                disabled={loading}
              >
                <SelectTrigger>
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
              <Label className="text-sm font-semibold">
                Furnishing <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.furnishing_status}
                onValueChange={(val) => handleChange("furnishing_status", val)}
                disabled={loading}
              >
                <SelectTrigger>
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

          {/* Min Stay | Max Stay (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label className="text-sm font-semibold text-muted-foreground">
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
              />
            </Field>
            <Field>
              <Label className="text-sm font-semibold text-muted-foreground">
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
              />
            </Field>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#e2e4c0]">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-[#e2e4c0]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#264384] hover:bg-[#5273BC] text-white"
            >
              {loading ? "Updating..." : "Update Unit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  );
}
