// components/housing/AddRentalSpaceModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

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
    fetch("/api/housing/managers?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setManagers(data);
        } else if (data && Array.isArray(data.data)) {
          setManagers(data.data);
        } else {
          setManagers([]);
        }
      })
      .catch(() => setManagers([]));
  }, [isOpen]);

  // Pre-fill when editing
  useEffect(() => {
    if (existingRental) {
      setForm({
        name: existingRental.name ?? "",
        location: existingRental.location ?? "",
        total_capacity: String(existingRental.total_capacity ?? ""),
        property_type:
          existingRental.renting_space?.property_type ?? "boarding",
        allow_shortterm_stay:
          existingRental.renting_space?.allow_shortterm_stay ?? false,
        allow_longterm_stay:
          existingRental.renting_space?.allow_longterm_stay ?? true,
        minimum_stay_days: String(
          existingRental.renting_space?.minimum_stay_days ?? "",
        ),
        maximum_stay_days: String(
          existingRental.renting_space?.maximum_stay_days ?? "",
        ),
        security_deposit_required:
          existingRental.renting_space?.security_deposit_required ?? false,
        manager_id: existingRental.manager_id ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setStep(1);
    setError(null);
  }, [existingRental, isOpen]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function canProceed() {
    if (step === 1)
      return (
        form.name && form.location && form.total_capacity && form.property_type
      );
    if (step === 2) return true; // all step 2 fields are optional/toggles
    if (step === 3) return form.manager_id;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      if (isEditing && existingRental) {
        // ── UPDATE ──────────────────────────────────────────────────────────
        const res = await fetch(
          `/api/housing/rental-spaces?id=${existingRental.accommodation_id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        // ── CREATE ──────────────────────────────────────────────────────────
        const res = await fetch("/api/housing/rental-spaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            location: form.location,
            manager_id: form.manager_id,
            total_capacity: Number(form.total_capacity),
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
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Rental Space" : "Add Rental Space"}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${
                step === i + 1
                  ? "bg-orange-500 text-white"
                  : step > i + 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`h-0.5 w-8 ${step > i + 1 ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-gray-500">
          Step {step} of {totalSteps}
        </span>
      </div>

      <div className="space-y-4">
        {/* Step 1 — Property Details */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. Mabini Boarding House"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. Near East Gate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Capacity <span className="text-red-500">*</span>
              </label>
              <input
                name="total_capacity"
                type="number"
                value={form.total_capacity}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                name="property_type"
                value={form.property_type}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="apartment">Apartment</option>
                <option value="boarding">Boarding House</option>
                <option value="transient">Transient</option>
                <option value="house">House</option>
              </select>
            </div>
          </>
        )}

        {/* Step 2 — Stay Configuration */}
        {step === 2 && (
          <>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="allow_shortterm_stay"
                checked={form.allow_shortterm_stay}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <span>Allow Short-Term Stay</span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="allow_longterm_stay"
                checked={form.allow_longterm_stay}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <span>Allow Long-Term Stay</span>
            </label>

            {/* Only show day inputs if short-term is on */}
            {form.allow_shortterm_stay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Stay Days
                  </label>
                  <input
                    name="minimum_stay_days"
                    type="number"
                    value={form.minimum_stay_days}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 7"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Stay Days
                  </label>
                  <input
                    name="maximum_stay_days"
                    type="number"
                    value={form.maximum_stay_days}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="e.g. 90"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="security_deposit_required"
                checked={form.security_deposit_required}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <span>Security Deposit Required</span>
            </label>
          </>
        )}

        {/* Step 3 — Assign Manager */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Property Manager <span className="text-red-500">*</span>
              </label>
              <select
                name="manager_id"
                value={form.manager_id}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="">Select a manager...</option>
                {managers.map((m) => {
                  const firstName = Array.isArray(m.users) ? m.users[0]?.first_name : m.users?.first_name;
                  const lastName = Array.isArray(m.users) ? m.users[0]?.last_name : m.users?.last_name;
                  return (
                    <option key={m.employee_id} value={m.employee_id}>
                      {firstName} {lastName}
                    </option>
                  );
                })}
              </select>
            </div>
            {form.manager_id && (
              <p className="text-xs text-green-600 bg-green-50 rounded p-2">
                ✓ Manager selected
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
          className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
        >
          {step === 1 ? "Cancel" : "← Back"}
        </button>
        {step < totalSteps ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
            className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || !canProceed()}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
          >
            {loading
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Rental Space"}
          </button>
        )}
      </div>
    </Modal>
  );
}
