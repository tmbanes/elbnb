"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddManagerModal from "@/components/housing/AddManagerModal";

interface Manager {
  employee_id: string;
  office_location: string;
  users: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

function ManagersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id");

  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any | null>(null);

  // ── Fetch all managers ─────────────────────────────────────────────────────
  async function fetchManagers() {
    try {
      const res = await fetch("/api/admin/housing/managers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setManagers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchManagers();
  }, []);

  // ── Fetch single manager when ?id= changes ─────────────────────────────────
  useEffect(() => {
    if (!selectedId) {
      setSelectedManager(null);
      return;
    }

    async function fetchManager() {
      try {
        const res = await fetch(`/api/admin/housing/managers?id=${selectedId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSelectedManager(data);
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchManager();
  }, [selectedId]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSelect(id: string) {
    router.push(`/dashboard/admin/housing/managers?id=${id}`);
  }

  function handleBack() {
    router.push("/dashboard/admin/housing/managers");
  }

  function openAddModal() {
    setEditingManager(null);
    setModalOpen(true);
  }

  function openEditModal(m: Manager) {
    setEditingManager({
      employee_id: m.employee_id,
      user_id: m.users.user_id,
      first_name: m.users.first_name,
      last_name: m.users.last_name,
      email: m.users.email,
      office_location: m.office_location,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingManager(null);
  }

  async function handleDelete(employeeId: string) {
    if (!confirm("Are you sure you want to delete this manager?")) return;

    const res = await fetch(`/api/admin/housing/managers?id=${employeeId}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || "Delete failed");
      return;
    }

    setManagers((prev) => prev.filter((m) => m.employee_id !== employeeId));
    if (selectedId === employeeId) handleBack();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <p className="p-6">Loading managers...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  // ── Profile view ───────────────────────────────────────────────────────────
  if (selectedId && selectedManager) {
    return (
      <div className="p-6 space-y-6">
        <button onClick={handleBack} className="text-blue-600 hover:underline">
          ← Back to Managers
        </button>

        <div className="rounded border p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {selectedManager.users.first_name}{" "}
                {selectedManager.users.last_name}
              </h1>
              <p className="text-gray-500">{selectedManager.users.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                Office: {selectedManager.office_location || "—"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(selectedManager)}
                className="px-3 py-1 border rounded hover:bg-gray-100 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedManager.employee_id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <AssignedProperties managerId={selectedManager.users.user_id} />

        <AddManagerModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSuccess={() => {
            fetchManagers();
            closeModal();
          }}
          existingManager={editingManager}
        />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-4">
      <button
        onClick={() => router.push("/dashboard/admin/housing")}
        className="text-blue-600 hover:underline"
      >
        ← Back to Housing
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Property Managers</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          + Add Property Manager
        </button>
      </div>

      {managers.length === 0 ? (
        <p className="text-gray-500">
          No managers yet. Add one to get started.
        </p>
      ) : (
        <table className="w-full text-sm border rounded">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Office Location</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {managers.map((m) => (
              <tr key={m.employee_id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">
                  {m.users.first_name} {m.users.last_name}
                </td>
                <td>{m.users.email}</td>
                <td>{m.office_location || "—"}</td>
                <td className="flex gap-2 p-3">
                  <button
                    onClick={() => handleSelect(m.employee_id)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(m)}
                    className="text-gray-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.employee_id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AddManagerModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={() => {
          fetchManagers();
          closeModal();
        }}
        existingManager={editingManager}
      />
    </div>
  );
}

// ── Assigned Properties ────────────────────────────────────────────────────
function AssignedProperties({ managerId }: { managerId: string }) {
  const [properties, setProperties] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchAssigned() {
      const [d, r] = await Promise.all([
        fetch("/api/admin/housing/dorms").then((r) => r.json()),
        fetch("/api/admin/housing/rental-spaces").then((r) => r.json()),
      ]);
      const all = [...(d || []), ...(r || [])];
      setProperties(all.filter((p: any) => p.manager_id === managerId));
    }
    fetchAssigned();
  }, [managerId]);

  return (
    <div className="rounded border p-4">
      <h2 className="font-semibold mb-3">
        Assigned Properties ({properties.length})
      </h2>
      {properties.length === 0 ? (
        <p className="text-sm text-gray-500">No properties assigned.</p>
      ) : (
        <ul className="space-y-2">
          {properties.map((p) => (
            <li
              key={p.accommodation_id}
              className="flex items-center justify-between text-sm border rounded p-2"
            >
              <span>
                {p.name} — <span className="text-gray-500">{p.location}</span>
              </span>
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/admin/housing/properties?id=${p.accommodation_id}`,
                  )
                }
                className="text-blue-600 hover:underline text-xs"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────
export default function ManagersPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <ManagersContent />
    </Suspense>
  );
}
