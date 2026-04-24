'use client'

import { useState, useEffect, useCallback } from 'react'
import { Accommodation, Unit, AccommodationType, FurnishingStatus, UnitType, PropertyType } from '@/types/accommodation_units'
import { Carousel } from '@/components/SearchAccommodations/Carousel'
import { AccommodationCard } from '@/components/SearchAccommodations/AccommodationCard'
import { UnitCard } from '@/components/SearchAccommodations/UnitCard'
import { AccommodationFilters } from '@/components/SearchAccommodations/AccommodationFilters'
import { UnitFilters } from '@/components/SearchAccommodations/UnitFilters'
import { AccommodationListView } from '@/components/SearchAccommodations/Accommodation-list-view'
import { UnitsListView } from '@/components/SearchAccommodations/Units-list-view'
import next from 'next'
import Link from 'next/link'

type TabType = 'accommodations' | 'units'

interface AccommodationFiltersType {
  accommodationType: AccommodationType | ''
  propertyType: PropertyType | ''
  availability: 'vacant' | 'all'
}

interface UnitFiltersType {
  unitType: UnitType | ''
  furnishingStatus: FurnishingStatus | ''
  availability: 'vacant' | 'all'
  propertyType: PropertyType | ''
  accommodationType: AccommodationType | ''
  accommodationId: string | ''
}

