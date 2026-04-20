//components/housing/propertyColumns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"

//ui components
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"



export type PropertyColumn = {
  id: string
  name: string
  type: string
  location: string
  manager: string
  status: string  //active - w/manager; inactive - w/out manager
  capacity: number
  original: any
}

export const getPropertyColumns = (
  handleSelectProperty: (id: string) => void,
  openEditModal: (p: any) => void,
  handleDeleteProperty: (id: string, type: string) => void
): ColumnDef<PropertyColumn>[] => [
  {
    //NAME
    accessorKey: "name",
    header: "NAME",
  },
  {
    //TYPE
    accessorKey: "type",
    header: "TYPE",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      
      const isDorm = type.toLowerCase().includes("dorm");
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          isDorm 
            ? "bg-[#ebf2f4] text-[#5591AB]" 
            : "bg-[#fbecd7] text-[#EB8A0B]"
        }`}>
          {type}
        </span>
      );
    },
  },
  // {
  //   accessorKey: "location", //remove location from table for now
  //   header: "LOCATION",
  // },
  {
    //MANAGER
    accessorKey: "manager",
    header: "MANAGER",
  },
  {
    //STATUS
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      //color mapping status
      const statusStyles: Record<string, string> = {
        active: "bg-[#E7FAD3] text-[#78A24C]",
        inactive: "bg-gray-100 text-gray-700",
      };

      const style = statusStyles[status.toLowerCase()] || "bg-gray-100 text-gray-600";

      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
          <span className="mr-1.5 h-2 w-2 rounded-full bg-current" />
          {status}
        </div>
      );
    },
  },
  {
    //CAPACITY
    //TODO - fix occupancy values
    accessorKey: "capacity",
    header: "CAPACITY",
    cell: ({ row }) => {
      const property = row.original.original as {
        units?: Array<{ current_occupancy?: number }>;
      };
      const current = property.units?.reduce(
        (sum, unit) => sum + (unit.current_occupancy ?? 0),
        0,
      ) ?? 0;
      const total = row.original.capacity ?? 0;
      const percentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;

      return (
        <div className="flex flex-col gap-1.5 min-w-[90px] py-1 pr-10">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-[#44291B]">
              {current}/{total}
            </span>
            <span className="text-[10px] font-medium text-[#8c8b82]">
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
    //ACTIONS
    id: "actions",
    header: "ACTIONS",
    cell: ({ row }) => {
      const p = row.original.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#FDFFF4] text-[#44291B]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleSelectProperty(p.accommodation_id)}
            > 
              <Eye className="mr-2 h-4 w-4" />
              <span>View</span>
            </DropdownMenuItem>
            
  
            <DropdownMenuItem 
              onClick={() => openEditModal(p)}
            > 
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            

            <DropdownMenuItem
              onClick={() =>
              handleDeleteProperty(
                p.accommodation_id,
                p.accommodation_type
              )}
            >  
              <Trash2 className="mr-2 h-4 w-4 text-[#DF3538]" />
              <span className="text-[#DF3538]">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]