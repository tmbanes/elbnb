"use client";

import { useEffect, useState } from "react";
import { Manager } from "../../../../types/housing/types";
import AddManagerModal from "@/app/admin/housing/components/modals/AddManagerModal";
import ManagersList from "./ManagersList";
import ManagerDetail from "./ManagerDetail";
import Modal from "@/app/admin/housing/components/modals/Modal";
import { Button } from "@/components/ui/button";

export default function ManagersContent({ initialManagers, initialError }: { initialManagers: Manager[], initialError: string | null }) {
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<Manager | null>(null);

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

  function requestDelete(manager: Manager) {
    setManagerToDelete(manager);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!managerToDelete) return;
    const employeeId = managerToDelete.employee_id;

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
    setDeleteModalOpen(false);
    setManagerToDelete(null);
  }

  function handleBackToHousing() {
    handleCloseDetail();
  }

  // Centered Full Page Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#264384] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#44291B] font-medium">Loading managers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5]">
        <p className="p-6 text-red-500 bg-red-50 border border-red-200 rounded-lg">
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-[#F6F8D5]">
      {/* LEFT: Managers List */}
      <div
        className={`
          flex-1
          transition-all duration-300
          overflow-y-auto
          ${selectedId ? "hidden lg:block" : "block"}
        `}
      >
        <ManagersList
          managers={managers}
          onBackToHousing={handleBackToHousing}
          onAdd={openAddModal}
          onSelect={handleSelect}
          onEdit={openEditModal}
          onDelete={requestDelete}
          selectedId={selectedId}
        />
      </div>

      {/* RIGHT: Detail Panel */}
      <div
        className={`
          w-full lg:w-[450px]
          lg:border-l border-[#e8e2d6]
          bg-[#F6F8D5]
          transition-all duration-300
          overflow-y-auto
          flex flex-col
          ${selectedId ? "block" : "hidden lg:flex"}
        `}
      >
        {selectedId && selectedManager && !detailLoading ? (
          <ManagerDetail
            manager={selectedManager}
            onEdit={openEditModal}
            onDelete={requestDelete}
            onBack={handleCloseDetail}
          />
        ) : selectedId && detailLoading ? (

          <div className="flex flex-1 items-center justify-center p-20">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#264384] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#44291B] text-sm">Loading details...</p>
            </div>
          </div>
        ) : (


          <div className="hidden lg:flex flex-1 items-center justify-center p-10 text-center">
            <div className="max-w-[200px] space-y-2">
              <p className="text-[#44291B] font-bold text-lg">No Manager Selected</p>
              <p className="text-[#44291B] text-sm">
                Select a manager from the list to view their full profile and office details.
              </p>
            </div>
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

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Manager"
        description={`Are you sure you want to remove ${managerToDelete?.users.first_name} ${managerToDelete?.users.last_name}? This action will unassign them from any properties they manage.`}
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete Manager
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
