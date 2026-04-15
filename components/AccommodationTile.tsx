// components/AccommodationTile.tsx
'use client'

import { Unit, Accommodation } from '@/types/accommodation_units'
import Link from 'next/link'

interface AccommodationTileProps {
  accommodation: Accommodation
  onClick: (accommodation: Accommodation) => void
  units: Unit[] // units of the accommodation
}

export function AccommodationTile({ accommodation, onClick, units }: AccommodationTileProps) {
  // map through "units" having accommodation.id and sum the "current_occupancy" is less than "total_capacity" to determine if there are vacant slots
  const vacantUnits = units.filter((unit) => unit.vacant_slots > 0)
  const hasVacant = vacantUnits.length > 0
  const today = new Date();
  const isApplicationOpen = today <= new Date(accommodation.allowed_application);

  return (
    <div
      onClick={() => onClick(accommodation)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition text-left cursor-pointer"
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
          <p className="text-gray-500">Application Period</p>
          <p className="text-gray-900 font-medium">{accommodation.allowed_application}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Capacity</p>
          <p className="text-gray-900 font-medium">{accommodation.total_capacity}</p>
        </div>
      </div>

      {hasVacant ? (
        isApplicationOpen ? (
          <Link
            href={`/dashboard/application_form?accommodationId=${accommodation.accommodation_id}`}
            className="mt-4 w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Apply in this Accommodation
          </Link>
        ) : (
          <button
            disabled
            className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
          >
            Application Period Ended
          </button>
        )
      ) : (
        <button
          disabled
          className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
        >
          No Vacant Slots in Any Unit
        </button>
      )}
    </div>
  )
}