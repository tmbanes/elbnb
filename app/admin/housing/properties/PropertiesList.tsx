// app/admin/housing/properties/PropertiesList.tsx
"use client";

import React, { useMemo, useState } from "react";
import { getPropertyColumns } from "@/app/admin/housing/components/columns/propertyColumns";
import { Property } from "../../../../types/housing/types";

// ui components
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import Modal from "@/app/admin/housing/components/modals/Modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardTitle,
  CardHeader
} from "@/components/ui/card";
import { ChevronLeft, Plus, Building2, Home, Users, Bed, Search, Filter } from "lucide-react";

interface SummaryStats {
  totalDorms: number;
  totalRentalSpaces: number;
  totalManagers: number;
  totalUnits: number;
}

interface PropertiesListProps {
  properties: Property[];
  filtered: Property[];
  tableData: Array<{
    id: string;
    name: string;
    type: string;
    location: string;
    manager: string;
    status: string;
    capacity: number;
    original: Property;
  }>;
  typeFilter: string | null;
  managerCount: number;
  addPromptOpen: boolean;
  onFilterChange: (type: string) => void;
  onToggleAddPrompt: () => void;
  onAddProperty: (type: "dormitory" | "renting_space") => void;
  onSelectProperty: (id: string) => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (id: string, type: string) => void;
  onBackToHousing: () => void;
}

//Stat Card Function
function StatCard({
  label,
  value,
  icon,
  accentColor,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
}) {
  return (
    //Stat Card UI
    <Card
      className="shadow-sm transition-all border-none"
      style={{ backgroundColor: accentColor }}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-3.5">
          <div className="flex flex-col gap-0.5 pl-2">
            <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest">
              {label}
            </p>
            <CardTitle className="text-3xl font-bold text-white leading-tight">
              {value.toLocaleString()}
            </CardTitle>
          </div>

          {/* Icon UI Styling */}
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-white/20"
          >
            {icon}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function PropertiesList({
  properties = [],
  filtered = [],
  tableData = [],
  typeFilter,
  managerCount,
  onFilterChange,
  onAddProperty,
  onSelectProperty,
  onEditProperty,
  onDeleteProperty,
  onBackToHousing,
}: PropertiesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const stats: SummaryStats = useMemo(() => {
    const totalCapacity = properties.reduce(
      (acc, curr) => acc + Number(curr.total_capacity || 0),
      0
    );

    return {
      totalDorms: properties.filter((p) => p.accommodation_type === "dormitory")
        .length,
      totalRentalSpaces: properties.filter(
        (p) => p.accommodation_type === "renting_space"
      ).length,
      totalManagers: managerCount,
      totalUnits: totalCapacity,
    };
  }, [managerCount, properties]);

  return (
    <div className="p-6 space-y-4 font-[family-name:var(--font-archivo)]">
      <div>
        <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] mr-2">Properties Page</h1>
        <p className="text-sm md:text-md text-[#44291B] pt-3">Manage your Properties and view their details</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
        <StatCard
          label="Dormitories"
          value={stats.totalDorms}
          icon={<Building2 className="text-white w-5 h-5" />}
          accentColor="#5591AB"
          iconBg="#ebf2f4"
        />
        <StatCard
          label="Rental Spaces"
          value={stats.totalRentalSpaces}
          icon={<Home className="text-white w-5 h-5" />}
          accentColor="#EB8A0B"
          iconBg="#fbecd7"
        />
        <StatCard
          label="Managers"
          value={stats.totalManagers}
          icon={<Users className="text-white w-5 h-5" />}
          accentColor="#F2C908"
          iconBg="#f2c70823"
        />
        <StatCard
          label="Total Capacity"
          value={stats.totalUnits}
          icon={<Bed className="text-white w-5 h-5" />}
          accentColor="#264384"
          iconBg="#e6e8ef"
        />
      </div>

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FDFFF4] p-4 rounded-2xl border border-[#e8e2d6] shadow-sm mt-4">
        <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 w-full md:max-w-md">
          <div className="pl-3 flex items-center justify-center text-[#44291B]/50">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search property name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-transparent text-sm outline-none text-[#44291B] placeholder:text-[#44291B]/50"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#e8e2d6] w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#44291B]/50" />
            <Select
              value={typeFilter || "all"}
              onValueChange={(val) => onFilterChange(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full sm:w-[140px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] font-medium h-9">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFFF4] text-[#44291B] border-[#e8e2d6] rounded-xl shadow-md">
                <SelectItem value="all" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Properties</SelectItem>
                <SelectItem value="dormitory" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Dorms</SelectItem>
                <SelectItem value="renting_space" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">Rental Spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:block h-6 w-px bg-[#e8e2d6] mx-2"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={managerCount === 0}
                title={managerCount === 0 ? "Please add a Property Manager first" : ""}
                className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-[#264384] hover:opacity-90 px-4 py-2 rounded-xl transition h-auto w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#FDFFF4] text-[#44291B] border-[#e8e2d6] rounded-xl shadow-md"
            >
              <DropdownMenuItem
                onClick={() => onAddProperty("dormitory")}
                className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer"
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>Add Dorm</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddProperty("renting_space")}
                className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer"
              >
                <Home className="mr-2 h-4 w-4" />
                <span>Add Rental Space</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filtered?.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed mt-4">
          <p className="text-muted-foreground">No properties yet. Click Add Property to get started.</p>
        </div>
      ) : (
        <DataTable
          columns={getPropertyColumns(onEditProperty, (id, type) => {
            const prop = filtered.find(p => p.accommodation_id === id);
            if (prop) {
              setActiveProperty(prop);
              setDeleteModalOpen(true);
            }
          })}
          data={tableData.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))}
          onRowClick={(row: any) => onSelectProperty(row.id)}
        />
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Property"
        description={`Are you sure you want to delete ${activeProperty?.name}? This action cannot be undone and will delete all associated units.`}
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (activeProperty) {
                  onDeleteProperty(activeProperty.accommodation_id, activeProperty.accommodation_type);
                  setDeleteModalOpen(false);
                  setActiveProperty(null);
                }
              }}
            >
              Delete Property
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
