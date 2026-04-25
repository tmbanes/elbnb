import { useState, useEffect } from "react";
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
  unit_type: string;
  number_of_units: string;
  max_occupancy: string;
  rental_fee: string;
  billing_period: string;
  furnishing_status: string;
  min_stay_duration: string;
  max_stay_duration: string;
}

export const EMPTY_UNIT: UnitFormData = {
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
  const [localData, setLocalData] = useState<UnitFormData>(data);

  // Sync local state when prop changes
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleFieldChange = (field: keyof UnitFormData, value: string) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
    onChange(index, field, value);
  };

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
          Unit Type {index + 1}
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

      {/* Unit Type | Number of Units */}
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <Label className="text-xs font-semibold">
            Unit Type <span className="text-destructive">*</span>
          </Label>
          <Input
            value={localData.unit_type}
            onChange={(e) => handleFieldChange("unit_type", e.target.value)}
            placeholder="e.g. 1BR, Studio"
            className="h-8 text-xs bg-[#FDFFF4]"
          />
        </Field>
        <Field>
          <Label className="text-xs font-semibold">
            Number of Units <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min="1"
            value={localData.number_of_units}
            onChange={(e) => handleFieldChange("number_of_units", e.target.value)}
            placeholder="1"
            className="h-8 text-xs bg-[#FDFFF4]"
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
            value={localData.max_occupancy}
            onChange={(e) => handleFieldChange("max_occupancy", e.target.value)}
            placeholder="1"
            className="h-8 text-xs bg-[#FDFFF4]"
          />
        </Field>
        <Field>
          <Label className="text-xs font-semibold">
            Rental Fee (₱) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min="0"
            value={localData.rental_fee}
            onChange={(e) => handleFieldChange("rental_fee", e.target.value)}
            placeholder="0"
            className="h-8 text-xs bg-[#FDFFF4]"
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
            value={localData.billing_period}
            onValueChange={(val) => handleFieldChange("billing_period", val)}
          >
            <SelectTrigger className="h-8 text-xs bg-[#FDFFF4]">
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
            value={localData.furnishing_status}
            onValueChange={(val) => handleFieldChange("furnishing_status", val)}
          >
            <SelectTrigger className="h-8 text-xs bg-[#FDFFF4]">
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
            value={localData.min_stay_duration}
            onChange={(e) => handleFieldChange("min_stay_duration", e.target.value)}
            placeholder="Optional"
            className="h-8 text-xs bg-[#FDFFF4]"
          />
        </Field>
        <Field>
          <Label className="text-xs font-semibold text-muted-foreground">
            Max Stay (days)
          </Label>
          <Input
            type="number"
            min="1"
            value={localData.max_stay_duration}
            onChange={(e) => handleFieldChange("max_stay_duration", e.target.value)}
            placeholder="Optional"
            className="h-8 text-xs bg-[#FDFFF4]"
          />
        </Field>
      </div>
    </div>
  );
}