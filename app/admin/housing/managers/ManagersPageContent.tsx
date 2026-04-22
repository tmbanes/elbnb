"use client";

import { useEffect, useState } from "react";
import { Manager } from "../../../../types/housing/types";
import AddManagerModal from "@/app/admin/housing/components/modals/AddManagerModal";
import ManagersList from "./ManagersList";
import ManagerDetail from "./ManagerDetail";

export default function ManagersContent() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  async function fetchManagerDetail(id: string) {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/admin/housing/managers?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedManager(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    fetchManagerDetail(id);
  }

  function handleCloseDetail() {
    setSelectedId(null);
    setSelectedManager(null);
  }

  function openAddModal() {
    setEditingManager(null);
    setModalOpen(true);
  }

  function openEditModal(manager: Manager) {
    setEditingManager({
      employee_id: manager.employee_id,
      user_id: manager.users.user_id,
      first_name: manager.users.first_name,
      last_name: manager.users.last_name,
      email: manager.users.email,
      office_location: manager.office_location,
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

    setManagers((prev) =>
      prev.filter((manager) => manager.employee_id !== employeeId)
    );

    if (selectedId === employeeId) handleCloseDetail();
  }

  function handleBackToHousing() {
    handleCloseDetail();
  }

  if (loading) return <p className="p-6">Loading managers...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen flex overflow-hidden">

      
      {/* LEFT: Managers List */}
      <div
        className={`
          w-[65%]
          transition-all duration-300
          overflow-y-auto
          pt-2
        `}
      >

        <div className="pt-6 pl-7">
          <h1 className="text-4xl font-bold text-[#44291B]">Managers Page</h1>
          <p className="text-sm text-[#44291B] mt-1">View and manage your property managers</p>
        </div>
        
        <ManagersList
          managers={managers}
          onBackToHousing={handleBackToHousing}
          onAdd={openAddModal}
          onSelect={handleSelect}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>

      {/* RIGHT: Detail Panel */}
      <div
        className="
          w-1/2 min-w-[400px]
          border-l border-[#e8e2d6]
          bg-[#F6F8D5]
          transition-all duration-300
          overflow-y-auto
        "
      >
        {selectedId && selectedManager && !detailLoading ? (
          <ManagerDetail
            manager={selectedManager}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        ) : selectedId && detailLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#44291B]">Loading...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#44291B]">Select a manager to view details</p>
          </div>
        )}
      </div>

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