"use client";

import { Manager } from "../../../../types/housing/types";
import { getManagerColumns, ManagerColumn } from "@/app/admin/housing/components/columns/managerColumns";

// ui components
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus } from "lucide-react";

interface ManagersListProps {
  managers: Manager[];
  onBackToHousing: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onEdit: (manager: Manager) => void;
  onDelete: (id: string) => void;
}

export default function ManagersList({
  managers,
  onBackToHousing,
  onAdd,
  onSelect,
  onEdit,
  onDelete,
}: ManagersListProps) {
  const tableData: ManagerColumn[] = managers.map((manager) => ({
    id: manager.employee_id,
    name: `${manager.users.first_name} ${manager.users.last_name}`,
    email: manager.users.email,
    office: manager.office_location || "—",
    original: manager,
  }))

  return (
    <div className="p-6 space-y-4">

      {managers.length > 0 ? (
        <DataTable
          columns={getManagerColumns(onSelect, onEdit, onDelete)}
          data={tableData}
          header={
            <div>
              <h1 className="text-2xl font-bold text-[#44291B]">Managers</h1>
              <p className="text-sm text-[#44291B]">Manage property managers and assignments</p>
            </div>
          }
          toolbar={
            <div className="flex items-center gap-4 mr-7">
              <Button
                className="bg-[#264384] hover:bg-[#5273BC] text-white"
                onClick={onAdd}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="mr-4">Add Manager</span>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          No managers yet. Add one to get started.
        </div>
      )}
    </div>
  );
}
