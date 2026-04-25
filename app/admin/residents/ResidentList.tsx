"use client";

import { useState } from "react";
import { Resident } from "./types";

import { Search, Users, Plus, Clock, CheckCircle2, History, UserCheck, UserPlus, Filter, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { getResidentColumns, ResidentColumn } from "./residentColumns";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



interface AccommodationOption {
  accommodation_id: string;
  name: string;
}

interface Props {
  residents: Resident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title: string;
  accommodations?: AccommodationOption[];
}

type FilterStatus = "all" | "awaiting" | "active" | "checked-out";

export default function ResidentList({ residents, selectedId, onSelect, title, accommodations = [] }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [accommodationFilter, setAccommodationFilter] = useState<string>("all");

  // Get unique accommodations from residents if no accommodations prop provided
  const availableAccommodations = accommodations.length > 0
    ? accommodations
    : Array.from(new Set(residents.map(r => r.unit.accommodation.name))).map(name => ({
      accommodation_id: name,
      name
    }));

  const showAccommodationFilter = availableAccommodations.length > 1;

  const filtered = residents.filter(r => {
    const fullName = `${r.users.first_name} ${r.users.last_name}`.toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch = fullName.includes(searchLower) || r.users.email.toLowerCase().includes(searchLower);

    // Filter by accommodation name (matching the value in Select)
    const matchesAccommodation = accommodationFilter === "all" ||
      r.unit.accommodation.name.trim().toLowerCase() === accommodationFilter.trim().toLowerCase();

    // Filter by status
    let matchesStatus = true;
    if (filter === "awaiting") {
      matchesStatus = r.assignment_status === "waiting_payment" || r.assignment_status === "pending";
    } else if (filter === "active") {
      matchesStatus = r.assignment_status === "active";
    } else if (filter === "checked-out") {
      matchesStatus = r.assignment_status === "completed" || r.assignment_status === "terminated" || r.assignment_status === "cancelled";
    }

    return matchesSearch && matchesAccommodation && matchesStatus;
  });

  const tableData: ResidentColumn[] = filtered.map((r) => ({
    id: r.assignment_id,
    name: `${r.users.first_name} ${r.users.last_name}`,
    email: r.users.email,
    unit: r.unit.unit_number,
    status: r.assignment_status,
    accommodation: r.unit.accommodation.name,
    original: r,
  }));

  return (
    <div className="p-4 md:p-6 space-y-4 font-[family-name:var(--font-archivo)]">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-archivo-black)] text-[#44291B] mr-2 tracking-tight">
          {title} Page
        </h1>
        <p className="text-sm md:text-md text-[#44291B] pt-3 font-medium">
          Manage move-ins, move-outs, and resident stays
        </p>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FDFFF4] p-4 rounded-2xl border border-[#e8e2d6] shadow-sm mt-4">
        {/* Search */}
        <div className="flex border border-[#e8e2d6] rounded-xl overflow-hidden flex-1 max-w-md bg-white">
          <div className="pl-3 flex items-center justify-center text-[#44291B]/50">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search resident name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none bg-[#FDFFF4] text-[#44291B] placeholder:text-[#44291B]/50 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Accommodation Filter - Only show if more than 1 accommodation */}
          {showAccommodationFilter && (
            <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#e8e2d6] bg-[#FDFFF4]">
              <Building2 className="w-4 h-4 text-[#44291B]/50" />
              <Select
                value={accommodationFilter}
                onValueChange={(val) => setAccommodationFilter(val)}
              >
                <SelectTrigger className="w-[180px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] h-10">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFFF4] text-[#44291B] border-[#e8e2d6] rounded-xl shadow-md font-[family-name:var(--font-archivo)]">
                  <SelectItem value="all" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer text-sm">All Properties</SelectItem>
                  {availableAccommodations.map((acc) => (
                    <SelectItem
                      key={acc.accommodation_id}
                      value={acc.name}
                      className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer text-sm"
                    >
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm px-3 rounded-xl border border-[#e8e2d6] bg-[#FDFFF4]">
            <Filter className="w-4 h-4 text-[#44291B]/50" />
            <Select
              value={filter}
              onValueChange={(val) => setFilter(val as FilterStatus)}
            >
              <SelectTrigger className="w-[150px] border-none shadow-none bg-transparent focus:ring-0 px-0 text-[#44291B] h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFFF4] text-[#44291B] border-[#e8e2d6] rounded-xl shadow-md font-[family-name:var(--font-archivo)]">
                <SelectItem value="all" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer text-sm">All Status</SelectItem>
                <SelectItem value="awaiting" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer text-sm">Awaiting Move-in</SelectItem>
                <SelectItem value="active" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer text-sm">Active Stays</SelectItem>
                <SelectItem value="checked-out" className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer text-sm">Stay History</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      {/* Table Section */}
      <div className="mt-4">
        {tableData.length > 0 ? (
          <DataTable
            columns={getResidentColumns(onSelect)}
            data={tableData}
            activeRowId={selectedId || undefined}
            onRowClick={(row: any) => onSelect(row.id)}
            className="border-[#e8e2d6]"
          />

        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6 border border-dashed border-[#e8e2d6] rounded-2xl bg-white/50">
            <div className="w-16 h-16 bg-[#F6F8D5] rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#44291B]/20" />
            </div>
            <p className="text-sm font-bold text-[#44291B]">No residents found</p>
            <p className="text-xs text-[#44291B]/40 mt-1 leading-relaxed max-w-[240px]">
              We couldn't find any residents matching your current search and filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
