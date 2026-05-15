"use client";

import React, { useState } from "react";
import { Manager } from "../../../../types/housing/types";
import { getManagerColumns, ManagerColumn } from "@/app/admin/housing/components/columns/managerColumns";
import { cn } from "@/lib/utils";

// ui components
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import Modal from "@/app/admin/housing/components/modals/Modal";

interface ManagersListProps {
  managers: Manager[];
  onBackToHousing: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onEdit: (manager: Manager) => void;
  onDelete: (manager: Manager) => void;
  selectedId?: string | null;
}

export default function ManagersList({
  managers,
  onBackToHousing,
  onAdd,
  onSelect,
  onEdit,
  onDelete,
  selectedId,
}: ManagersListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredManagers = managers.filter((m) => {
    const name = `${m.users.first_name} ${m.users.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || m.users.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tableData: ManagerColumn[] = filteredManagers.map((manager) => ({
    id: manager.employee_id,
    name: `${manager.users.first_name} ${manager.users.last_name}`,
    email: manager.users.email,
    office: manager.office_location || "—",
    original: manager,
  }));

  return (
    <div className={cn(
      "flex flex-col pt-10 pb-6 gap-6 transition-all duration-500 font-[family-name:var(--font-archivo)]",
      selectedId ? "px-6 lg:px-12" : "px-4 md:px-12 lg:px-20 xl:px-36"
    )}>
      <div>
        <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] mr-2">Managers Page</h1>
        <p className="text-sm md:text-md text-[#44291B] pt-3">Manage property managers and their assignments</p>
      </div>

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-[#e8e2d6] shadow-sm mt-4">
        <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 max-w-md bg-white focus-within:ring-2 focus-within:ring-[#264384]/20 transition-all">
          <div className="pl-3 flex items-center justify-center text-[#44291B]/50">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search manager name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none bg-white text-[#44291B] placeholder:text-[#44291B]/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onAdd}
            className="flex items-center gap-2 text-sm font-medium text-white bg-[#264384] hover:opacity-90 px-4 py-2 rounded-xl transition h-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manager</span>
          </Button>
        </div>
      </div>

      {filteredManagers.length > 0 ? (
        <DataTable
          columns={getManagerColumns(
            onSelect,
            onEdit,
            (id) => {
              const m = managers.find(x => x.employee_id === id);
              if (m) onDelete(m);
            }
          )}
          data={tableData}
          activeRowId={selectedId || undefined}
          onRowClick={(row: any) => onSelect(row.id)}
        />
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed mt-4 bg-white/50">
          <p className="text-muted-foreground">No managers found. Click Add Manager to get started.</p>
        </div>
      )}

    </div>
  );
}
