import React from 'react'
import Link from 'next/link'
import { Accommodation, Unit } from '@/types/accommodation_units'

interface UnitListViewProps {
  paginatedUnits: Unit[]
  accommodations: Accommodation[]
  totalPages: number
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  validCurrentPage: number
  basePath: string
}

export function UnitsListView({
  paginatedUnits,
  accommodations,
  totalPages,
  currentPage,
  setCurrentPage,
  validCurrentPage,
  basePath,
}: UnitListViewProps) {
  return (
    <div className="space-y-3">
      {paginatedUnits.map((unit: Unit) => {
        const accommodation = accommodations.find(
          (a) => a.accommodation_id === unit.accommodation_id
        )

        return (
          <div
            key={unit.unit_id}
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
                  {unit.unit_number.toUpperCase()}
                </h2>

                {/* PRICE */}
                <div className="flex flex-col items-end whitespace-nowrap">
                  <span className="font-archivo font-bold text-[#44291B] text-lg italic">
                    {unit.rental_fee ? `₱${Number(unit.rental_fee).toFixed(2)}` : 'xxx.xx'}
                  </span>
                  <span className="text-xs text-[#44291B] font-archivo">
                    / month
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#44291B] -mt-4">
                {accommodation?.name || 'N/A'} {accommodation?.location ? `- ${accommodation.location}` : ''}
              </p>

              <div className="flex gap-3 text-sm text-[#44291B] mt-3">
                <span className="px-0 py-1 font-medium">Type: {unit.unit_type}</span>
                <span className="px-2 py-1 font-medium">Furnishing: {unit.furnishing_status}</span>
                <span className="px-2 py-1 font-medium">Vacant Slots: {unit.vacant_slots}</span>
              </div>

              {/* DESCRIPTION */}
              <p className="text-sm text-[#44291B] mt-3">
                Description of the unit will be placed here.
              </p>

              <div className="flex gap-3 mt-4">
                <button className="px-9 py-2 border border-[#7C6A58] rounded-lg text-sm text-[#44291B]">
                  View Details
                </button>

                <Link
                  href={unit.vacant_slots > 0 ? `${basePath}/application?accommodationId=${unit.accommodation_id}&unitId=${unit.unit_id}` : '#'}
                  className={`px-8 py-2 rounded-lg text-sm inline-block ${unit.vacant_slots > 0 ? 'bg-[#2B4A8B] text-white hover:opacity-90' : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
                    }`}
                >
                  Apply
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      {paginatedUnits.length === 0 && (
        <div className="p-10 text-center text-gray-500">
          No units found matching your criteria.
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
