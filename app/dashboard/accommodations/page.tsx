// app/dashboard/accommodations/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Accommodation, Unit } from '@/types/accommodation_units'

type ViewMode = 'accommodations' | 'units' | 'accommodation-detail'

export default function AccommodationsDashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('accommodations')
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [allUnits, setAllUnits] = useState<Unit[]>([])
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [unitsForAccommodation, setUnitsForAccommodation] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccommodations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/tiles?type=accommodations')
      if (!response.ok) throw new Error('Failed to fetch accommodations')
      const result = await response.json()
      setAccommodations(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async (type: 'all' | 'by-accommodation', accommodationId?: string) => {
    setLoadingUnits(true)
    setError(null)

    try {
      let url = '/api/dashboard/tiles?type='
      
      if (type === 'all') {
        url += 'units'
      } else if (type === 'by-accommodation' && accommodationId) {
        url += `units-by-accommodation&accommodationId=${accommodationId}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch units')
      const result = await response.json()
      
      if (type === 'all') {
        setAllUnits(result)
      } else {
        setUnitsForAccommodation(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingUnits(false)
    }
  }

  // Fetch accommodations on mount
  useEffect(() => {
    fetchAccommodations()
  }, [])

  const handleViewAllUnits = async () => {
    setViewMode('units')
    await fetchUnits('all')
  }

  const handleAccommodationClick = async (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    setViewMode('accommodation-detail')
    await fetchUnits('by-accommodation', accommodation.accommodation_id)
  }

  const handleBack = () => {
    setViewMode('accommodations')
    setSelectedAccommodation(null)
    setUnitsForAccommodation([])
    setError(null)
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Toggle Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setViewMode('accommodations')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === 'accommodations'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Accommodations
        </button>
        <button
          onClick={handleViewAllUnits}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === 'units'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Units
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Accommodations View */}
      {viewMode === 'accommodations' && (
        <>
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && accommodations.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No accommodations found.</p>
            </div>
          )}

          {!loading && accommodations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((accommodation) => (
                <button
                  key={accommodation.accommodation_id}
                  onClick={() => handleAccommodationClick(accommodation)}
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
              ))}
            </div>
          )}
        </>
      )}

      {/* All Units View */}
      {viewMode === 'units' && (
        <>
          {loadingUnits && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          )}

          {!loadingUnits && allUnits.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No units found.</p>
            </div>
          )}

          {!loadingUnits && allUnits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allUnits.map((unit) => (
                <div key={unit.unit_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Accommodation Detail View */}
      {viewMode === 'accommodation-detail' && selectedAccommodation && (
        <>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            ← Back
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900">{selectedAccommodation.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{selectedAccommodation.location}</p>
          </div>

          {loadingUnits && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          )}

          {!loadingUnits && unitsForAccommodation.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No units found.</p>
            </div>
          )}

          {!loadingUnits && unitsForAccommodation.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unitsForAccommodation.map((unit) => (
                <div key={unit.unit_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}