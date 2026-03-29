// components/AccommodationTile.tsx
'use client'

import { Accommodation } from '@/types/accommodation_units'

interface AccommodationTileProps {
  accommodation: Accommodation
  onClick: (accommodation: Accommodation) => void
}

export function AccommodationTile({ accommodation, onClick }: AccommodationTileProps) {
  return (
    <button
      onClick={() => onClick(accommodation)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition text-left"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {accommodation.name}
      </h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-500">Location</p>
          <p className="text-gray-900 font-medium">{accommodation.location}</p>
        </div>
        <div>
          <p className="text-gray-500">Type</p>
          <p className="text-gray-900 font-medium">{accommodation.accommodation_type}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Capacity</p>
          <p className="text-gray-900 font-medium">{accommodation.total_capacity}</p>
        </div>
      </div>
    </button>
  )
}