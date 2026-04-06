'use client'

import { useState, useEffect, useCallback } from 'react'
import { Accommodation, Unit } from '@/types/accommodation_units'
import { AccommodationTile } from '@/components/AccommodationTile'
import { UnitTile } from '@/components/UnitTile'

type ViewMode = 'accommodations' | 'units' | 'accommodation-detail'

interface AccommodationFilters {
  accommodationType: 'dormitory' | 'rental_space' | ''
}

interface UnitFilters {
  unitType: 'room' | 'bedspace' | 'wholeunit' | ''
  furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished' | ''
  availability: 'vacant' | 'all'
}

export default function AccommodationsDashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('accommodations')

  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [filteredAccommodations, setFilteredAccommodations] = useState<Accommodation[]>([])

  const [allUnits, setAllUnits] = useState<Unit[]>([])
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([])

  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [unitsForAccommodation, setUnitsForAccommodation] = useState<Unit[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [accommodationFilters, setAccommodationFilters] = useState<AccommodationFilters>({
    accommodationType: '',
  })

  const [unitFilters, setUnitFilters] = useState<UnitFilters>({
    unitType: '',
    furnishingStatus: '',
    availability: 'vacant',
  })

  const applyAccommodationFilters = useCallback(
    (accommodationsList: Accommodation[], currentFilters: AccommodationFilters) => {
      let filtered = accommodationsList

      if (currentFilters.accommodationType) {
        filtered = filtered.filter(
          (accommodation) => accommodation.type === currentFilters.accommodationType
        )
      }

      setFilteredAccommodations(filtered)
    },
    []
  )

  const applyUnitFilters = useCallback((units: Unit[], currentFilters: UnitFilters) => {
    let filtered = units

    if (currentFilters.unitType) {
      filtered = filtered.filter((unit) => unit.unit_type === currentFilters.unitType)
    }

    if (currentFilters.furnishingStatus) {
      filtered = filtered.filter(
        (unit) => unit.furnishing_status === currentFilters.furnishingStatus
      )
    }

    if (currentFilters.availability === 'vacant') {
      filtered = filtered.filter((unit) => unit.current_occupancy < unit.max_occupancy)
    }

    setFilteredUnits(filtered)
  }, [])

  const fetchAccommodations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/tiles?type=accommodations')
      if (!response.ok) throw new Error('Failed to fetch accommodations')

      const result = await response.json()
      setAccommodations(result)
      applyAccommodationFilters(result, accommodationFilters)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async (
    type: 'all' | 'by-accommodation',
    accommodationId?: string
  ) => {
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
        applyUnitFilters(result, unitFilters)
      } else {
        setUnitsForAccommodation(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingUnits(false)
    }
  }

  const handleAccommodationFilterChange = useCallback(
    (newFilters: AccommodationFilters) => {
      setAccommodationFilters(newFilters)
      applyAccommodationFilters(accommodations, newFilters)
    },
    [accommodations, applyAccommodationFilters]
  )

  const handleUnitFilterChange = useCallback(
    (newFilters: UnitFilters) => {
      setUnitFilters(newFilters)
      applyUnitFilters(allUnits, newFilters)
    },
    [allUnits, applyUnitFilters]
  )

  const resetAccommodationFilters = useCallback(() => {
    const defaultFilters: AccommodationFilters = {
      accommodationType: '',
    }

    setAccommodationFilters(defaultFilters)
    applyAccommodationFilters(accommodations, defaultFilters)
  }, [accommodations, applyAccommodationFilters])

  const resetUnitFilters = useCallback(() => {
    const defaultFilters: UnitFilters = {
      unitType: '',
      furnishingStatus: '',
      availability: 'vacant',
    }

    setUnitFilters(defaultFilters)
    applyUnitFilters(allUnits, defaultFilters)
  }, [allUnits, applyUnitFilters])

  useEffect(() => {
    fetchAccommodations()
  }, [])

  const handleViewAccommodations = () => {
    setViewMode('accommodations')
    setSelectedAccommodation(null)
    setUnitsForAccommodation([])
    setError(null)
  }

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
      <h1 className="text-3xl font-bold text-gray-900">Accommodations Dashboard</h1>

      <div className="flex gap-3">
        <button
          onClick={handleViewAccommodations}
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

      {viewMode === 'accommodations' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Accommodation Filters</h2>
              <button
                onClick={resetAccommodationFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accommodation Type
                </label>
                <select
                  value={accommodationFilters.accommodationType}
                  onChange={(e) =>
                    handleAccommodationFilterChange({
                      accommodationType: e.target.value as 'dormitory' | 'rental_space' | '',
                    })
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">All Types</option>
                  <option value="dormitory">Dormitory</option>
                  <option value="rental_space">Rental Space</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-sm">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {filteredAccommodations.length}
                    </span>{' '}
                    accommodation{filteredAccommodations.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
          </div>

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

          {!loading && accommodations.length > 0 && filteredAccommodations.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No accommodations found matching your filters.</p>
              <button
                onClick={resetAccommodationFilters}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loading && filteredAccommodations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccommodations.map((accommodation) => (
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

      {viewMode === 'units' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Unit Filters</h2>
              <button
                onClick={resetUnitFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Type
                </label>
                <select
                  value={unitFilters.unitType}
                  onChange={(e) =>
                    handleUnitFilterChange({
                      ...unitFilters,
                      unitType: e.target.value as 'room' | 'bedspace' | 'wholeunit' | '',
                    })
                  }
                  disabled={loadingUnits}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">All Types</option>
                  <option value="room">Room</option>
                  <option value="bedspace">Bedspace</option>
                  <option value="wholeunit">Whole Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Furnishing Status
                </label>
                <select
                  value={unitFilters.furnishingStatus}
                  onChange={(e) =>
                    handleUnitFilterChange({
                      ...unitFilters,
                      furnishingStatus: e.target.value as
                        | 'furnished'
                        | 'semi-furnished'
                        | 'unfurnished'
                        | '',
                    })
                  }
                  disabled={loadingUnits}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">All Conditions</option>
                  <option value="furnished">Furnished</option>
                  <option value="semi-furnished">Semi-Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={unitFilters.availability}
                  onChange={(e) =>
                    handleUnitFilterChange({
                      ...unitFilters,
                      availability: e.target.value as 'vacant' | 'all',
                    })
                  }
                  disabled={loadingUnits}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="vacant">With Vacant Slots</option>
                  <option value="all">All Units</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-sm">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">{filteredUnits.length}</span>{' '}
                    unit{filteredUnits.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loadingUnits && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          )}

          {!loadingUnits && filteredUnits.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No units found matching your filters.</p>
              <button
                onClick={resetUnitFilters}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loadingUnits && filteredUnits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUnits.map((unit) => (
                <UnitTile key={unit.unit_id} unit={unit}/>
              ))}
            </div>
          )}
        </>
      )}

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