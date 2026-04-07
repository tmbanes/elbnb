'use client'

import { useState, useEffect, useCallback } from 'react'
import { Accommodation, Unit, AccommodationType, FurnishingStatus, UnitType, PropertyType } from '@/types/accommodation_units'
import { AccommodationTile } from '@/components/AccommodationTile'
import { UnitTile } from '@/components/UnitTile'

type ViewMode = 'accommodations' | 'units' | 'accommodation-detail'

interface AccommodationFilters {
  accommodationType: AccommodationType | ''
  propertyType: PropertyType | ''
  availability: 'vacant' | 'all'   
}

interface UnitFilters {
  unitType: UnitType | ''
  furnishingStatus: FurnishingStatus | ''
  availability: 'vacant' | 'all'
  propertyType: PropertyType | ''
  accommodationType: AccommodationType | ''  
}

// ─── Shared filter select ────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
      >
        <option value="">All</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

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
    propertyType: '',
    availability: 'all',   // ← default: show all
  })

  const [unitFilters, setUnitFilters] = useState<UnitFilters>({
    unitType: '',
    furnishingStatus: '',
    availability: 'vacant',
    propertyType: '',
    accommodationType: '',   // ← default: show all
  })

  // ── Filter logic ───────────────────────────────────────────────────────────

  const applyAccommodationFilters = useCallback(
    (list: Accommodation[], units: Unit[], f: AccommodationFilters) => {
      let filtered = list

      if (f.accommodationType) {
        filtered = filtered.filter(a => a.accommodation_type === f.accommodationType)
      }

      // property_type only applies to renting_space accommodations
      if (f.propertyType) {
        filtered = filtered.filter(
          a => a.accommodation_type === 'renting_space' && a.property_type === f.propertyType
        )
      }

      // availability filter — only keep accommodations that have at least one vacant unit
      if (f.availability === 'vacant') {
        const accomIdsWithVacancy = new Set(
          units
            .filter(u => u.current_occupancy < u.max_occupancy)
            .map(u => u.accommodation_id)
        )
        filtered = filtered.filter(a => accomIdsWithVacancy.has(a.accommodation_id))
      }

      setFilteredAccommodations(filtered)
    },
    []
  )

  const applyUnitFilters = useCallback(
    (units: Unit[], f: UnitFilters, accomList: Accommodation[]) => {
      let filtered = units

      if (f.unitType) {
        filtered = filtered.filter(u => u.unit_type === f.unitType)
      }

      if (f.furnishingStatus) {
        filtered = filtered.filter(u => u.furnishing_status === f.furnishingStatus)
      }

      if (f.availability === 'vacant') {
        filtered = filtered.filter(u => u.current_occupancy < u.max_occupancy)
      }

      // property_type: match via the unit's parent accommodation
      if (f.propertyType) {
        const rentingSpaceIds = new Set(
          accomList
            .filter(a => a.accommodation_type === 'renting_space' && a.property_type === f.propertyType)
            .map(a => a.accommodation_id)
        )
        filtered = filtered.filter(u => rentingSpaceIds.has(u.accommodation_id))
      }

      // accommodation type filter — match via parent accommodation
      if (f.accommodationType) {
        const matchingAccomIds = new Set(
          accomList
            .filter(a => a.accommodation_type === f.accommodationType)
            .map(a => a.accommodation_id)
        )
        filtered = filtered.filter(u => matchingAccomIds.has(u.accommodation_id))
      }

      setFilteredUnits(filtered)
    },
    []
  )

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAccommodations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/tiles?type=accommodations')
      if (!response.ok) throw new Error('Failed to fetch accommodations')
      const result: Accommodation[] = await response.json()
      setAccommodations(result)
      applyAccommodationFilters(result, allUnits, accommodationFilters)
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
      const result: Unit[] = await response.json()

      if (type === 'all') {
        setAllUnits(result)
        applyUnitFilters(result, unitFilters, accommodations)
      } else {
        setUnitsForAccommodation(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingUnits(false)
    }
  }

  // ── Initial load — fetch both, then apply accommodation filters once units are ready ──
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setLoadingUnits(true)
      setError(null)
      try {
        const [accomRes, unitsRes] = await Promise.all([
          fetch('/api/dashboard/tiles?type=accommodations'),
          fetch('/api/dashboard/tiles?type=units'),
        ])
        if (!accomRes.ok) throw new Error('Failed to fetch accommodations')
        if (!unitsRes.ok) throw new Error('Failed to fetch units')

        const accomData: Accommodation[] = await accomRes.json()
        const unitsData: Unit[] = await unitsRes.json()

        setAccommodations(accomData)
        setAllUnits(unitsData)

        // Apply default filters with both datasets available immediately
        applyAccommodationFilters(accomData, unitsData, accommodationFilters)
        applyUnitFilters(unitsData, unitFilters, accomData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
        setLoadingUnits(false)
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter change handlers ─────────────────────────────────────────────────

  const handleAccommodationFilterChange = useCallback(
    (patch: Partial<AccommodationFilters>) => {
      const next = { ...accommodationFilters, ...patch }
      setAccommodationFilters(next)
      applyAccommodationFilters(accommodations, allUnits, next)
    },
    [accommodations, allUnits, accommodationFilters, applyAccommodationFilters]
  )

  const handleUnitFilterChange = useCallback(
    (patch: Partial<UnitFilters>) => {
      const next = { ...unitFilters, ...patch }
      setUnitFilters(next)
      applyUnitFilters(allUnits, next, accommodations)
    },
    [allUnits, unitFilters, accommodations, applyUnitFilters]
  )

  const resetAccommodationFilters = useCallback(() => {
    const defaults: AccommodationFilters = { accommodationType: '', propertyType: '', availability: 'all' }
    setAccommodationFilters(defaults)
    applyAccommodationFilters(accommodations, allUnits, defaults)
  }, [accommodations, allUnits, applyAccommodationFilters])

  const resetUnitFilters = useCallback(() => {
    const defaults: UnitFilters = { unitType: '', furnishingStatus: '', availability: 'vacant', propertyType: '', accommodationType: '' }
    setUnitFilters(defaults)
    applyUnitFilters(allUnits, defaults, accommodations)
  }, [allUnits, accommodations, applyUnitFilters])

  // ── Navigation handlers ────────────────────────────────────────────────────

  const handleViewAccommodations = () => {
    setViewMode('accommodations')
    setSelectedAccommodation(null)
    setUnitsForAccommodation([])
    setError(null)
  }

  const handleViewAllUnits = async () => {
    setViewMode('units')
    setLoadingUnits(true)
    try {
      const response = await fetch('/api/dashboard/tiles?type=units')
      if (!response.ok) throw new Error('Failed to fetch units')
      const result: Unit[] = await response.json()
      setAllUnits(result)
      applyUnitFilters(result, unitFilters, accommodations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingUnits(false)
    }
  }

  const handleAccommodationClick = async (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    setViewMode('accommodation-detail')
    setLoadingUnits(true)
    try {
      const response = await fetch(
        `/api/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodation.accommodation_id}`
      )
      if (!response.ok) throw new Error('Failed to fetch units')
      const result: Unit[] = await response.json()
      setUnitsForAccommodation(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingUnits(false)
    }
  }

  const handleBack = () => {
    setViewMode('accommodations')
    setSelectedAccommodation(null)
    setUnitsForAccommodation([])
    setError(null)
  }

  // ── Derived: is property type filter relevant? ─────────────────────────────
  const showPropertyTypeInAccommodations =
    accommodationFilters.accommodationType === 'renting_space' ||
    accommodationFilters.accommodationType === ''

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Accommodations Dashboard</h1>

      {/* Tab buttons */}
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

      {/* ── Accommodations tab ── */}
      {viewMode === 'accommodations' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={resetAccommodationFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterSelect
                label="Accommodation Type"
                value={accommodationFilters.accommodationType}
                onChange={v => handleAccommodationFilterChange({
                  accommodationType: v as AccommodationType | '',
                  propertyType: '',
                })}
                disabled={loading}
                options={[
                  { value: 'dormitory',     label: 'Dormitory' },
                  { value: 'renting_space', label: 'Renting Space' },
                ]}
              />

              {/* Property type — only relevant for renting_space */}
              {showPropertyTypeInAccommodations && (
                <FilterSelect
                  label="Property Type"
                  value={accommodationFilters.propertyType}
                  onChange={v => handleAccommodationFilterChange({ propertyType: v as PropertyType | '' })}
                  disabled={loading}
                  options={[
                    { value: 'apartment', label: 'Apartment' },
                    { value: 'boarding',  label: 'Boarding House' },
                    { value: 'transient', label: 'Transient' },
                    { value: 'house',     label: 'House' },
                  ]}
                />
              )}

              {/* Availability filter for accommodations */}
              <FilterSelect
                label="Availability"
                value={accommodationFilters.availability}
                onChange={v => handleAccommodationFilterChange({ availability: v as 'vacant' | 'all' })}
                disabled={loading}
                options={[
                  { value: 'vacant', label: 'With Vacant Slots' },
                  { value: 'all',    label: 'All Accommodations' },
                ]}
              />

              <div className="flex items-end">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredAccommodations.length}</span>{' '}
                  accommodation{filteredAccommodations.length !== 1 ? 's' : ''} found
                </p>
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
              <button onClick={resetAccommodationFilters} className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
                Clear Filters
              </button>
            </div>
          )}

          {!loading && filteredAccommodations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccommodations.map(accommodation => {
                const accommodationUnits = allUnits.filter(u => u.accommodation_id === accommodation.accommodation_id)
                return (
                  <AccommodationTile
                    key={accommodation.accommodation_id}
                    accommodation={accommodation}
                    onClick={handleAccommodationClick}
                    units={accommodationUnits}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── All Units tab ── */}
      {viewMode === 'units' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button onClick={resetUnitFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Accommodation Type filter in Units tab */}
              <FilterSelect
                label="Accommodation Type"
                value={unitFilters.accommodationType}
                onChange={v => handleUnitFilterChange({ accommodationType: v as AccommodationType | '' })}
                disabled={loadingUnits}
                options={[
                  { value: 'dormitory',     label: 'Dormitory' },
                  { value: 'renting_space', label: 'Renting Space' },
                ]}
              />
              <FilterSelect
                label="Unit Type"
                value={unitFilters.unitType}
                onChange={v => handleUnitFilterChange({ unitType: v as UnitType | '' })}
                disabled={loadingUnits}
                options={[
                  { value: 'room',      label: 'Room' },
                  { value: 'bedspace',  label: 'Bedspace' },
                  { value: 'wholeunit', label: 'Whole Unit' },
                ]}
              />
              <FilterSelect
                label="Furnishing Status"
                value={unitFilters.furnishingStatus}
                onChange={v => handleUnitFilterChange({ furnishingStatus: v as FurnishingStatus | '' })}
                disabled={loadingUnits}
                options={[
                  { value: 'furnished',      label: 'Furnished' },
                  { value: 'semi-furnished', label: 'Semi-Furnished' },
                  { value: 'unfurnished',    label: 'Unfurnished' },
                ]}
              />
              <FilterSelect
                label="Availability"
                value={unitFilters.availability}
                onChange={v => handleUnitFilterChange({ availability: v as 'vacant' | 'all' })}
                disabled={loadingUnits}
                options={[
                  { value: 'vacant', label: 'With Vacant Slots' },
                  { value: 'all',    label: 'All Units' },
                ]}
              />
              <FilterSelect
                label="Property Type"
                value={unitFilters.propertyType}
                onChange={v => handleUnitFilterChange({ propertyType: v as PropertyType | '' })}
                disabled={loadingUnits}
                options={[
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'boarding',  label: 'Boarding House' },
                  { value: 'transient', label: 'Transient' },
                  { value: 'house',     label: 'House' },
                ]}
              />

              <div className="flex items-end">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredUnits.length}</span>{' '}
                  unit{filteredUnits.length !== 1 ? 's' : ''} found
                </p>
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
              <button onClick={resetUnitFilters} className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
                Clear Filters
              </button>
            </div>
          )}

          {!loadingUnits && filteredUnits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUnits.map(unit => {
                const accommodation = accommodations.find(a => a.accommodation_id === unit.accommodation_id)
                if (!accommodation) return null
                return <UnitTile key={unit.unit_id} unit={unit} accommodation={accommodation} />
              })}
            </div>
          )}
        </>
      )}

      {/* ── Accommodation detail tab ── */}
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
            {selectedAccommodation.property_type && (
              <p className="text-sm text-gray-500 mt-0.5 capitalize">{selectedAccommodation.property_type}</p>
            )}
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
              {unitsForAccommodation.map(unit => (
                <UnitTile key={unit.unit_id} unit={unit} accommodation={selectedAccommodation} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}