// app/admin/housing/properties/PropertiesList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { getPropertyColumns } from "@/app/admin/housing/components/columns/propertyColumns";
import { Property } from "../../../../types/housing/types";

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
import { ChevronLeft, Plus, Building2, Home, Users, Bed } from "lucide-react";

interface SummaryStats {
  totalDorms: number;
  totalRentalSpaces: number;
  totalManagers: number;
  totalUnits: number;
}

interface PropertiesListProps {
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

function StatCard({
  label,
  value,
  icon,
  description,
  accentColor,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  accentColor: string;
  iconBg: string;
}) {
  return (
    <Card
      className="shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-md cursor-default border-none"
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
  const [stats, setStats] = useState<SummaryStats>({
    totalDorms: 0,
    totalRentalSpaces: 0,
    totalManagers: 0,
    totalUnits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [dormsRes, rentalRes, managersRes] = await Promise.all([
          fetch("/api/admin/housing/dorms"),
          fetch("/api/admin/housing/rental-spaces"),
          fetch("/api/admin/housing/managers"),
        ]);

        if (dormsRes.ok && rentalRes.ok && managersRes.ok) {
          const [dorms, rentals, managers] = await Promise.all([
            dormsRes.json(),
            rentalRes.json(),
            managersRes.json(),
          ]);

          const totalCapacity = [...dorms, ...rentals].reduce(
            (acc, curr) => acc + (curr.total_capacity || 0),
            0
          );

          setStats({
            totalDorms: dorms.length,
            totalRentalSpaces: rentals.length,
            totalManagers: managers.length,
            totalUnits: totalCapacity,
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-4xl font-bold text-[#44291B] mr-2">Properties Page</h1>
        <p className="text-sm text-[#44291B]">Manage your Properties and view their details</p>

      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
        <StatCard
          label="Dormitories"
          value={stats.totalDorms}
          icon={<Building2 className="text-white w-5 h-5" />}
          description="Active dorm buildings"
          accentColor="#5591AB"
          iconBg="#ebf2f4"
        />
        <StatCard
          label="Rental Spaces"
          value={stats.totalRentalSpaces}
          icon={<Home className="text-white w-5 h-5" />}
          description="Private rental units"
          accentColor="#EB8A0B"
          iconBg="#fbecd7"
        />
        <StatCard
          label="Managers"
          value={stats.totalManagers}
          icon={<Users className="text-white w-5 h-5" />}
          description="Assigned staff"
          accentColor="#F2C908"
          iconBg="#f2c70823"
        />
        <StatCard
          label="Total Capacity"
          value={stats.totalUnits}
          icon={<Bed className="text-white w-5 h-5" />}
          description="Total beds available"
          accentColor="#264384"
          iconBg="#e6e8ef"
        />
      </div>

      {(filtered?.length === 0) && !loading ? (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed mt-4">
          <p className="text-muted-foreground">No properties yet. Click Add Property to get started.</p>
        </div>
      ) : (
        <DataTable
          columns={getPropertyColumns(onEditProperty, onDeleteProperty)}
          data={tableData}
          header={
            <div>
              <h1 className="text-2xl font-bold text-[#44291B]">Properties</h1>
              <p className="text-sm text-[#44291B]">Manage your Dormitory or Rental Space Properties</p>
            </div>
          }
          toolbar={
            <div className="flex items-center gap-4">
              <ToggleGroup
                className="text-[#44291B]"
                type="single"
                variant="outline"
                value={typeFilter ?? ""}
                onValueChange={(value) => {
                  if (value !== undefined) onFilterChange(value);
                }}
              >
                <ToggleGroupItem value=" " aria-label="All">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem value="dormitory" aria-label="Dormitories">
                  Dorms
                </ToggleGroupItem>
                <ToggleGroupItem value="renting_space" aria-label="Rental Spaces">
                  Rental Spaces
                </ToggleGroupItem>
              </ToggleGroup>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={managerCount === 0}
                    title={managerCount === 0 ? "Please add a Property Manager first" : ""}
                    className="bg-[#264384] hover:bg-[#5273BC] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="mr-4">Add Property</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#FDFFF4] text-[#44291B]">
                  <DropdownMenuItem onClick={() => onAddProperty("dormitory")}>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Add Dorm</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddProperty("renting_space")}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Add Rental Space</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
      )}
    </div>
  );
}