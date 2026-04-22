// components/housing/columns/unitColumns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

export const getUnitColumns = (
  handleViewUnit: (unit: any) => void,
  handleEditUnit: (unit: any) => void,
  handleDeleteUnit: (id: string) => void
): ColumnDef<any>[] => [
  { 
    //UNIT NUMBER
    accessorKey: "unit_number",
    header: "Unit No.",
    cell: ({ row }) => <span className="font-bold text-[#44291B]">{row.getValue("unit_number")}</span>
  },
  { 
    //UNIT TYPE
    accessorKey: "unit_type",
    header: "Type",
    cell: ({ row }) => {
      const type = (row.getValue("unit_type") as string)?.toLowerCase();

      const typeStyles: Record<string, string> = {
        room: "bg-[#E6F1FB] text-[#185FA5]",
        bedspace: "bg-[#EEEDFE] text-[#534AB7]",
        wholeunit: "bg-[#FDF9E7] text-[#BA7517]",
      };

      const style = typeStyles[type] || "bg-gray-100 text-gray-600";
      
      const labelMap: Record<string, string> = {
        room: "Room",
        bedspace: "Bedspace",
        wholeunit: "Whole Unit",
      };

      return (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
          {labelMap[type] || type}
        </span>
      );
    }
  },
  { 
    //OCCUPANCY
    accessorKey: "current_occupancy",
    header: "Occupancy",
    cell: ({ row }) => {
      const current = row.original.current_occupancy ?? 0;
      const max = row.original.max_occupancy ?? 1;
      const percentage = Math.min(100, (current / max) * 100);

      return (
        <div className="flex flex-col gap-1.5 min-w-[100px] py-1 pr-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-[#44291B]">
              {current}/{max}
            </span>
            <span className={`text-[10px] font-medium ${percentage >= 100 ? "text-red-600" : "text-[#8c8b82]"}`}>
              {Math.round(percentage)}%
            </span>
          </div>
          <Progress 
            value={Math.round(percentage)} 
            className={`h-1.5 bg-[#F6F8D5] ${
              percentage >= 100 
                ? "[&>div]:bg-[#DF3538]" 
                : "[&>div]:bg-[#5591AB]"
            }`} 
          />
        </div>
      );
    },
  },
  { 
    //RENTAL FEE
    accessorKey: "rental_fee",
    header: "Fee",
    cell: ({ row }) => (
      <span className="font-semibold text-[#44291B]">
        ₱{Number(row.getValue("rental_fee")).toLocaleString()}
      </span>
    ),
  },
  {
    //UNIT STATUS
    //TODO - update styling
    accessorKey: "unit_status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("unit_status") as string)?.toLowerCase();

      const statusStyles: Record<string, string> = {
        available: "bg-[#5591AB] text-[#78A24C]",
        occupied: "bg-[#ebf2f4] text-[#5591AB]",
        reserved: "bg-[#FDF9E7] text-[#BA7517]",
        under_maintenance: "bg-amber-100 text-amber-700",
        inactive: "bg-gray-100 text-gray-500",
      };

      const style = statusStyles[status] || "bg-gray-100 text-gray-600";

      return (
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${style}`}>
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
          {status?.replace('_', ' ').toUpperCase()}
        </div>
      );
    }
  },
  {
    //ACTIONS
    //TODO - update modals for View, Edit, & Delete Units
    id: "actions",
    header: "ACTIONS",
    cell: ({ row }) => {
      const unit = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open unit actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="bg-[#FDFFF4] text-[#44291B]">
            <DropdownMenuLabel>Unit Options</DropdownMenuLabel>
            
            <DropdownMenuItem 
              onClick={() => handleViewUnit(unit)}>
              <Eye className="mr-2 h-4 w-4" />
              <span>View</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => handleEditUnit(unit)}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => handleDeleteUnit(unit.unit_id)}
            >
              <Trash2 className="mr-2 h-4 w-4 text-[#DF3538] " />
              <span className="text-[#DF3538]">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]