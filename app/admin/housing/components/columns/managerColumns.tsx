"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Manager } from "@/types/housing/types"

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

export type ManagerColumn = {
  id: string
  name: string
  email: string
  office: string
  original: Manager
}

export const getManagerColumns = (
  handleSelect: (id: string) => void,
  openEditModal: (manager: Manager) => void,
  handleDelete: (id: string) => void,
): ColumnDef<ManagerColumn>[] => [
    {
      accessorKey: "name",
      header: "NAME",
      cell: ({ row }) => (
        <p className="font-bold text-[#44291B]">{row.getValue("name")}</p>
      ),
    },
    {
      accessorKey: "email",
      header: "EMAIL",
      cell: ({ row }) => (
        <p className="font-semibold text-[#44291B]">{row.getValue("email")}</p>
      ),
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        const manager = row.original.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F6F8D5]">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#FDFFF4] text-[#44291B] border-[#e2e4c0]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>

              <DropdownMenuItem
                className="focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer"
                onClick={() => openEditModal(manager)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="focus:bg-[#F6F8D5] text-[#DF3538] focus:text-[#DF3538] cursor-pointer"
                onClick={() => handleDelete(manager.employee_id)}>
                <Trash2 className="mr-2 h-4 w-4 text-[#DF3538]" />
                <span className="font-medium">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
