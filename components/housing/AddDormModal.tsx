// components/housing/AddDormModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

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
  // Step 3
  manager_id: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingDorm?: any | null; // pass full dorm object when editing
}

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

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      if (isEditing && existingDorm) {
        // ── UPDATE ──────────────────────────────────────────────────────────
        const res = await fetch(
          `/api/housing/dorms?id=${existingDorm.accommodation_id}`,
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
              dormitoryFields: {
                number_of_semestersAllowed: Number(
                  form.number_of_semesters_allowed,
                ),
                curfew_time: form.curfew_time || null,
                allowed_programs: form.allowed_programs || null,
                term_type: form.term_type,
                separate_by_gender: form.separate_by_gender,
              },
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        // ── CREATE ──────────────────────────────────────────────────────────
        const res = await fetch("/api/housing/dorms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            location: form.location,
            manager_id: form.manager_id,
            total_capacity: Number(form.total_capacity),
            number_of_semesters_allowed: Number(
              form.number_of_semesters_allowed,
            ),
            curfew_time: form.curfew_time || null,
            allowed_programs: form.allowed_programs || null,
            term_type: form.term_type,
            separate_by_gender: form.separate_by_gender,
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
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${
                step === i + 1
                  ? "bg-blue-600 text-white"
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
        {/* Step 1 — Dorm Details */}
        {step === 1 && (
          <>
            <FLabel label="Dorm Name" required>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="e.g. Sampaguita Dormitory"
              />
            </FLabel>
            <FLabel label="Location" required>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="e.g. Main Campus, Building C"
              />
            </FLabel>
            <FLabel label="Total Capacity" required>
              <input
                name="total_capacity"
                type="number"
                value={form.total_capacity}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="e.g. 40"
              />
            </FLabel>
          </>
        )}

        {/* Step 2 — Dorm Policies */}
        {step === 2 && (
          <>
            <FLabel label="Number of Semesters Allowed" required>
              <input
                name="number_of_semesters_allowed"
                type="number"
                value={form.number_of_semesters_allowed}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="e.g. 2"
              />
            </FLabel>
            <FLabel label="Term Type" required>
              <select
                name="term_type"
                value={form.term_type}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="semestral">Semestral</option>
                <option value="annual">Annual</option>
              </select>
            </FLabel>
            <FLabel label="Curfew Time">
              <input
                name="curfew_time"
                type="time"
                value={form.curfew_time}
                onChange={handleChange}
                className={inputCls}
              />
            </FLabel>
            <FLabel label="Allowed Programs">
              <textarea
                name="allowed_programs"
                value={form.allowed_programs}
                onChange={handleChange}
                rows={2}
                className={inputCls}
                placeholder="e.g. All programs, or BS Computer Science only"
              />
            </FLabel>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="separate_by_gender"
                checked={form.separate_by_gender}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <span>Separate by Gender</span>
            </label>
          </>
        )}

        {/* Step 3 — Assign Manager */}
        {step === 3 && (
          <>
            <FLabel label="Assign Property Manager" required>
              <select
                name="manager_id"
                value={form.manager_id}
                onChange={handleChange}
                required
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
            </FLabel>
            {form.manager_id && (
              <p className="text-xs text-green-600 bg-green-50 rounded p-2">
                ✓ Manager selected
              </p>
            )}
          </>
        )}

        {/* Step 4 — Unit Setup (create only) */}
        {step === 4 && !isEditing && (
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Dormitory will be created.</p>
            <p>
              You can add units/rooms from the property detail page after
              creation.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Navigation buttons */}
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
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
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
                : "Create Dormitory"}
          </button>
        )}
      </div>
    </Modal>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function FLabel({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
