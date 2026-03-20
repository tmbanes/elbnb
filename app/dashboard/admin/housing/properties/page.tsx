"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddDormModal from "@/components/housing/AddDormModal";
import AddRentalSpaceModal from "@/components/housing/AddRentalSpaceModal";

// ── Types ──────────────────────────────────────────────────────────────────
interface Property {
  accommodation_id: string;
  name: string;
  location: string;
  accommodation_type: "dormitory" | "renting_space";
  accommodation_status: string;
  total_capacity: number;
  manager_id: string;
  dormitory_manager?: {
    employee_id: string;
    users: { first_name: string; last_name: string; email: string };
  };
  dormitory?: {
    number_of_semestersAllowed: number;
    curfew_time: string;
    allowed_programs: string;
    term_type: string;
    separate_by_gender: boolean;
  };
  renting_space?: {
    property_type: string;
    allow_shortterm_stay: boolean;
    allow_longterm_stay: boolean;
    minimum_stay_days: number;
    maximum_stay_days: number;
    security_deposit_required: boolean;
  };
  units?: {
    unit_id: string;
    unit_number: string;
    unit_type: string;
    max_occupancy: number;
    current_occupancy: number;
    rental_fee: number;
    unit_status: string;
  }[];
}

// ── Main content ───────────────────────────────────────────────────────────
function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id");
  const typeFilter = searchParams.get("type");

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerCount, setManagerCount] = useState(0);
  const [addPromptOpen, setAddPromptOpen] = useState(false);
  const [dormModalOpen, setDormModalOpen] = useState(false);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // ── Fetch list ─────────────────────────────────────────────────────────────
  async function fetchProperties() {
    try {
      const [dormsRes, rentalsRes, managersRes] = await Promise.all([
        fetch("/api/admin/housing/dorms"),
        fetch("/api/admin/housing/rental-spaces"),
        fetch("/api/admin/housing/managers"),
      ]);
      const [dorms, rentals, managers] = await Promise.all([
        dormsRes.json(),
        rentalsRes.json(),
        managersRes.json(),
      ]);
      setProperties([...(dorms || []), ...(rentals || [])]);
      setManagerCount(managers?.length ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProperties();
  }, []);

  // ── Fetch detail when ?id= changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) {
      setSelectedProperty(null);
      return;
    }

    async function fetchDetail() {
      setDetailLoading(true);
      try {
        const found = properties.find((p) => p.accommodation_id === selectedId);
        const endpoint =
          found?.accommodation_type === "renting_space"
            ? `/api/admin/housing/rental-spaces?id=${selectedId}`
            : `/api/admin/housing/dorms?id=${selectedId}`;

        const res = await fetch(endpoint);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSelectedProperty(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setDetailLoading(false);
      }
    }
    fetchDetail();
  }, [selectedId, properties]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSelectProperty(id: string) {
    router.push(`/dashboard/admin/housing/properties?id=${id}`);
  }

  function handleBackToList() {
    router.push("/dashboard/admin/housing/properties");
  }

  function openEditModal(property: Property) {
    setEditingProperty(property);
    if (property.accommodation_type === "dormitory") setDormModalOpen(true);
    else setRentalModalOpen(true);
  }

  function closeDormModal() {
    setDormModalOpen(false);
    setEditingProperty(null);
  }

  function closeRentalModal() {
    setRentalModalOpen(false);
    setEditingProperty(null);
  }

  async function handleDeleteProperty(id: string, type: string) {
    if (!confirm("Are you sure you want to delete this property?")) return;

    const endpoint =
      type === "renting_space"
        ? `/api/admin/housing/rental-spaces?id=${id}`
        : `/api/admin/housing/dorms?id=${id}`;

    const res = await fetch(endpoint, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok || data.success === false) {
      alert(data.error || "Delete failed");
      return;
    }

    setProperties((prev) => prev.filter((p) => p.accommodation_id !== id));
    if (selectedId === id) handleBackToList();
  }

  async function handleDeleteUnit(unitId: string) {
    if (!confirm("Are you sure you want to remove this unit?")) return;

    const res = await fetch(`/api/admin/housing/units?id=${unitId}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok || data.success === false) {
      alert(data.error || "Delete failed");
      return;
    }

    setSelectedProperty((prev) =>
      prev
        ? { ...prev, units: prev.units?.filter((u) => u.unit_id !== unitId) }
        : prev,
    );
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = typeFilter
    ? properties.filter((p) => p.accommodation_type === typeFilter)
    : properties;

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return <p className="p-6">Loading properties...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedId) {
    if (detailLoading) return <p className="p-6">Loading detail...</p>;
    if (!selectedProperty) return <p className="p-6">Property not found.</p>;

    const isDorm = selectedProperty.accommodation_type === "dormitory";

    return (
      <div className="p-6 space-y-6">
        <button
          onClick={handleBackToList}
          className="text-blue-600 hover:underline"
        >
          ← Back to Properties
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedProperty.name}</h1>
            <p className="text-gray-500">{selectedProperty.location}</p>
            <span
              className={`text-xs px-2 py-1 rounded mt-1 inline-block font-medium ${
                isDorm
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isDorm ? "Dormitory" : "Rental Space"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openEditModal(selectedProperty)}
              className="px-3 py-1 border rounded hover:bg-gray-100 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() =>
                handleDeleteProperty(
                  selectedProperty.accommodation_id,
                  selectedProperty.accommodation_type,
                )
              }
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Assigned Manager */}
        {selectedProperty.dormitory_manager && (
          <div className="rounded border p-4">
            <h2 className="font-semibold mb-2">Assigned Manager</h2>
            <p className="font-medium">
              {selectedProperty.dormitory_manager.users.first_name}{" "}
              {selectedProperty.dormitory_manager.users.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {selectedProperty.dormitory_manager.users.email}
            </p>
          </div>
        )}

        {/* Dorm Policies — dorms only */}
        {isDorm && selectedProperty.dormitory && (
          <div className="rounded border p-4">
            <h2 className="font-semibold mb-3">Dorm Policies</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail
                label="Semesters Allowed"
                value={String(
                  selectedProperty.dormitory.number_of_semestersAllowed,
                )}
              />
              <Detail
                label="Curfew Time"
                value={selectedProperty.dormitory.curfew_time || "—"}
              />
              <Detail
                label="Term Type"
                value={selectedProperty.dormitory.term_type}
              />
              <Detail
                label="Separate by Gender"
                value={
                  selectedProperty.dormitory.separate_by_gender ? "Yes" : "No"
                }
              />
              <Detail
                label="Allowed Programs"
                value={selectedProperty.dormitory.allowed_programs || "—"}
              />
            </div>
          </div>
        )}

        {/* Stay Configuration — rental spaces only */}
        {!isDorm && selectedProperty.renting_space && (
          <div className="rounded border p-4">
            <h2 className="font-semibold mb-3">Stay Configuration</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail
                label="Property Type"
                value={selectedProperty.renting_space.property_type}
              />
              <Detail
                label="Short-Term Stay"
                value={
                  selectedProperty.renting_space.allow_shortterm_stay
                    ? "Allowed"
                    : "Not Allowed"
                }
              />
              <Detail
                label="Long-Term Stay"
                value={
                  selectedProperty.renting_space.allow_longterm_stay
                    ? "Allowed"
                    : "Not Allowed"
                }
              />
              <Detail
                label="Min Stay Days"
                value={String(
                  selectedProperty.renting_space.minimum_stay_days ?? "—",
                )}
              />
              <Detail
                label="Max Stay Days"
                value={String(
                  selectedProperty.renting_space.maximum_stay_days ?? "—",
                )}
              />
              <Detail
                label="Security Deposit"
                value={
                  selectedProperty.renting_space.security_deposit_required
                    ? "Required"
                    : "Not Required"
                }
              />
            </div>
          </div>
        )}

        {/* Units */}
        <div className="rounded border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Units</h2>
            {/* Wire to AddUnit modal here when ready */}
            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              + Add Unit
            </button>
          </div>
          {!selectedProperty.units?.length ? (
            <p className="text-sm text-gray-500">No units yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">Unit No.</th>
                  <th>Type</th>
                  <th>Occupancy</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {selectedProperty.units.map((unit) => (
                  <tr key={unit.unit_id} className="border-b">
                    <td className="py-2">{unit.unit_number}</td>
                    <td>{unit.unit_type}</td>
                    <td>
                      {unit.current_occupancy} / {unit.max_occupancy}
                    </td>
                    <td>₱{unit.rental_fee}</td>
                    <td>{unit.unit_status}</td>
                    <td className="flex gap-2 py-2">
                      <button className="text-blue-600 hover:underline text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.unit_id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modals — detail view */}
        <AddDormModal
          isOpen={dormModalOpen}
          onClose={closeDormModal}
          onSuccess={() => {
            fetchProperties();
            closeDormModal();
          }}
          existingDorm={
            editingProperty?.accommodation_type === "dormitory"
              ? editingProperty
              : null
          }
        />
        <AddRentalSpaceModal
          isOpen={rentalModalOpen}
          onClose={closeRentalModal}
          onSuccess={() => {
            fetchProperties();
            closeRentalModal();
          }}
          existingRental={
            editingProperty?.accommodation_type === "renting_space"
              ? editingProperty
              : null
          }
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
        <h1 className="text-2xl font-bold">Properties</h1>

        <div className="flex gap-2 items-center">
          {/* Type filter buttons */}
          {(["", "dormitory", "renting_space"] as const).map((type) => (
            <button
              key={type}
              onClick={() =>
                router.push(
                  type
                    ? `?type=${type}`
                    : "/dashboard/admin/housing/properties",
                )
              }
              className={`px-3 py-1 text-sm rounded border ${
                (typeFilter ?? "") === type
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-gray-100"
              }`}
            >
              {type === ""
                ? "All"
                : type === "dormitory"
                  ? "Dorms"
                  : "Rental Spaces"}
            </button>
          ))}

          {/* Add Property button + dropdown */}
          <div className="relative">
            <button
              disabled={managerCount === 0}
              title={
                managerCount === 0 ? "Please add a Property Manager first" : ""
              }
              onClick={() => setAddPromptOpen((p) => !p)}
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              + Add Property
            </button>
            {addPromptOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-lg border bg-white text-gray-900 shadow-lg z-10">
                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setDormModalOpen(true);
                    setAddPromptOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 rounded-t-lg"
                >
                  🏢 Add Dorm
                </button>
                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setRentalModalOpen(true);
                    setAddPromptOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 rounded-b-lg"
                >
                  🏠 Add Rental Space
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">
          No properties yet. Click Add Property to get started.
        </p>
      ) : (
        <table className="w-full text-sm border rounded">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-3">Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Capacity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.accommodation_id}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-3 font-medium">{p.name}</td>
                <td>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      p.accommodation_type === "dormitory"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {p.accommodation_type === "dormitory" ? "Dorm" : "Rental"}
                  </span>
                </td>
                <td>{p.location}</td>
                <td>
                  {p.dormitory_manager
                    ? `${p.dormitory_manager.users.first_name} ${p.dormitory_manager.users.last_name}`
                    : "—"}
                </td>
                <td>{p.accommodation_status}</td>
                <td>{p.total_capacity}</td>
                <td className="flex gap-2 p-3">
                  <button
                    onClick={() => handleSelectProperty(p.accommodation_id)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(p)}
                    className="text-gray-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteProperty(
                        p.accommodation_id,
                        p.accommodation_type,
                      )
                    }
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

      {/* Modals — list view */}
      <AddDormModal
        isOpen={dormModalOpen}
        onClose={closeDormModal}
        onSuccess={() => {
          fetchProperties();
          closeDormModal();
        }}
        existingDorm={
          editingProperty?.accommodation_type === "dormitory"
            ? editingProperty
            : null
        }
      />
      <AddRentalSpaceModal
        isOpen={rentalModalOpen}
        onClose={closeRentalModal}
        onSuccess={() => {
          fetchProperties();
          closeRentalModal();
        }}
        existingRental={
          editingProperty?.accommodation_type === "renting_space"
            ? editingProperty
            : null
        }
      />
    </div>
  );
}

// ── Detail helper ──────────────────────────────────────────────────────────
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <PropertiesContent />
    </Suspense>
  );
}
