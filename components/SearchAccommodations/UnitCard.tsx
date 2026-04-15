'use client'

import { Unit, Accommodation } from '@/types/accommodation_units'

interface UnitCardProps {
  unit: Unit
  accommodation: Accommodation | undefined
  onDetailsClick: (unit: Unit) => void
}

export function UnitCard({ unit, accommodation, onDetailsClick }: UnitCardProps) {
  return (
    <div className="flex-shrink-0 w-64 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group -mr-12" style={{ backgroundColor: '#FDFFF4' }}>
      {/* Image Placeholder */}
      <div className="h-48 bg-gradient-to-b from-blue-300 to-blue-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-300 group-hover:scale-105 transition-transform duration-300" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-bold mb-1 truncate" style={{ color: '#44291B' }}>
          {unit.unit_number.toUpperCase()}
        </h3>

        {/* Accommodation/Address */}
        <p className="text-xs mb-2 line-clamp-1" style={{ color: '#44291B' }}>
          {accommodation?.name || 'N/A'}
        </p>

        {/* Unit Details */}
        <div className="text-xs mb-4 space-y-1" style={{ color: '#44291B' }}>
          <p>Type: {unit.unit_type}</p>
          <p>Furnishing: {unit.furnishing_status}</p>
          <p>Vacant Slots: {unit.vacant_slots}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition ${
              unit.vacant_slots > 0
                ? 'text-white hover:opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: unit.vacant_slots > 0 ? '#264384' : undefined,
            }}
            disabled={unit.vacant_slots === 0}
          >
            BOOK
          </button>
          <button
            onClick={() => onDetailsClick(unit)}
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
