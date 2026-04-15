"use client";

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
import { X } from "lucide-react";

export interface UnitFormData {
  unit_number: string;
  unit_type: string;
  max_occupancy: string;
  rental_fee: string;
  billing_period: string;
  furnishing_status: string;
  min_stay_duration: string;
  max_stay_duration: string;
}

export const EMPTY_UNIT: UnitFormData = {
  unit_number: "",
  unit_type: "",
  max_occupancy: "",
  rental_fee: "",
  billing_period: "monthly",
  furnishing_status: "semi-furnished",
  min_stay_duration: "",
  max_stay_duration: "",
};

interface Props {
  index: number;
  data: UnitFormData;
  onChange: (index: number, field: keyof UnitFormData, value: string) => void;
  onRemove: (index: number) => void;
  accentColor?: string;
}

export default function UnitEntryCard({
  index,
  data,
  onChange,
  onRemove,
  accentColor = "#EB8A0B",
}: Props) {
  return (
    <div
      className="rounded-lg border bg-background/60 p-3 space-y-2"
      style={{ borderColor: `${accentColor}50` }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between pb-1 border-b"
        style={{ borderColor: `${accentColor}30` }}
      >
        <span className="text-xs font-bold" style={{ color: accentColor }}>
          Unit {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Unit No. | Unit Type */}
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <Label className="text-xs font-semibold">
            Unit No. <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.unit_number}
            onChange={(e) => onChange(index, "unit_number", e.target.value)}
            placeholder="e.g. 101"
            className="h-8 text-xs"
          />
        </Field>
        <Field>
          <Label className="text-xs font-semibold text-muted-foreground">
            Unit Type
          </Label>
          <Input
            value={data.unit_type}
            onChange={(e) => onChange(index, "unit_type", e.target.value)}
            placeholder="e.g. 1BR, Studio"
            className="h-8 text-xs"
          />
        </Field>
      </div>

      {/* Max Occupancy | Rental Fee */}
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <Label className="text-xs font-semibold">
            Max Occupancy <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min="1"
            value={data.max_occupancy}
            onChange={(e) => onChange(index, "max_occupancy", e.target.value)}
            placeholder="1"
            className="h-8 text-xs"
          />
        </Field>
        <Field>
          <Label className="text-xs font-semibold">
            Rental Fee (₱) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min="0"
            value={data.rental_fee}
            onChange={(e) => onChange(index, "rental_fee", e.target.value)}
            placeholder="0"
            className="h-8 text-xs"
          />
        </Field>
      </div>

      {/* Billing Period | Furnishing Status */}
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <Label className="text-xs font-semibold">
            Billing Period <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.billing_period}
            onValueChange={(val) => onChange(index, "billing_period", val)}
          >
            <SelectTrigger className="h-8 text-xs">
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
          <Label className="text-xs font-semibold">
            Furnishing <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.furnishing_status}
            onValueChange={(val) => onChange(index, "furnishing_status", val)}
          >
            <SelectTrigger className="h-8 text-xs">
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
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <Label className="text-xs font-semibold text-muted-foreground">
            Min Stay (days)
          </Label>
          <Input
            type="number"
            min="1"
            value={data.min_stay_duration}
            onChange={(e) => onChange(index, "min_stay_duration", e.target.value)}
            placeholder="Optional"
            className="h-8 text-xs"
          />
        </Field>
        <Field>
          <Label className="text-xs font-semibold text-muted-foreground">
            Max Stay (days)
          </Label>
          <Input
            type="number"
            min="1"
            value={data.max_stay_duration}
            onChange={(e) => onChange(index, "max_stay_duration", e.target.value)}
            placeholder="Optional"
            className="h-8 text-xs"
          />
        </Field>
      </div>
    </div>
  );
}