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
  appliedAccommodationIds?: Set<string>
  onDetailsClick?: (unit: Unit) => void
}

export function UnitsListView({
  paginatedUnits,
  accommodations,
  totalPages,
  currentPage,
  setCurrentPage,
  validCurrentPage,
  basePath,
  appliedAccommodationIds = new Set(),
  onDetailsClick,
}: UnitListViewProps) {
  return (
    <div className="space-y-6">
      <div key={currentPage} className="space-y-3">
        {paginatedUnits.map((unit: Unit, index) => {
          const accommodation = accommodations.find(
            (a) => a.accommodation_id === unit.accommodation_id
          )
          const vacantSlots = unit.vacant_slots ?? Math.max(0, unit.max_occupancy - unit.current_occupancy)

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const deadline = accommodation?.allowed_application ? new Date(accommodation.allowed_application) : null;
          if (deadline) deadline.setHours(23, 59, 59, 999);
          const isApplicationOpen = deadline ? today <= deadline : false;

          return (
            <div
              key={unit.unit_id}
              className="bg-[#FDFFF4] shadow-md rounded-2xl flex gap-1 overflow-hidden"
              style={{ animation: 'pageSlideIn 0.3s ease-out both', animationDelay: `${index * 0.05}s` }}
            >
              {/* IMAGE SIDE */}
              <div className="w-[200px] relative overflow-hidden flex-shrink-0 bg-gray-200">
                {(unit as any).image ? (
                  <img
                    src={(unit as any).image}
                    alt={unit.unit_number}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="mt-2 text-xs text-gray-400 font-medium">No Image Available</span>
                  </div>
                )}

                {/* Availability Chip */}
                <div className="absolute top-3 left-3 z-10">
                  {vacantSlots > 5 ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md border border-white/20 backdrop-blur-sm">
                      Available
                    </span>
                  ) : vacantSlots > 0 ? (
                    <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-md border border-white/20 backdrop-blur-sm">
                      Limited
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-md border border-white/20 backdrop-blur-sm">
                      Full
                    </span>
                  )}
                </div>
              </div>

              {/* CONTENT SIDE */}
              <div className="flex-1 min-w-0 p-6">
                <div className="flex justify-between gap-4">
                  <h2 className="font-archivo font-extrabold text-2xl uppercase text-[#44291B] truncate">
                    {basePath === "/guest/accommodations" 
                      ? (unit.unit_type === "wholeunit" ? "WHOLE UNIT" : String(unit.unit_type || '').toUpperCase())
                      : String(unit.unit_number || '').toUpperCase()
                    }
                  </h2>

                  {/* PRICE */}
                  <div className="flex flex-col items-end whitespace-nowrap">
                    <div className="flex items-center gap-1 font-archivo font-bold text-[#264384] text-lg italic">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>
                        {unit.rental_fee ? `₱${Number(unit.rental_fee).toLocaleString()}` : 'Price not set'}
                      </span>
                    </div>
                    {unit.rental_fee && (
                      <span className="text-xs text-[#44291B] font-archivo">
                        / month
                      </span>
                    )}
                  </div>
                </div>

                {/* ACCOMMODATION NAME */}
                <div className="flex items-center gap-2 text-sm font-bold text-[#44291B] mt-1">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{accommodation?.name || 'N/A'}</span>
                </div>

                <div className="flex items-start gap-2 text-sm text-[#44291B] mt-1 opacity-80">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span className="line-clamp-1">{accommodation?.location || 'Location not set'}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#44291B] mt-3">
                  {/* Capacity */}
                  <div className="flex items-center gap-1.5" title="Max Occupancy">
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    <span className="font-medium">
                      {unit.max_occupancy} Max
                    </span>
                  </div>

                  {/* Vacant Slots */}
                  <div className="flex items-center gap-1.5" title={basePath === "/guest/accommodations" ? "Units Available" : "Vacant Slots"}>
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="3" r="1" strokeWidth="2" />
                      <line x1="12" y1="4" x2="8" y2="7" strokeLinecap="round" strokeWidth="2" />
                      <line x1="12" y1="4" x2="16" y2="7" strokeLinecap="round" strokeWidth="2" />
                      <rect x="4" y="7" width="16" height="13" rx="2" strokeWidth="2" />
                      <line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round" strokeWidth="1.5" />
                      <line x1="8.5" y1="15.5" x2="15.5" y2="15.5" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                    <span className="font-medium text-xs">
                      {basePath === "/guest/accommodations" 
                        ? `${(unit as any).available_units_count || (vacantSlots > 0 ? 1 : 0)} Units Available`
                        : `${unit.vacant_slots != null ? unit.vacant_slots : vacantSlots} Slots Vacant`
                      }
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[#44291B] mt-3 leading-relaxed">
                  A comfortable and well-maintained unit featuring secure facilities and easy access to essential amenities.
                </p>

                <div className="flex gap-3 mt-4">
                  {/* VIEW UNIT BUTTON */}
                  <button
                    onClick={() => onDetailsClick?.(unit)}
                    className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] bg-transparent hover:bg-[#264384]/5 border-2 border-[#264384] text-[#264384]"
                  >
                    View Unit
                  </button>

                  {/* APPLY BUTTON */}
                  {isApplicationOpen ? (
                    vacantSlots > 0 ? (
                      appliedAccommodationIds.has(unit.accommodation_id) ? (
                        <button
                          disabled
                          className="px-8 py-2.5 rounded-lg text-sm font-bold bg-gray-300 text-gray-500 cursor-not-allowed transition-all text-center"
                        >
                          Already Applied
                        </button>
                      ) : (
                        <Link
                          href={basePath === "/guest/accommodations" 
                            ? `${basePath}/application?accommodationId=${unit.accommodation_id}`
                            : `${basePath}/application?accommodationId=${unit.accommodation_id}&unitId=${unit.unit_id}`
                          }
                          className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm inline-block text-white hover:opacity-90 active:scale-[0.98]"
                          style={{ backgroundColor: '#264384' }}
                        >
                          Apply
                        </Link>
                      )
                    ) : (
                      <button
                        disabled
                        className="px-8 py-2.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                      >
                        Apply (Full)
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="px-8 py-2.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                    >
                      Applications Closed
                    </button>
                  )}
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
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10 text-sm">
          {/* Prev */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            className={`p-2 rounded-lg text-[#1F2937] transition-all duration-200 ${
              validCurrentPage === 1 
                ? 'opacity-20 cursor-not-allowed' 
                : 'hover:bg-gray-200/60 active:scale-90'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers with Sliding Indicator */}
          <div className="relative flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl">
            {/* Sliding Background */}
            <div 
              className="absolute h-9 w-9 bg-[#264384] rounded-lg shadow-lg shadow-[#264384]/20 transition-all duration-300 ease-in-out"
              style={{ 
                left: `calc(${validCurrentPage - 1} * (2.25rem + 0.25rem) + 0.25rem)`,
              }}
            />
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-lg font-bold transition-all duration-300 ${
                  validCurrentPage === p
                    ? 'text-white'
                    : 'text-[#374151] hover:bg-gray-200/80 active:scale-95'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            className={`p-2 rounded-lg text-[#1F2937] transition-all duration-200 ${
              validCurrentPage === totalPages 
                ? 'opacity-20 cursor-not-allowed' 
                : 'hover:bg-gray-200/60 active:scale-90'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
