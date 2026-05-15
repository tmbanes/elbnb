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
          <p className="text-gray-900 font-medium capitalize">{accommodation.accommodation_type}</p>
        </div>
        <div>
          <p className="text-gray-500">Sex Allowed</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-gray-900 font-medium">
            {(!accommodation.accomm_sex || accommodation.accomm_sex.toLowerCase() === 'all' || accommodation.accomm_sex.toLowerCase() === 'coed') && (
              <>
                <svg className="w-4 h-4 text-purple-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="15" r="5" />
                  <path d="M9 20v3M7 22h4" />
                  <circle cx="15" cy="9" r="5" />
                  <path d="M18.5 5.5L22 2M17 2h5v5" />
                </svg>
                <span>COED</span>
              </>
            )}
            {(accommodation.accomm_sex?.toLowerCase() === 'female' || accommodation.accomm_sex?.toLowerCase() === 'f') && (
              <>
                <svg className="w-4 h-4 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="6"/><path d="M12 16v6M9 19h6"/></svg>
                <span>Female only</span>
              </>
            )}
            {(accommodation.accomm_sex?.toLowerCase() === 'male' || accommodation.accomm_sex?.toLowerCase() === 'm') && (
              <>
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="6"/><path d="M14.243 9.757L21 3M16 3h5v5"/></svg>
                <span>Male only</span>
              </>
            )}
          </div>
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