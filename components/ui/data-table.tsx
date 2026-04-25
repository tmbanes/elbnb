"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  header?: React.ReactNode
  toolbar?: React.ReactNode
  className?: string
  onRowClick?: (data: TData) => void
  activeRowId?: string
}



export function DataTable<TData, TValue>({
  columns,
  data,
  header,
  toolbar,
  className,
  onRowClick,
  activeRowId,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 5,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
    autoResetPageIndex: false,
  })

  return (
    <div className={`bg-[#FDFFF4] border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden print:hidden ${className ?? ""}`}>
      {(header || toolbar) && (
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#FDFFF4] p-6 sm:flex-row sm:items-center sm:justify-between">
          {header && <div>{header}</div>}
          {toolbar && <div>{toolbar}</div>}
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const isSelected = activeRowId === (row.original as any).id;
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "transition-colors group",
                    onRowClick ? "cursor-pointer hover:bg-[#F6F8D5]/60" : "",
                    isSelected ? "bg-[#F6F8D5] border-l-4 border-l-[#264384]" : "border-l-4 border-l-transparent"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-[#44291B]/40">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-center space-x-4 px-4 py-3 border-t border-slate-200 bg-transparent">
          <Button
            className="h-8 w-8 p-0 text-slate-700 bg-[#FDFFF4] hover:bg-[#F6F8D5] hover:text-[#44291B]"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium text-[#44291B]">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>

          <Button
            className="h-8 w-8 p-0 text-slate-700 bg-[#FDFFF4] hover:bg-[#F6F8D5] hover:text-[#44291B]"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
