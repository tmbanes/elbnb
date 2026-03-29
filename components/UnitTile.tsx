// components/UnitTile.tsx
'use client'

import { Unit } from '@/types/accommodation_units'
import Link from 'next/link'

interface UnitTileProps {
  unit: Unit
}

export function UnitTile({ unit }: UnitTileProps) {
    const isVacant = unit.vacant_slots > 0
    
    return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{unit.unit_number}</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-500">Type</p>
          <p className="text-gray-900 font-medium">{unit.unit_type}</p>
        </div>
        <div>
          <p className="text-gray-500">Furnishing</p>
          <p className="text-gray-900 font-medium">{unit.furnishing_status}</p>
        </div>
        <div>
          <p className="text-gray-500">Max Occupancy</p>
          <p className="text-gray-900 font-medium">{unit.max_occupancy}</p>
        </div>
        <div>
          <p className="text-gray-500">Rental Fee</p>
          <p className="text-gray-900 font-medium">₱{unit.rental_fee.toLocaleString()} / {unit.billing_period}</p>
        </div>
        <div>
          <p className="text-gray-500">Vacant Slots</p>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${unit.vacant_slots > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {unit.vacant_slots}
          </span>
        </div>
      </div>
      {isVacant ? (
        <Link
          href={`/dashboard/accommodation_application?unitId=${unit.unit_id}&accommodationId=${unit.accommodation_id}`}
          className="mt-4 w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Apply in this Unit
        </Link>
      ) : (
        <button
          disabled
          className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
        >
          No Vacant Slots
        </button>
      )}
    </div>
  )
}