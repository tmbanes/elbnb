//admin/housing/properties/PropertyContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddDormModal from "@/app/dashboard/admin/housing/components/modals/AddDormModal";
import AddRentalSpaceModal from "@/app/dashboard/admin/housing/components/modals/AddRentalSpaceModal";
// import AddUnitModal from "@/app/dashboard/admin/housing/components/modals/AddUnitModal";
import { Property } from "../../../../../types/housing/types";
import PropertiesList from "./PropertiesList";
import PropertyDetail from "./PropertyDetail";

export default function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id");
  const typeFilter = searchParams.get("type");

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerCount, setManagerCount] = useState(0);
  const [addPromptOpen, setAddPromptOpen] = useState(false);
  const [dormModalOpen, setDormModalOpen] = useState(false);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
//   const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  async function fetchProperties() {
    try {
      const [dormsRes, rentalsRes, managersRes] = await Promise.all([
        fetch("/api/housing/dorms"),
        fetch("/api/housing/rental-spaces"),
        fetch("/api/housing/managers"),
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
            ? `/api/housing/rental-spaces?id=${selectedId}`
            : `/api/housing/dorms?id=${selectedId}`;

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

  function handleSelectProperty(id: string) {
    router.push(`/dashboard/admin/housing/properties?id=${id}`);
  }

  function handleBackToList() {
    router.push("/dashboard/admin/housing/properties");
  }

  function handleBackToHousing() {
    router.push("/dashboard/admin/housing");
  }

  function openEditModal(property: Property) {
    setEditingProperty(property);
    if (property.accommodation_type === "dormitory") {
      setDormModalOpen(true);
    } else {
      setRentalModalOpen(true);
    }
  }

  function closeDormModal() {
    setDormModalOpen(false);
    setEditingProperty(null);
  }

  function closeRentalModal() {
    setRentalModalOpen(false);
    setEditingProperty(null);
  }

//   function openAddUnitModal() {
//     setUnitModalOpen(true);
//   }

//   function closeUnitModal() {
//     setUnitModalOpen(false);
//   }

//   function handleUnitAdded(unit: any) {
//     setSelectedProperty((prev) =>
//       prev ? { ...prev, units: [...(prev.units ?? []), unit] } : prev,
//     );
//     fetchProperties();
//   }

  async function handleDeleteProperty(id: string, type: string) {
    if (!confirm("Are you sure you want to delete this property?")) return;

    const endpoint =
      type === "renting_space"
        ? `/api/housing/rental-spaces?id=${id}`
        : `/api/housing/dorms?id=${id}`;

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
    const res = await fetch(`/api/housing/units?id=${unitId}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok || data.success === false) {
      alert(data.error || "Delete failed");
      return;
    }

    setSelectedProperty((prev) =>
      prev ? { ...prev, units: prev.units?.filter((u) => u.unit_id !== unitId) } : prev,
    );
  }

  function handleFilterChange(type: string) {
    if (type) {
      router.push(`?type=${type}`);
    } else {
      router.push("/dashboard/admin/housing/properties");
    }
  }

  function handleAddProperty(type: "dormitory" | "renting_space") {
    setEditingProperty(null);
    if (type === "dormitory") {
      setDormModalOpen(true);
    } else {
      setRentalModalOpen(true);
    }
    setAddPromptOpen(false);
  }

  const filtered = typeFilter
    ? properties.filter((p) => p.accommodation_type === typeFilter)
    : properties;

  const tableData = filtered.map((p) => ({
    id: p.accommodation_id,
    name: p.name,
    type: p.accommodation_type === "dormitory" ? "Dorm" : "Rental",
    location: p.location,
    manager: p.dormitory_manager
      ? `${p.dormitory_manager.users.first_name} ${p.dormitory_manager.users.last_name}`
      : "—",
    status: p.accommodation_status,
    capacity: p.total_capacity,
    original: p,
  }));

  if (loading) return <p className="p-6">Loading properties...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return selectedId ? (
    <>
      {detailLoading || !selectedProperty ? (
        <p className="p-6">Loading detail...</p>
      ) : (
        <PropertyDetail
          property={selectedProperty}
          onBack={handleBackToList}
          onDeleteUnit={handleDeleteUnit}
        //   onAddUnit={openAddUnitModal}
        />
      )}

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
    </>
  ) : (
    <>
      <PropertiesList
        properties={properties}
        filtered={filtered}
        tableData={tableData}
        typeFilter={typeFilter}
        managerCount={managerCount}
        addPromptOpen={addPromptOpen}
        onFilterChange={handleFilterChange}
        onToggleAddPrompt={() => setAddPromptOpen((prev) => !prev)}
        onAddProperty={handleAddProperty}
        onSelectProperty={handleSelectProperty}
        onEditProperty={openEditModal}
        onDeleteProperty={handleDeleteProperty}
        onBackToHousing={handleBackToHousing}
      />

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
      {/* <AddUnitModal
        isOpen={unitModalOpen}
        onClose={closeUnitModal}
        accommodationId={selectedId ?? ""}
        onSuccess={handleUnitAdded}
      /> */}
    </>
  );
}


