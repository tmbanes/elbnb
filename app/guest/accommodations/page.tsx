'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
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
import { useSearchParams, useRouter } from 'next/navigation'
import { ViewAccommodation, ViewUnit } from '@/components/SearchAccommodations'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Archivo_Black } from 'next/font/google'

const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400' })

type TabType = 'accommodations' | 'units'

interface AccommodationFiltersType {
  accommodationType: AccommodationType | ''
  propertyType: PropertyType | ''
  availability: 'vacant' | 'all'
  sexFilter?: 'female' | 'male' | 'coed' | string
  minPrice: number | ''
  maxPrice: number | ''
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
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F8D5] flex items-center justify-center font-black text-[#264384] animate-pulse">LOADING ELBNB SEARCH...</div>}>
      <SearchAccommodationsContent />
    </Suspense>
  )
}

function SearchAccommodationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) || 'accommodations'
  const initialAccommodationId = searchParams.get('accommodationId') || ''

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Data states
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [filteredAccommodations, setFilteredAccommodations] = useState<Accommodation[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([])
  const [hasThreeApplications, setHasThreeApplications] = useState<boolean>(false)

  // Filter states
  const [accommodationFilters, setAccommodationFilters] = useState<AccommodationFiltersType>({
    accommodationType: '',
    propertyType: '',
    availability: 'all',
    sexFilter: '',
    minPrice: '',
    maxPrice: '',
  })

  const [unitFilters, setUnitFilters] = useState<UnitFiltersType>({
    unitType: '',
    furnishingStatus: '',
    availability: 'vacant',
    propertyType: '',
    accommodationType: 'renting_space',
    accommodationId: initialAccommodationId,
  })
  const [sortBy, setSortBy] = useState<string>('')

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

  // Detail view state
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [accommodationUnits, setAccommodationUnits] = useState<Unit[]>([])
  const [isFetchingAccommodationUnits, setIsFetchingAccommodationUnits] = useState(false)
  const [isViewingUnit, setIsViewingUnit] = useState(false)
  const [unitViewSource, setUnitViewSource] = useState<'accommodation' | 'search'>('accommodation')

  // Dynamic filter options based on fetched data
  const dynamicPropertyTypes = useMemo(() => {
    const types = new Set(accommodations.map(a => a.property_type).filter(Boolean));
    if (types.size === 0) return [
      { value: 'apartment', label: 'Apartment' },
      { value: 'boarding', label: 'Boarding House' },
      { value: 'transient', label: 'Transient' },
      { value: 'house', label: 'House' },
    ];
    return Array.from(types).map(type => ({
      value: type as string,
      label: (type as string).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }));
  }, [accommodations]);

  const dynamicSexOptions = useMemo(() => {
    const sexes = new Set(accommodations.map(a => (a as any).accomm_sex).filter(Boolean));
    if (sexes.size === 0) return [
      { value: 'F', label: 'Female' },
      { value: 'M', label: 'Male' },
      { value: 'COED', label: 'Coed' },
    ];
    const sexLabels: Record<string, string> = {
      'F': 'Female', 'M': 'Male', 'COED': 'Coed',
      'female': 'Female', 'male': 'Male', 'coed': 'Coed'
    };
    return Array.from(sexes).map(sex => {
      const sexStr = sex as string;
      const upperSex = sexStr.toUpperCase();
      const label = sexLabels[upperSex] || sexLabels[sexStr] || (sexStr.charAt(0).toUpperCase() + sexStr.slice(1).toLowerCase());
      return { value: sexStr, label };
    });
  }, [accommodations]);

  const normalizeSexValue = (value?: string | null) => {
    const sex = value?.toLowerCase()

    if (sex === 'f' || sex === 'female') return 'female'
    if (sex === 'm' || sex === 'male') return 'male'
    if (sex === 'coed') return 'coed'

    return sex ?? ''
  }

  // Apply accommodation filters
  const applyAccommodationFilters = useCallback(
    (list: Accommodation[], allUnits: Unit[], filters: AccommodationFiltersType, search: string = '') => {
      let filtered = list

      if (filters.accommodationType) {
        filtered = filtered.filter((a) => a.accommodation_type === filters.accommodationType)
      }

      if (filters.propertyType) {
        filtered = filtered.filter(
          (a) => a.property_type?.toLowerCase() === filters.propertyType.toLowerCase()
        )
      }

      if (filters.sexFilter) {
        const selectedSex = normalizeSexValue(filters.sexFilter)

        filtered = filtered.filter((a) => {
          const dormSex = normalizeSexValue((a as any).accomm_sex)

          if (selectedSex === 'male' || selectedSex === 'female') {
            return dormSex === selectedSex || dormSex === 'coed'
          }

          return dormSex === selectedSex
        })
      }

      if (filters.minPrice !== '') {
        filtered = filtered.filter((a) => (a as any).min_price !== undefined && (a as any).min_price !== null && (a as any).min_price >= filters.minPrice)
      }

      if (filters.maxPrice !== '') {
        filtered = filtered.filter((a) => (a as any).min_price !== undefined && (a as any).min_price !== null && (a as any).min_price <= filters.maxPrice)
      }

      if (filters.availability === 'vacant') {
        const accomIdsWithVacancy = new Set(
          allUnits
            .filter((u) => u.current_occupancy < u.max_occupancy)
            .map((u) => u.accommodation_id)
        )
        filtered = filtered.filter((a) => accomIdsWithVacancy.has(a.accommodation_id))
      }

      if (search.trim()) {
        const query = search.toLowerCase()
        filtered = filtered.filter((a) =>
          a.name.toLowerCase().includes(query) || a.location.toLowerCase().includes(query)
        )
      }

      // Sorting logic
      const sorted = [...filtered]
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isDormOpen = (a: Accommodation) => {
        if (!a.allowed_application) return false;
        const deadline = new Date(a.allowed_application);
        deadline.setHours(23, 59, 59, 999);
        return today <= deadline;
      };

      if (sortBy === '' || sortBy === 'open-first') {
        sorted.sort((a, b) => {
          const aOpen = isDormOpen(a);
          const bOpen = isDormOpen(b);
          if (aOpen === bOpen) return a.name.localeCompare(b.name);
          return aOpen ? -1 : 1;
        });
      } else if (sortBy === 'price-asc') {
        sorted.sort((a, b) => ((a as any).min_price || 0) - ((b as any).min_price || 0))
      } else if (sortBy === 'price-desc') {
        sorted.sort((a, b) => ((b as any).min_price || 0) - ((a as any).min_price || 0))
      } else if (sortBy === 'name-asc') {
        sorted.sort((a, b) => a.name.localeCompare(b.name))
      } else if (sortBy === 'name-desc') {
        sorted.sort((a, b) => b.name.localeCompare(a.name))
      }

      setFilteredAccommodations(sorted)
      setCurrentPage(1)
    },
    [sortBy]
  )

  // Apply unit filters
  const applyUnitFilters = useCallback(
    (list: Unit[], filters: UnitFiltersType, accomList: Accommodation[], search: string = '') => {
      // Only show units that belong to renting spaces
      let filtered = list.filter((u) => {
        const accom = accomList.find((a) => a.accommodation_id === u.accommodation_id)
        return accom?.accommodation_type === 'renting_space'
      })

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

      // Sorting logic
      const sorted = [...filtered]
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isDormOpen = (a: Accommodation) => {
        if (!a.allowed_application) return false;
        const deadline = new Date(a.allowed_application);
        deadline.setHours(23, 59, 59, 999);
        return today <= deadline;
      };

      if (sortBy === '' || sortBy === 'open-first') {
        sorted.sort((a, b) => {
          const aDorm = accomList.find(acc => acc.accommodation_id === a.accommodation_id);
          const bDorm = accomList.find(acc => acc.accommodation_id === b.accommodation_id);
          const aOpen = aDorm ? isDormOpen(aDorm) : false;
          const bOpen = bDorm ? isDormOpen(bDorm) : false;
          if (aOpen === bOpen) return String(a.unit_number || '').localeCompare(String(b.unit_number || ''));
          return aOpen ? -1 : 1;
        });
      } else if (sortBy === 'price-asc') {
        sorted.sort((a, b) => (a.rental_fee || 0) - (b.rental_fee || 0))
      } else if (sortBy === 'price-desc') {
        sorted.sort((a, b) => (b.rental_fee || 0) - (a.rental_fee || 0))
      } else if (sortBy === 'name-asc') {
        sorted.sort((a, b) => String(a.unit_number || '').localeCompare(String(b.unit_number || '')))
      } else if (sortBy === 'vacant-desc') {
        sorted.sort((a, b) => ((b.max_occupancy - b.current_occupancy) || 0) - ((a.max_occupancy - a.current_occupancy) || 0))
      }

      setFilteredUnits(sorted)
      setCurrentPage(1)
    },
    [sortBy]
  )

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [accomRes, unitsRes, appsRes] = await Promise.all([
          fetch('/api/shared/dashboard/tiles?type=accommodations'),
          fetch('/api/shared/dashboard/tiles?type=units'),
          fetch('/api/applications'),
        ])

        if (!accomRes.ok) throw new Error('Failed to fetch accommodations')
        if (!unitsRes.ok) throw new Error('Failed to fetch units')

        const accomData: Accommodation[] = await accomRes.json()
        const unitsData: Unit[] = await unitsRes.json()

        if (appsRes.ok) {
          const appsData = await appsRes.json()
          const sentCount = appsData.data.filter(
            (app: any) => app.application_status !== 'cancelled' && app.application_status !== 'rejected'
          ).length
          setHasThreeApplications(sentCount >= 3)
        }

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
      sexFilter: '',
      minPrice: '',
      maxPrice: '',
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


  const handleAccommodationDetailsClick = async (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    setIsViewingUnit(false)
    setUnitViewSource('accommodation')
    setSelectedUnit(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Fetch all units for this accommodation to show real data
    setIsFetchingAccommodationUnits(true)
    try {
      const res = await fetch(`/api/shared/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodation.accommodation_id}`)
      if (res.ok) {
        const data = await res.json()
        setAccommodationUnits(data)
      }
    } catch (err) {
      console.error('Failed to fetch accommodation units:', err)
      setAccommodationUnits([])
    } finally {
      setIsFetchingAccommodationUnits(false)
    }
  }

  const handleSeeUnitsClick = useCallback((accommodation: Accommodation) => {
    setActiveTab('units')
    setCurrentPage(1)

    const newFilters = { ...unitFilters, accommodationId: accommodation.accommodation_id }
    setUnitFilters(newFilters)
    applyUnitFilters(units, newFilters, accommodations, searchQuery)

    // No scroll to top on see units click
  }, [units, accommodations, unitFilters, applyUnitFilters, searchQuery])

  useEffect(() => {
    applyAccommodationFilters(accommodations, units, accommodationFilters, searchQuery)
  }, [accommodations, units, accommodationFilters, applyAccommodationFilters, searchQuery])

  useEffect(() => {
    applyUnitFilters(units, unitFilters, accommodations, searchQuery)
  }, [units, accommodations, unitFilters, applyUnitFilters, searchQuery])

  const handleUnitDetailsClick = async (unit: Unit) => {
    const accommodation = accommodations.find(a => a.accommodation_id === unit.accommodation_id)
    if (accommodation) {
      setSelectedAccommodation(accommodation)
      setSelectedUnit(unit)
      setIsViewingUnit(true)
      setUnitViewSource('search')
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Also fetch units context if needed
      try {
        const res = await fetch(`/api/shared/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodation.accommodation_id}`)
        if (res.ok) {
          const data = await res.json()
          setAccommodationUnits(data)
        }
      } catch (err) {
        console.error('Failed to fetch accommodation units:', err)
      }
    }
  }

  const totalAccommodationsPages = Math.ceil(filteredAccommodations.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalAccommodationsPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const groupedUnits = useMemo(() => {
    const counts: Record<string, number> = {}
    const seen = new Set()
    
    // Count units with vacancy for each type within an accommodation
    filteredUnits.forEach(u => {
      if (u.current_occupancy < u.max_occupancy) {
        const key = `${u.accommodation_id}-${u.unit_type}`
        counts[key] = (counts[key] || 0) + 1
      }
    })

    return filteredUnits.filter((unit) => {
      const key = `${unit.accommodation_id}-${unit.unit_type}`
      if (seen.has(key)) return false
      seen.add(key)
      // Attach the count to the unit object
      ;(unit as any).available_units_count = counts[key] || 0
      return true
    })
  }, [filteredUnits])

  const totalUnitsPages = Math.ceil(groupedUnits.length / pageSize) || 1;
  const validCurrentUnitsPage = Math.min(currentPage, totalUnitsPages);
  const startUnitsIndex = (validCurrentUnitsPage - 1) * pageSize;
  const paginatedUnits = groupedUnits.slice(
    startUnitsIndex,
    startUnitsIndex + pageSize
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8D5' }}>
      {selectedAccommodation ? (
        isViewingUnit && selectedUnit ? (
          <ViewUnit 
            accommodation={selectedAccommodation}
            unit={selectedUnit}
            onBack={() => {
                if (unitViewSource === 'accommodation') {
                    setIsViewingUnit(false)
                } else {
                    setSelectedAccommodation(null)
                    setIsViewingUnit(false)
                }
            }}
            onApply={() => {
                window.location.href = `/guest/accommodations/application?accommodationId=${selectedAccommodation.accommodation_id}&unitId=${selectedUnit.unit_id}`
            }}
            hasThreeApplications={hasThreeApplications}
          />
        ) : (
          <ViewAccommodation 
            accommodation={selectedAccommodation}
            units={accommodationUnits}
            userRole="guest"
            isFetchingUnits={isFetchingAccommodationUnits}
            onUnitTypeClick={(unit) => {
                setSelectedUnit(unit)
                setIsViewingUnit(true)
                setUnitViewSource('accommodation')
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onBack={() => setSelectedAccommodation(null)}
            onApply={() => {
                window.location.href = `/guest/accommodations/application?accommodationId=${selectedAccommodation.accommodation_id}`
            }}
            hasThreeApplications={hasThreeApplications}
          />
        )
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/guest/dashboard")}
            className="flex items-center gap-2 text-[#44291B]/60 hover:text-[#44291B] hover:bg-[#F6F8D5] -ml-2 mb-2 transition-all group w-fit"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
          </Button>
          <h1 className={`${archivoBlack.className} text-3xl sm:text-4xl font-bold mb-2`} style={{ color: '#44291B' }}>Search accommodations</h1>
          <p style={{ color: '#44291B' }}>Find your perfect housing option</p>
        </div>

        {/* Top Controls: Search Bar (Left) + View/Tab Options (Right) */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          {/* Search Bar - Left Side */}
          <div className="w-full md:max-w-lg">
            <div className="relative group">
              {/* Search Icon */}
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg 
                  className="w-5 h-5 text-gray-400 group-focus-within:text-[#264384] transition-colors duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2.5" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>

              <input
                type="text"
                placeholder="Search by location, name, or type..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  applyAccommodationFilters(accommodations, units, accommodationFilters, e.target.value)
                  applyUnitFilters(units, unitFilters, accommodations, e.target.value)
                }}
                className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:shadow-[0_8px_30px_rgb(38,67,132,0.08)] focus:border-[#264384]/30 focus:ring-4 focus:ring-[#264384]/5 transition-all duration-300 outline-none text-[#44291B] font-semibold placeholder:text-gray-400 placeholder:font-normal"
                style={{ backgroundColor: '#FDFFF4' }}
              />

              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    applyAccommodationFilters(accommodations, units, accommodationFilters, '')
                    applyUnitFilters(units, unitFilters, accommodations, '')
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#264384] transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation - Right Side */}
          <div className="flex flex-wrap gap-3 justify-start md:justify-end w-full md:w-auto">
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
          </div>
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
              sexFilter={accommodationFilters.sexFilter}
              minPrice={accommodationFilters.minPrice}
              maxPrice={accommodationFilters.maxPrice}
              onAccommodationTypeChange={(v) =>
                handleAccommodationFilterChange({ accommodationType: v, propertyType: '' })
              }
              onPropertyTypeChange={(v) => handleAccommodationFilterChange({ propertyType: v })}
              onAvailabilityChange={(v) => handleAccommodationFilterChange({ availability: v })}
              onSexFilterChange={(v) => handleAccommodationFilterChange({ sexFilter: v })}
              onMinPriceChange={(v) => handleAccommodationFilterChange({ minPrice: v })}
              onMaxPriceChange={(v) => handleAccommodationFilterChange({ maxPrice: v })}
              onResetFilters={resetAccommodationFilters}
              resultCount={filteredAccommodations.length}
              loading={loading}
              propertyTypeOptions={dynamicPropertyTypes}
              sexOptions={dynamicSexOptions}
              sortBy={sortBy}
              onSortByChange={setSortBy}
            />

            {/* Results Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#44291B' }}>SEARCH RESULTS</h2>
                <p className="text-sm" style={{ color: '#44291B' }}>Explore available accommodations</p>
              </div>

              {/* View Mode Toggle Switch */}
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'carousel' : 'list')}
                className="relative inline-flex items-center rounded-full p-1.5 w-52 h-11 focus:outline-none shadow-inner transition-all duration-300 bg-gray-200/80 hover:bg-gray-200"
                aria-label="Toggle View Mode"
              >
                {/* Background labels */}
                <div className="absolute inset-0 flex justify-between items-center px-2 text-[10px] font-bold text-gray-400 pointer-events-none">
                  <span className="w-1/2 text-center uppercase tracking-tight">Carousel</span>
                  <span className="w-1/2 text-center uppercase tracking-tight">List</span>
                </div>
                
                {/* Sliding Thumb */}
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm border border-gray-100 transition-transform duration-300 ease-out flex items-center justify-center z-10 ${
                    viewMode === 'list' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                >
                  <span className="font-black text-[10px] tracking-wider" style={{ color: '#264384' }}>
                    {viewMode === 'list' ? 'LIST' : 'CAROUSEL'}
                  </span>
                </div>
              </button>
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
              <div key={`accom-${viewMode}-${JSON.stringify(accommodationFilters)}-${sortBy}`}>
                {viewMode === 'carousel' ? (
                  <Carousel>
                    {filteredAccommodations.map((accommodation, index) => (
                      <div key={accommodation.accommodation_id} style={{ animation: 'pageSlideIn 0.3s ease-out both', animationDelay: `${index * 0.05}s` }}>
                          <AccommodationCard
                            accommodation={accommodation}
                            units={units.filter((u) => u.accommodation_id === accommodation.accommodation_id)}
                            onDetailsClick={handleAccommodationDetailsClick}
                            onSeeUnitsClick={handleSeeUnitsClick}
                            basePath="/guest/accommodations"
                            userRole="guest"
                            hasThreeApplications={hasThreeApplications}
                          />
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <AccommodationListView
                    paginatedAccommodations={filteredAccommodations}
                    totalPages={totalAccommodationsPages}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    validCurrentPage={validCurrentPage}
                    basePath="/guest/accommodations"
                    onSeeUnitsClick={handleSeeUnitsClick}
                    units={units}
                    userRole="guest"
                    onDetailsClick={handleAccommodationDetailsClick}
                    hasThreeApplications={hasThreeApplications}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* UNITS TAB */}
        {activeTab === 'units' && (
          <div className="animate-in fade-in duration-500">
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
              propertyTypeOptions={dynamicPropertyTypes}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              userRole="guest"
            />

            {/* Results Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#44291B' }}>SEARCH RESULTS</h2>
                <p className="text-sm" style={{ color: '#44291B' }}>Explore available units</p>
                {unitFilters.accommodationId && (
                  <div className="mt-4 flex items-center gap-3 py-1.5 px-3 bg-[#264384]/5 rounded-xl border border-[#264384]/10 w-fit animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#264384] animate-pulse" />
                    <p className="text-[10px] font-black text-[#44291B] uppercase tracking-widest">
                      Showing units for <span className="text-[#264384] ml-1">{accommodations.find(a => a.accommodation_id === unitFilters.accommodationId)?.name || 'Accommodation'}</span>
                    </p>
                    <div className="flex items-center gap-2 ml-2 border-l border-[#264384]/10 pl-2">
                      <button
                        onClick={() => {
                          handleUnitFilterChange({ accommodationId: '' });
                        }}
                        className="flex items-center gap-1 text-[10px] font-black text-[#264384] uppercase tracking-widest hover:underline transition-all opacity-60 hover:opacity-100"
                      >
                        Clear
                      </button>
                      <div className="w-1 h-1 rounded-full bg-[#264384]/20" />
                      <button
                        onClick={() => {
                          setActiveTab('accommodations');
                        }}
                        className="flex items-center gap-1 text-[10px] font-black text-[#264384] uppercase tracking-widest hover:underline transition-all opacity-60 hover:opacity-100"
                      >
                        Back to Accommodations
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* View Mode Toggle Switch */}
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'carousel' : 'list')}
                className="relative inline-flex items-center rounded-full p-1.5 w-52 h-11 focus:outline-none shadow-inner transition-all duration-300 bg-gray-200/80 hover:bg-gray-200"
                aria-label="Toggle View Mode"
              >
                {/* Background labels */}
                <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-bold text-gray-400 pointer-events-none">
                  <span className="w-1/2 text-center uppercase tracking-wide">Carousel</span>
                  <span className="w-1/2 text-center uppercase tracking-wide">List</span>
                </div>
                
                {/* Sliding Thumb */}
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm border border-gray-100 transition-transform duration-300 ease-out flex items-center justify-center z-10 ${
                    viewMode === 'list' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                >
                  <span className="font-black text-xs tracking-wider" style={{ color: '#264384' }}>
                    {viewMode === 'list' ? 'LIST' : 'CAROUSEL'}
                  </span>
                </div>
              </button>
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
              <div key={`unit-${viewMode}-${JSON.stringify(unitFilters)}-${sortBy}`}>
                {viewMode === 'carousel' ? (
                  <Carousel>
                    {groupedUnits.map((unit, index) => {
                      const accommodation = accommodations.find(
                        (a) => a.accommodation_id === unit.accommodation_id
                      )
                      return (
                        <div key={unit.unit_id} style={{ animation: 'pageSlideIn 0.3s ease-out both', animationDelay: `${index * 0.05}s` }}>
                          <UnitCard
                            unit={unit}
                            accommodation={accommodation}
                            onDetailsClick={handleUnitDetailsClick}
                            userRole="guest"
                            hasThreeApplications={hasThreeApplications}
                          />
                        </div>
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
                    onDetailsClick={handleUnitDetailsClick}
                    hasThreeApplications={hasThreeApplications}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  )
}