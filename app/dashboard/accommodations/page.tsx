// app/dashboard/accommodations/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Accommodation, Unit } from '@/types/accommodation_units'
import { AccommodationTile } from '@/components/AccommodationTile'
import { UnitTile } from '@/components/UnitTile'

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
                <AccommodationTile
                  key={accommodation.accommodation_id}
                  accommodation={accommodation}
                  onClick={handleAccommodationClick}
                />
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
                <UnitTile key={unit.unit_id} unit={unit} />
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
                <UnitTile key={unit.unit_id} unit={unit} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}