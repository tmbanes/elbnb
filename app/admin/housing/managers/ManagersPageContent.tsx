"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Manager } from "../../../../types/housing/types";
import AddManagerModal from "@/app/admin/housing/components/modals/AddManagerModal";
import ManagersList from "./ManagersList";
import ManagerDetail from "./ManagerDetail";
import Modal from "@/app/admin/housing/components/modals/Modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Loader2 } from "lucide-react";

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
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [isHidingToast, setIsHidingToast] = useState(false);
  const [deletedManagerName, setDeletedManagerName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function fetchManagers() {
    try {
      const res = await fetch("/api/housing/managers?all=true");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      setManagers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  async function fetchManagerDetail(id: string) {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/housing/managers?all=true&id=${id}`);
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
    setIsDeleting(true);
    const employeeId = managerToDelete.employee_id;
    const deletedName = `${managerToDelete.users.first_name} ${managerToDelete.users.last_name}`;

    const res = await fetch(`/api/housing/managers?id=${employeeId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setIsDeleting(false);

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
    setDeletedManagerName(deletedName);
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F8D5] relative">
      {/* SUCCESS TOAST */}
      {mounted && showDeleteToast && createPortal(
        <div className={`fixed top-0 right-0 p-8 z-[9999] pointer-events-none ${isHidingToast ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="bg-white border-l-4 border-red-500 shadow-2xl rounded-xl p-4 flex items-center gap-4 max-w-md pointer-events-auto">
                <div className="bg-red-100 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <p className="font-bold text-slate-900 text-sm">Manager Removed</p>
                    <p className="text-slate-500 text-xs">Successfully deleted {deletedManagerName}.</p>
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

      {/* LEFT: Managers List */}
      <div
        className={`
          flex-1
          transition-all duration-300
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
          fixed lg:relative top-0 right-0 lg:min-h-screen z-50 lg:z-auto
          bg-[#F6F8D5]
          transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          flex flex-col
          shadow-[-10px_0_30px_rgba(0,0,0,0.05)] lg:shadow-none
          ${selectedId 
            ? "w-full lg:w-[450px] translate-x-0 opacity-100 border-l border-[#e8e2d6]" 
            : "w-full lg:w-0 translate-x-full lg:translate-x-0 opacity-0 border-none pointer-events-none"
          }
        `}
      >
        <div className="w-full lg:w-[450px] h-full flex flex-col">
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
          ) : null}
        </div>
      </div>

      <AddManagerModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={() => {
          fetchManagers();
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
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : "Delete Manager"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
