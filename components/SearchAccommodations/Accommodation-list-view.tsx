import React from 'react'
import Link from 'next/link'
import { Accommodation } from '@/types/accommodation_units'

interface AccommodationListViewProps {
  paginatedAccommodations: Accommodation[]
  totalPages: number
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  validCurrentPage: number
  basePath: string
  onSeeUnitsClick?: (accommodation: Accommodation) => void
}

export function AccommodationListView({
  paginatedAccommodations,
  totalPages,
  currentPage,
  setCurrentPage,
  validCurrentPage,
  basePath,
  onSeeUnitsClick,
}: AccommodationListViewProps) {
  return (
    <div className="space-y-3">
      {paginatedAccommodations.map((acc: Accommodation) => (
        <div
          key={acc.accommodation_id}
          className="bg-[#FDFFF4] border border-[#7C6A58] rounded-2xl flex gap-1 overflow-hidden"
        >
          {/* IMAGE SIDE */}
          <div className="w-[200px] bg-gray-300 flex items-center justify-center text-gray-500 text-xs text-center p-4">
            [Image Placeholder]
          </div>

          {/* CONTENT SIDE */}
          <div className="flex-1 min-w-0 p-6">
            <div className="flex justify-between gap-4">
              <h2 className="font-archivo font-extrabold text-2xl uppercase text-[#44291B] truncate">
                {acc.name}
              </h2>

              {/* PRICE — not available at accommodation level; shown on units */}
              {/* PRICE shown here could be min/max of all units */}
              <div className="flex flex-col items-end whitespace-nowrap">
                <span className="font-archivo font-bold text-[#44291B] text-lg italic">
                  xxx.xx
                </span>
                <span className="text-xs text-[#44291B] font-archivo">
                  / month
                </span>
              </div>
            </div>

            <p className="text-sm text-[#44291B] -mt-4">
              {acc.location}
            </p>

            <div className="flex gap-3 text-sm text-[#44291B] mt-3">
              <span className="px-0 py-1 font-medium">Type: {acc.accommodation_type === 'renting_space' ? 'Renting Space' : 'Dormitory'}</span>
              <span className="px-2 py-1 font-medium">Occupants: {acc.total_capacity || 'N/A'}</span>
            </div>

            {/* DESCRIPTION */}
            <p className="text-sm text-[#44291B] mt-3">
              Description of the accommodation will be placed here.
            </p>


            <div className="flex gap-3 mt-4">
              {/* VIEW DETAILS BUTTON */}
              <button className="px-9 py-2 border border-[#7C6A58] rounded-lg text-sm text-[#44291B]">
                View Details
              </button>

              {/* SEE UNITS BUTTON */}
              <button
                onClick={() => onSeeUnitsClick?.(acc)}
                className="px-8 py-2 bg-[#2B4A8B] text-white rounded-lg text-sm inline-block transition hover:opacity-90"
              >
                See Units
              </button>
            </div>
          </div>
        </div>
      ))}

      {paginatedAccommodations.length === 0 && (
        <div className="p-10 text-center text-gray-500">
          No accommodations found matching your criteria.
        </div>
      )}

      {/* CRUMB PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 text-sm">
          {/* Prev */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            className={`px-3 py-1 border border-[#D1D5DB] rounded text-[#1F2937] ${validCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          >
            &lt;
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`px-3 py-1 rounded ${validCurrentPage === p
                ? "bg-[#264384] text-white"
                : "text-[#374151] hover:bg-gray-100"
                }`}
            >
              {p}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            className={`px-3 py-1 border border-[#D1D5DB] rounded text-[#1F2937] ${validCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}