export default function SearchAccommodationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('accommodations')

  // Data states
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [filteredAccommodations, setFilteredAccommodations] = useState<Accommodation[]>([])
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([])

  // Filter states
  const [accommodationFilters, setAccommodationFilters] = useState<AccommodationFiltersType>({
    accommodationType: '',
    propertyType: '',
    availability: 'all',
  })

  const [unitFilters, setUnitFilters] = useState<UnitFiltersType>({
    unitType: '',
    furnishingStatus: '',
    availability: 'vacant',
    propertyType: '',
    accommodationType: '',
    accommodationId: '',
  })

  // Loading & Error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // View mode state
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 3

  // Apply accommodation filters
  const applyAccommodationFilters = useCallback(
    (list: Accommodation[], allUnits: Unit[], filters: AccommodationFiltersType, search: string = '') => {
      let filtered = list

      if (filters.accommodationType) {
        filtered = filtered.filter((a) => a.accommodation_type === filters.accommodationType)
      }

      if (filters.propertyType) {
        filtered = filtered.filter(
          (a) => a.accommodation_type === 'renting_space' && a.property_type === filters.propertyType
        )
      }

      if (filters.availability === 'vacant') {
        const accomIdsWithVacancy = new Set(
          allUnits
            .filter((u) => u.current_occupancy < u.max_occupancy)
            .map((u) => u.accommodation_id)
        )
        filtered = filtered.filter((a) => accomIdsWithVacancy.has(a.accommodation_id))
      }

      // Apply search filter
      if (search.trim()) {
        const query = search.toLowerCase()
        filtered = filtered.filter((a) =>
          a.name.toLowerCase().includes(query) || a.location.toLowerCase().includes(query)
        )
      }

      setFilteredAccommodations(filtered)
      setCurrentPage(1)
    },
    []
  )

  // Apply unit filters
  const applyUnitFilters = useCallback(
    (list: Unit[], filters: UnitFiltersType, accomList: Accommodation[], search: string = '') => {
      let filtered = list

      if (filters.unitType) {
        filtered = filtered.filter((u) => u.unit_type === filters.unitType)
      }

      if (filters.furnishingStatus) {
        filtered = filtered.filter((u) => u.furnishing_status === filters.furnishingStatus)
      }

      if (filters.availability === 'vacant') {
        filtered = filtered.filter((u) => u.current_occupancy < u.max_occupancy)
      }

      if (filters.propertyType) {
        const rentingSpaceIds = new Set(
          accomList
            .filter((a) => a.accommodation_type === 'renting_space' && a.property_type === filters.propertyType)
            .map((a) => a.accommodation_id)
        )
        filtered = filtered.filter((u) => rentingSpaceIds.has(u.accommodation_id))
      }

      if (filters.accommodationType) {
        const matchingAccomIds = new Set(
          accomList
            .filter((a) => a.accommodation_type === filters.accommodationType)
            .map((a) => a.accommodation_id)
        )
        filtered = filtered.filter((u) => matchingAccomIds.has(u.accommodation_id))
      }

      if (filters.accommodationId) {
        filtered = filtered.filter((u) => u.accommodation_id === filters.accommodationId)
      }

      // Apply search filter
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchingAccomIds = new Set(
          accomList
            .filter((a) => a.name.toLowerCase().includes(query) || a.location.toLowerCase().includes(query))
            .map((a) => a.accommodation_id)
        )
        filtered = filtered.filter((u) => matchingAccomIds.has(u.accommodation_id))
      }

      setFilteredUnits(filtered)
      setCurrentPage(1)
    },
    []
  )

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
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
        setUnits(unitsData)

        applyAccommodationFilters(accomData, unitsData, accommodationFilters, searchQuery)
        applyUnitFilters(unitsData, unitFilters, accomData, searchQuery)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle accommodation filter changes
  const handleAccommodationFilterChange = useCallback(
    (updates: Partial<AccommodationFiltersType>) => {
      const newFilters = { ...accommodationFilters, ...updates }
      setAccommodationFilters(newFilters)
      applyAccommodationFilters(accommodations, units, newFilters, searchQuery)
    },
    [accommodations, units, accommodationFilters, applyAccommodationFilters, searchQuery]
  )

  // Handle unit filter changes
  const handleUnitFilterChange = useCallback(
    (updates: Partial<UnitFiltersType>) => {
      const newFilters = { ...unitFilters, ...updates }
      setUnitFilters(newFilters)
      applyUnitFilters(units, newFilters, accommodations, searchQuery)
    },
    [units, accommodations, unitFilters, applyUnitFilters, searchQuery]
  )

  // Reset accommodation filters
  const resetAccommodationFilters = useCallback(() => {
    const defaults: AccommodationFiltersType = {
      accommodationType: '',
      propertyType: '',
      availability: 'all',
    }
    setAccommodationFilters(defaults)
    applyAccommodationFilters(accommodations, units, defaults, searchQuery)
  }, [accommodations, units, applyAccommodationFilters, searchQuery])

  // Reset unit filters
  const resetUnitFilters = useCallback(() => {
    const defaults: UnitFiltersType = {
      unitType: '',
      furnishingStatus: '',
      availability: 'vacant',
      propertyType: '',
      accommodationType: '',
      accommodationId: '',
    }
    setUnitFilters(defaults)
    applyUnitFilters(units, defaults, accommodations, searchQuery)
  }, [units, accommodations, applyUnitFilters, searchQuery])

  const showPropertyTypeInAccommodations =
    accommodationFilters.accommodationType === 'renting_space' ||
    accommodationFilters.accommodationType === ''

  const handleAccommodationDetailsClick = (accommodation: Accommodation) => {
    // Navigate to detail page or open modal
    console.log('View details for:', accommodation)
  }

  const handleSeeUnitsClick = useCallback((accommodation: Accommodation) => {
    setActiveTab('units')
    setCurrentPage(1)

    const newFilters = { ...unitFilters, accommodationId: accommodation.accommodation_id }
    setUnitFilters(newFilters)
    applyUnitFilters(units, newFilters, accommodations, searchQuery)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [units, accommodations, unitFilters, applyUnitFilters, searchQuery])

  const handleUnitDetailsClick = (unit: Unit) => {
    // Navigate to detail page or open modal
    console.log('View details for:', unit)
  }

  const totalAccommodationsPages = Math.ceil(filteredAccommodations.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalAccommodationsPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedAccommodations = filteredAccommodations.slice(
    startIndex,
    startIndex + pageSize
  );

  const totalUnitsPages = Math.ceil(filteredUnits.length / pageSize) || 1;
  const validCurrentUnitsPage = Math.min(currentPage, totalUnitsPages);
  const startUnitsIndex = (validCurrentUnitsPage - 1) * pageSize;
  const paginatedUnits = filteredUnits.slice(
    startUnitsIndex,
    startUnitsIndex + pageSize
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8D5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#44291B' }}>Search accommodations</h1>
          <p style={{ color: '#44291B' }}>Find your perfect housing option</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by location or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                applyAccommodationFilters(accommodations, units, accommodationFilters, e.target.value)
                applyUnitFilters(units, unitFilters, accommodations, e.target.value)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
              style={{
                color: '#44291B',
                '--tw-ring-color': '#264384',
              } as any}
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => { setActiveTab('accommodations'); setCurrentPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'accommodations'
              ? 'text-white shadow-md'
              : 'border border-gray-200 hover:border-gray-300'
              }`}
            style={{
              backgroundColor: activeTab === 'accommodations' ? '#264384' : '#FDFFF4',
              color: activeTab === 'accommodations' ? 'white' : '#44291B',
            }}
          >
            Accommodations
          </button>
          <button
            onClick={() => { setActiveTab('units'); setCurrentPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'units'
              ? 'text-white shadow-md'
              : 'border border-gray-200 hover:border-gray-300'
              }`}
            style={{
              backgroundColor: activeTab === 'units' ? '#264384' : '#FDFFF4',
              color: activeTab === 'units' ? 'white' : '#44291B',
            }}
          >
            All Units
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'carousel' : 'list')}
            className="px-6 py-3 rounded-lg font-semibold border border-gray-200 hover:border-gray-300 transition shadow-sm"
            style={{
              backgroundColor: viewMode === 'list' ? '#264384' : '#FDFFF4',
              color: viewMode === 'list' ? 'white' : '#44291B',
            }}
          >
            {viewMode === 'list' ? 'Carousel View' : 'List View'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border border-red-200 rounded-lg p-4 mb-8" style={{ backgroundColor: '#F6F8D5', color: '#44291B' }}>
            <p>{error}</p>
          </div>
        )}

        {/* ACCOMMODATIONS TAB */}
        {activeTab === 'accommodations' && (
          <div>
            {/* Filters */}
            <AccommodationFilters
              accommodationType={accommodationFilters.accommodationType}
              propertyType={accommodationFilters.propertyType}
              availability={accommodationFilters.availability}
              onAccommodationTypeChange={(v) =>
                handleAccommodationFilterChange({ accommodationType: v, propertyType: '' })
              }
              onPropertyTypeChange={(v) => handleAccommodationFilterChange({ propertyType: v })}
              onAvailabilityChange={(v) => handleAccommodationFilterChange({ availability: v })}
              onResetFilters={resetAccommodationFilters}
              resultCount={filteredAccommodations.length}
              loading={loading}
              showPropertyType={showPropertyTypeInAccommodations}
            />

            {/* Results Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#44291B' }}>SEARCH RESULTS</h2>
              <p style={{ color: '#44291B' }}>Explore available housing options</p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex gap-4 pb-4 overflow-x-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && accommodations.length === 0 && (
              <div className="text-center py-12 rounded-lg border border-gray-200" style={{ backgroundColor: '#FDFFF4', color: '#44291B' }}>
                <p className="mb-4">No accommodations available at the moment.</p>
              </div>
            )}

            {/* No Results State */}
            {!loading && accommodations.length > 0 && filteredAccommodations.length === 0 && (
              <div className="text-center py-12 rounded-lg border border-gray-200" style={{ backgroundColor: '#FDFFF4', color: '#44291B' }}>
                <p className="mb-4">No accommodations found matching your filters.</p>
                <button
                  onClick={resetAccommodationFilters}
                  className="px-4 py-2 font-medium transition hover:opacity-80"
                  style={{ color: '#264384' }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Carousel or List View */}
            {!loading && filteredAccommodations.length > 0 && (
              viewMode === 'carousel' ? (
                <Carousel>
                  {filteredAccommodations.map((accommodation) => (
                    <AccommodationCard
                      key={accommodation.accommodation_id}
                      accommodation={accommodation}
                      units={units.filter((u) => u.accommodation_id === accommodation.accommodation_id)}
                      onDetailsClick={handleAccommodationDetailsClick}
                    />
                  ))}
                </Carousel>
              ) : (
                <AccommodationListView
                  paginatedAccommodations={paginatedAccommodations}
                  totalPages={totalAccommodationsPages}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  validCurrentPage={validCurrentPage}
                  basePath="/guest/accommodations"
                  onSeeUnitsClick={handleSeeUnitsClick}
                  units={units}
                />
              )
            )}
          </div>
        )}

        {/* UNITS TAB */}
        {activeTab === 'units' && (
          <div>
            {/* Filters */}
            <UnitFilters
              accommodationType={unitFilters.accommodationType}
              unitType={unitFilters.unitType}
              furnishingStatus={unitFilters.furnishingStatus}
              availability={unitFilters.availability}
              propertyType={unitFilters.propertyType}
              onAccommodationTypeChange={(v) => handleUnitFilterChange({ accommodationType: v })}
              onUnitTypeChange={(v) => handleUnitFilterChange({ unitType: v })}
              onFurnishingStatusChange={(v) => handleUnitFilterChange({ furnishingStatus: v })}
              onAvailabilityChange={(v) => handleUnitFilterChange({ availability: v })}
              onPropertyTypeChange={(v) => handleUnitFilterChange({ propertyType: v })}
              onResetFilters={resetUnitFilters}
              resultCount={filteredUnits.length}
              loading={loading}
            />

            {/* Results Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#44291B' }}>SEARCH RESULTS</h2>
              <p style={{ color: '#44291B' }}>Explore available units</p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex gap-4 pb-4 overflow-x-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && units.length === 0 && (
              <div className="text-center py-12 rounded-lg border border-gray-200" style={{ backgroundColor: '#FDFFF4', color: '#44291B' }}>
                <p className="mb-4">No units available at the moment.</p>
              </div>
            )}

            {/* No Results State */}
            {!loading && units.length > 0 && filteredUnits.length === 0 && (
              <div className="text-center py-12 rounded-lg border border-gray-200" style={{ backgroundColor: '#FDFFF4', color: '#44291B' }}>
                <p className="mb-4">No units found matching your filters.</p>
                <button
                  onClick={resetUnitFilters}
                  className="px-4 py-2 font-medium transition hover:opacity-80"
                  style={{ color: '#264384' }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Carousel or List View */}
            {!loading && filteredUnits.length > 0 && (
              viewMode === 'carousel' ? (
                <Carousel>
                  {filteredUnits.map((unit) => {
                    const accommodation = accommodations.find(
                      (a) => a.accommodation_id === unit.accommodation_id
                    )
                    return (
                      <UnitCard
                        key={unit.unit_id}
                        unit={unit}
                        accommodation={accommodation}
                        onDetailsClick={handleUnitDetailsClick}
                      />
                    )
                  })}
                </Carousel>
              ) : (
                <UnitsListView
                  paginatedUnits={paginatedUnits}
                  accommodations={accommodations}
                  totalPages={totalUnitsPages}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  validCurrentPage={validCurrentUnitsPage}
                  basePath="/guest/accommodations"
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
