//admin/housing/properties/PropertyContent.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import AddDormModal from "@/app/admin/housing/components/modals/AddDormModal";
import AddRentalSpaceModal from "@/app/admin/housing/components/modals/AddRentalSpaceModal";
import { Property } from "../../../../types/housing/types";
import PropertiesList from "./PropertiesList";
import PropertyDetail from "./PropertyDetails";
import { CheckCircle2, X } from "lucide-react";

export default function PropertiesContent({ initialData }: { initialData: { properties: Property[], managerCount: number } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id");
  const typeFilter = searchParams.get("type");

  const [properties, setProperties] = useState<Property[]>(initialData.properties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerCount, setManagerCount] = useState(initialData.managerCount);
  const [addPromptOpen, setAddPromptOpen] = useState(false);
  const [dormModalOpen, setDormModalOpen] = useState(false);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [isHidingToast, setIsHidingToast] = useState(false);
  const [deletedPropertyName, setDeletedPropertyName] = useState("");
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  

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
    router.push(`/admin/housing?id=${id}`);
  }

  function handleBackToList() {
    const from = searchParams.get("from");
    if (from === "managers") {
      router.push("/admin/housing/managers");
    } else {
      router.push("/admin/housing");
    }
  }

  function handleBackToHousing() {
    router.push("/admin/housing");
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

  async function handleDeleteProperty(id: string, type: string) {
    const deletedProp = properties.find((p) => p.accommodation_id === id);
    const deletedName = deletedProp?.name || "Accommodation";
    
    setIsDeletingProperty(true);
    const endpoint =
      type === "renting_space"
        ? `/api/housing/rental-spaces?id=${id}`
        : `/api/housing/dorms?id=${id}`;

    const res = await fetch(endpoint, { method: "DELETE" });
    const data = await res.json();
    setIsDeletingProperty(false);

    if (!res.ok || data.success === false) {
      alert(data.error || "Delete failed");
      return;
    }

    setProperties((prev) => prev.filter((p) => p.accommodation_id !== id));
    if (selectedId === id) handleBackToList();
    
    setDeletedPropertyName(deletedName);
    setShowDeleteToast(true);
    setIsHidingToast(false);
    
    setTimeout(() => {
      setIsHidingToast(true);
      setTimeout(() => {
        setShowDeleteToast(false);
        setIsHidingToast(false);
      }, 300);
    }, 5000);
  }

  async function handleDeleteUnit(unitId: string) {
    setIsDeletingUnit(true);
    const res = await fetch(`/api/housing/units?id=${unitId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setIsDeletingUnit(false);

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
      router.push("/admin/housing");
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
    manager: p.dormitory_manager?.users 
      ? `${p.dormitory_manager.users.first_name} ${p.dormitory_manager.users.last_name}`
      : "—",
    status: p.accommodation_status,
    capacity: p.total_capacity,
    original: p,
  }));

  if (loading) return <p className="p-6">Loading properties...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <>
      {mounted && showDeleteToast && createPortal(
        <div className={`fixed top-0 right-0 p-8 z-[9999] pointer-events-none ${isHidingToast ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="bg-white border-l-4 border-red-500 shadow-2xl rounded-xl p-4 flex items-center gap-4 max-w-md pointer-events-auto">
                <div className="bg-red-100 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <p className="font-bold text-slate-900 text-sm">Property Removed</p>
                    <p className="text-slate-500 text-xs">Successfully deleted {deletedPropertyName}.</p>
                </div>
                <button onClick={() => {
                  setIsHidingToast(true);
                  setTimeout(() => {
                    setShowDeleteToast(false);
                    setIsHidingToast(false);
                  }, 300);
                }} className="text-slate-400 hover:text-slate-600 ml-2 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>,
        document.body
      )}

      {selectedId ? (
        detailLoading || !selectedProperty ? (
          <p className="p-6">Loading detail...</p>
        ) : (
          <PropertyDetail
            property={selectedProperty}
            onBack={handleBackToList}
            onDeleteUnit={handleDeleteUnit}
            onAddUnit={fetchProperties}
            isDeletingUnit={isDeletingUnit}
          />
        )
      ) : (
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
          isDeletingProperty={isDeletingProperty}
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
  );
}


