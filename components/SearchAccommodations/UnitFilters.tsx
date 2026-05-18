'use client'

import { AccommodationType, PropertyType, FurnishingStatus, UnitType } from '@/types/accommodation_units'
import { FilterDropdown } from './FilterDropdown'
import { ResultsCount } from './ResultsCount'

interface UnitFiltersProps {
  accommodationType: AccommodationType | ''
  unitType: UnitType | ''
  furnishingStatus: FurnishingStatus | ''
  availability: 'vacant' | 'all'
  propertyType: PropertyType | ''
  onAccommodationTypeChange: (value: AccommodationType | '') => void
  onUnitTypeChange: (value: UnitType | '') => void
  onFurnishingStatusChange: (value: FurnishingStatus | '') => void
  onAvailabilityChange: (value: 'vacant' | 'all') => void
  onPropertyTypeChange: (value: PropertyType | '') => void
  onResetFilters: () => void
  resultCount: number
  loading?: boolean
  propertyTypeOptions?: { value: string; label: string }[]
  sortBy: string
  onSortByChange: (value: string) => void
  userRole?: string
}

export function UnitFilters({
  accommodationType,
  unitType,
  furnishingStatus,
  availability,
  propertyType,
  onAccommodationTypeChange,
  onUnitTypeChange,
  onFurnishingStatusChange,
  onAvailabilityChange,
  onPropertyTypeChange,
  onResetFilters,
  resultCount,
  loading = false,
  propertyTypeOptions = [],
  sortBy,
  onSortByChange,
  userRole = 'guest',
}: UnitFiltersProps) {
  return (
    <div className="rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 px-4 md:px-6 py-5 mb-10 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]" style={{ backgroundColor: '#FDFFF4' }}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        
        {/* Filters Group */}
        <div className="flex-1 flex flex-wrap items-center gap-4 md:gap-6">
          
          {/* Unit Type */}
          <div className="flex-shrink-0 min-w-[140px]">
            <FilterDropdown
              label="Unit Type"
              value={unitType}
              onChange={(v) => onUnitTypeChange(v as UnitType | '')}
              disabled={loading}
              options={[
                { value: 'room', label: 'Room' },
                { value: 'bedspace', label: 'Bedspace' },
                { value: 'wholeunit', label: 'Whole Unit' },
              ]}
            />
          </div>

          {/* Furnishing Status */}
          {userRole !== 'guest' && (
            <div className="flex-shrink-0 min-w-[160px]">
              <FilterDropdown
                label="Furnishing Status"
                value={furnishingStatus}
                onChange={(v) => onFurnishingStatusChange(v as FurnishingStatus | '')}
                disabled={loading}
                options={[
                  { value: 'furnished', label: 'Furnished' },
                  { value: 'semi-furnished', label: 'Semi-Furnished' },
                  { value: 'unfurnished', label: 'Unfurnished' },
                ]}
              />
            </div>
          )}

          {/* Availability */}
          <div className="flex-shrink-0 min-w-[170px]">
            <FilterDropdown
              label="Availability"
              value={availability}
              onChange={(v) => onAvailabilityChange(v as 'vacant' | 'all')}
              disabled={loading}
              options={[
                { value: 'vacant', label: 'With Vacant Slots' },
                { value: 'all', label: 'All Units' },
              ]}
            />
          </div>

          {/* Property Type */}
          <div className="flex-shrink-0 min-w-[150px]">
            <FilterDropdown
              label="Property Type"
              value={propertyType}
              onChange={(v) => onPropertyTypeChange(v as PropertyType | '')}
              disabled={loading}
              options={propertyTypeOptions}
            />
          </div>

          {/* Sort By */}
          <div className="flex-shrink-0 min-w-[160px] md:ml-auto">
            <FilterDropdown
              label="Sort By"
              value={sortBy}
              onChange={(v) => onSortByChange(v)}
              disabled={loading}
              options={[
                { value: 'name-asc', label: 'Name (A-Z)' },
                { value: 'price-asc', label: 'Price (Lowest)' },
                { value: 'price-desc', label: 'Price (Highest)' },
                { value: 'vacant-desc', label: 'Most Vacancy' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100/50">
        <ResultsCount count={resultCount} label="units" />
        
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:bg-gray-200/50 active:scale-95 group"
          style={{ color: '#264384' }}
        >
          <svg 
            className="w-3.5 h-3.5 transition-transform group-hover:rotate-[-45deg]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Filters
        </button>
      </div>

      </div>
  )
}
