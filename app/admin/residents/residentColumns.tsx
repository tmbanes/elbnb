"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Resident } from "./types"
import { MapPin, User, Mail, Building } from "lucide-react"
import { cn } from "@/lib/utils"

export type ResidentColumn = {

  id: string
  name: string
  email: string
  unit: string
  status: string
  accommodation: string
  original: Resident
}

export const getResidentColumns = (
  handleSelect: (id: string) => void,
): ColumnDef<ResidentColumn>[] => [
    {
      accessorKey: "name",
      header: "RESIDENT",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-bold text-[#44291B] truncate">
            {row.getValue("name")}
          </p>
          <div className="flex items-center pt-1 gap-1 text-[#44291B]/60">
            <Mail className="h-3 w-3 shrink-0" />
            <p className="text-xs truncate">
              {row.original.email}
            </p>
          </div>
        </div>
      )
    },
    {
      accessorKey: "accommodation",
      header: "ACCOMMODATION",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-bold text-[#44291B] truncate">
            {row.getValue("accommodation")}
          </p>
          <div className="flex items-center pt-1 gap-1 text-[#44291B]/60">
            <MapPin className="h-3 w-3 shrink-0" />
            <p className="text-xs truncate">
              Unit {row.original.unit}
            </p>
          </div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        const statusMapping: Record<string, { label: string; style: string }> = {
          active: { label: "Active", style: "bg-[#E7FAD3] text-[#78A24C]" },
          completed: { label: "Completed", style: "bg-[#E0F2FE] text-[#0369A1]" },
          cancelled: { label: "Cancelled", style: "bg-[#F3F4F6] text-[#6B7280]" },
          terminated: { label: "Terminated", style: "bg-[#FEF2F2] text-[#B91C1C]" },
          waiting_payment: { label: "Waiting Payment", style: "bg-[#FFF7ED] text-[#EA580C]" },
          pending: { label: "Pending Approval", style: "bg-[#EEF2FF] text-[#4F46E5]" },
        };

        const { label, style } = statusMapping[status] || { label: status, style: "bg-gray-100 text-gray-600" };

        return (
          <div className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            style
          )}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {label}
          </div>
        )
      }
    },
  ]
