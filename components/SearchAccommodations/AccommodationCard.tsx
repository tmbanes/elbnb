'use client'

import Link from 'next/link'
import { Accommodation, Unit } from '@/types/accommodation_units'

interface AccommodationCardProps {
  accommodation: Accommodation
  units: Unit[]
  onDetailsClick: (accommodation: Accommodation) => void
  onSeeUnitsClick?: (accommodation: Accommodation) => void
  basePath?: string
  userRole?: 'student' | 'guest'
  appliedAccommodationIds?: Set<string>
}

export function AccommodationCard({
  accommodation,
  units,
  onDetailsClick,
  onSeeUnitsClick,
  basePath = '/student/accommodations',
  userRole = 'student',
  appliedAccommodationIds = new Set(),
}: AccommodationCardProps) {
  const vacantUnits = units.filter((unit) => unit.vacant_slots > 0)
  const hasVacant = vacantUnits.length > 0
  const totalVacantSlots = vacantUnits.reduce((acc, curr) => acc + curr.vacant_slots, 0)

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = accommodation?.allowed_application ? new Date(accommodation.allowed_application) : null;
  if (deadline) deadline.setHours(23, 59, 59, 999);
  const isApplicationOpen = deadline ? today <= deadline : false;

  return (
    <div className="flex-shrink-0 w-72 min-h-[420px] rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden group flex flex-col transform-gpu will-change-transform" style={{ backgroundColor: '#FDFFF4' }}>
      {/* Image */}
      <div className="h-48 relative overflow-hidden flex-shrink-0 bg-gray-200">
        {accommodation.image ? (
          <img
            src={accommodation.image}
            alt={accommodation.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide broken image and reveal placeholder behind it
              (e.target as HTMLImageElement).style.display = 'none';
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
          {totalVacantSlots > 5 ? (
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md border border-white/20 backdrop-blur-sm">
              Available
            </span>
          ) : totalVacantSlots > 0 ? (
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

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-2xl font-black mb-2 line-clamp-2 min-h-[4rem]" style={{ color: '#44291B', lineHeight: '2rem' }} title={accommodation.name}>
          {accommodation.name}
        </h3>

        {/* Key Details */}
        <div className="flex flex-col gap-2 mb-4 flex-1">
          <div className="flex items-start gap-2 text-sm" style={{ color: '#44291B' }}>
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="line-clamp-2 min-h-[2.5rem]" style={{ lineHeight: '1.25rem' }}>{accommodation.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#264384' }}>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {units.length > 0 ? `From ₱${Math.min(...units.map((u: any) => u.rental_fee)).toLocaleString()}` : 'Price not set'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          {userRole === 'student' ? (
            isApplicationOpen ? (
              hasVacant ? (
                appliedAccommodationIds.has(accommodation.accommodation_id) ? (
                  <button
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    Already Applied
                  </button>
                ) : (
                  <Link
                    href={`${basePath}/application?accommodationId=${accommodation.accommodation_id}`}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm text-white hover:opacity-90 active:scale-[0.98] text-center block"
                    style={{ backgroundColor: '#264384' }}
                  >
                    Apply
                  </Link>
                )
              ) : (
                <button
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  Apply (Full)
                </button>
              )
            ) : (
              <button
                disabled
                className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-300 text-gray-500 cursor-not-allowed text-center block"
              >
                Applications Closed
              </button>
            )
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onSeeUnitsClick?.(accommodation);
              }}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm text-white hover:opacity-90 active:scale-[0.98] text-center block"
              style={{ backgroundColor: '#264384' }}
            >
              See Units
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              onDetailsClick(accommodation);
            }}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] bg-transparent hover:bg-black/5"
            style={{
              borderColor: '#264384',
              color: '#264384',
              borderWidth: '2px',
            }}
          >
            View Accommodation
          </button>
        </div>
      </div>
    </div>
  )
}
