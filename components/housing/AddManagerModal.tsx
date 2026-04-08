"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingManager?: {
    employee_id: string;
    user_id: string;
    office_location: string;
  } | null;
}

export default function AddManagerModal({
  isOpen,
  onClose,
  onSuccess,
  existingManager,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingManager;

  // Fetch users with role = dormitory_manager
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/housing/managers/available-users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, [isOpen]);

  // Pre-fill when editing
  useEffect(() => {
    if (existingManager) {
      setSelectedUserId(existingManager.user_id);
      setOfficeLocation(existingManager.office_location ?? "");
    } else {
      setSelectedUserId("");
      setOfficeLocation("");
    }
    setError(null);
  }, [existingManager, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && existingManager) {
        // ── UPDATE — only office location can change ─────────────────────
        const res = await fetch(
          `/api/admin/housing/managers?id=${existingManager.employee_id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              managerFields: { office_location: officeLocation },
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        // ── CREATE — link existing user to dormitory_manager ─────────────
        const res = await fetch("/api/admin/housing/managers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedUserId,
            office_location: officeLocation,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Property Manager" : "Add Property Manager"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User dropdown — only shown when creating */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User <span className="text-red-500">*</span>
            </label>
            {users.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 rounded p-3">
                No users with the role <strong>dormitory_manager</strong> found.
                Assign the role in the Users table first.
              </p>
            ) : (
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" className="text-gray-900 bg-white">
                  Select a user...
                </option>
                {users.map((u) => (
                  <option
                    key={u.user_id}
                    value={u.user_id}
                    className="text-gray-900 bg-white"
                  >
                    {u.first_name} {u.last_name} — {u.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Office Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Office Location
          </label>
          <input
            type="text"
            value={officeLocation}
            onChange={(e) => setOfficeLocation(e.target.value)}
            placeholder="e.g. Building A, Room 101"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (!isEditing && !selectedUserId)}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Manager"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
