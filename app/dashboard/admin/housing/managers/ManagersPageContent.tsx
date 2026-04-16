"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Manager } from "../../../../../types/housing/types";
import AddManagerModal from "@/app/dashboard/admin/housing/components/modals/AddManagerModal";
import ManagersList from "./ManagersList";
import ManagerDetail from "./ManagerDetail";

// ui components
import { DataTable } from "@/components/ui/data-table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardTitle,
  CardHeader
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";


export default function ManagersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id");

  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any | null>(null);

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

  useEffect(() => {
    if (!selectedId) {
      setSelectedManager(null);
      return;
    }

    fetchManager();
  }, [selectedId]);

  function handleSelect(id: string) {
    router.push(`/dashboard/admin/housing/managers?id=${id}`);
  }

  function handleBack() {
    router.push("/dashboard/admin/housing/managers");
  }

  function handleBackToHousing() {
    router.push("/dashboard/admin/housing");
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

    setManagers((prev) => prev.filter((manager) => manager.employee_id !== employeeId));
    if (selectedId === employeeId) handleBack();
  }

  if (loading) return <p className="p-6">Loading managers...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <>
      {selectedId ? (
        selectedManager ? (
          <ManagerDetail
            manager={selectedManager}
            onBack={handleBack}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        ) : (
          <div className="p-6 space-y-4">
            <Button
              variant="link"
              onClick={handleBack}
              className="pl-0 text-[#264384]"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Managers
            </Button>
          </div>
        )
      ) : (
        <ManagersList
          managers={managers}
          onBackToHousing={handleBackToHousing}
          onAdd={openAddModal}
          onSelect={handleSelect}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      <AddManagerModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={() => {
          fetchManagers();
          if (selectedId) fetchManager();
          closeModal();
        }}
        existingManager={editingManager}
      />
    </>
  );
}
