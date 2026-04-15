'use client'

import { Accommodation, Unit } from '@/types/accommodation_units'

interface AccommodationCardProps {
  accommodation: Accommodation
  units: Unit[]
  onDetailsClick: (accommodation: Accommodation) => void
}

export function AccommodationCard({
  accommodation,
  units,
  onDetailsClick,
}: AccommodationCardProps) {
  const vacantUnits = units.filter((unit) => unit.vacant_slots > 0)
  const hasVacant = vacantUnits.length > 0

  return (
    <div className="flex-shrink-0 w-64 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group -mr-12" style={{ backgroundColor: '#FDFFF4' }}>
      {/* Image Placeholder */}
      <div className="h-48 bg-gradient-to-b from-gray-300 to-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-300 group-hover:scale-105 transition-transform duration-300" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-bold mb-1 truncate" style={{ color: '#44291B' }}>
          {accommodation.name.toUpperCase()}
        </h3>

        {/* Address */}
        <p className="text-xs mb-4 line-clamp-2" style={{ color: '#44291B' }}>
          {accommodation.location}
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition ${
              hasVacant
                ? 'text-white hover:opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: hasVacant ? '#264384' : undefined,
            }}
            disabled={!hasVacant}
          >
            SHARED ROOM
          </button>
          <button
            onClick={() => onDetailsClick(accommodation)}
            className="flex-1 px-3 py-2 rounded-md text-xs font-semibold hover:opacity-90 transition"
            style={{
              borderColor: '#264384',
              color: '#264384',
              borderWidth: '2px',
            }}
          >
            DETAILS
          </button>
        </div>
      </div>
    </div>
  )
}
