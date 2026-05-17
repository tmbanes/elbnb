"use client";

import React, { useState } from "react";
import { Manager } from "../../../../types/housing/types";
import { getManagerColumns, ManagerColumn } from "@/app/admin/housing/components/columns/managerColumns";
import { cn } from "@/lib/utils";

// ui components
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import Modal from "@/app/admin/housing/components/modals/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManagersListProps {
  managers: Manager[];
  managerFilter: "all" | "assigned";
  tableLoading: boolean;
  onFilterChange: (filter: "all" | "assigned") => void;
  onBackToHousing: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onEdit: (manager: Manager) => void;
  onDelete: (manager: Manager) => void;
  selectedId?: string | null;
}

export default function ManagersList({
  managers,
  managerFilter,
  tableLoading,
  onFilterChange,
  onBackToHousing,
  onAdd,
  onSelect,
  onEdit,
  onDelete,
  selectedId,
}: ManagersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredManagers = managers.filter((m) => {
    const name = `${m.users.first_name} ${m.users.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || m.users.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tableData: ManagerColumn[] = filteredManagers.map((manager) => ({
    id: manager.employee_id,
    name: `${manager.users.first_name} ${manager.users.last_name}`,
    email: manager.users.email,
    office: manager.office_location || "—",
    accommodations: manager.accommodation?.map(a => a.name).join(", ") || "None",
    original: manager,
  }));

  return (
    <div className={cn(
      "flex flex-col pt-10 pb-6 gap-6 transition-all duration-500 font-[family-name:var(--font-archivo)]",
      selectedId ? "px-6 lg:px-12" : "px-4 md:px-12 lg:px-20 xl:px-36"
    )}>
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/dashboard")}
        className="flex items-center gap-2 text-[#44291B]/60 hover:text-[#44291B] hover:bg-[#F6F8D5] -ml-2 mb-2 transition-all group w-fit"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
      </Button>
      <div>
        <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] mr-2">Managers Page</h1>
        <p className="text-sm md:text-md text-[#44291B] pt-3">Explore and manage property managers and their assignments</p>
      </div>

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FDFFF4] p-4 rounded-2xl border border-[#e8e2d6] shadow-sm mt-4">
        <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 w-full md:max-w-md bg-transparent focus-within:ring-2 focus-within:ring-[#264384]/20 transition-all">
          <div className="pl-3 flex items-center justify-center text-[#44291B]/50">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search manager name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-transparent text-sm outline-none text-[#44291B] placeholder:text-[#44291B]/50"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#e8e2d6] w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#44291B]/50" />
            <Select
              value={managerFilter}
              onValueChange={(val: any) => onFilterChange(val)}
            >
              <SelectTrigger className="w-full sm:w-[170px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-medium h-9">
                <SelectValue placeholder="All Managers" />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFFF4] text-[#44291B] border-[#e8e2d6] rounded-xl shadow-md">
                <SelectItem value="all" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Managers</SelectItem>
                <SelectItem value="assigned" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Assigned to Me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:block h-6 w-px bg-[#e8e2d6] mx-2"></div>

          <Button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-[#264384] hover:opacity-90 px-4 py-2 rounded-xl transition h-auto w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manager</span>
          </Button>
        </div>
      </div>

      {tableLoading ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-[#e8e2d6] bg-[#FDFFF4] shadow-sm mt-4 gap-3">
          <Loader2 className="w-8 h-8 text-[#264384] animate-spin" />
          <p className="text-sm font-medium text-[#44291B]/70">Updating managers list...</p>
        </div>
      ) : filteredManagers.length > 0 ? (
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
          fixedLayout
        />
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed mt-4 bg-white/50">
          <p className="text-muted-foreground">No managers found. Click Add Manager to get started.</p>
        </div>
      )}

    </div>
  );
}
