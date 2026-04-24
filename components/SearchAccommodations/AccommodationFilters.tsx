'use client'

import { AccommodationType, PropertyType } from '@/types/accommodation_units'
import { FilterDropdown } from './FilterDropdown'
import { ResultsCount } from './ResultsCount'

interface FilterOption { value: string; label: string }

interface AccommodationFiltersProps {
  accommodationType: AccommodationType | ''
  propertyType: PropertyType | ''
  availability: 'vacant' | 'all'
  sexFilter?: 'female' | 'male' | 'coed' | string
  onAccommodationTypeChange: (value: AccommodationType | '') => void
  onPropertyTypeChange: (value: PropertyType | '') => void
  onAvailabilityChange: (value: 'vacant' | 'all') => void
  onSexFilterChange?: (value: 'female' | 'male' | 'coed' | string) => void
  onResetFilters: () => void
  resultCount: number
  loading?: boolean
  showPropertyType?: boolean
  propertyTypeOptions?: FilterOption[]
  sexOptions?: FilterOption[]
}

export function AccommodationFilters({
  accommodationType,
  propertyType,
  availability,
  sexFilter = '',
  onAccommodationTypeChange,
  onPropertyTypeChange,
  onAvailabilityChange,
  onSexFilterChange,
  onResetFilters,
  resultCount,
  loading = false,
  showPropertyType = true,
  propertyTypeOptions = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'boarding', label: 'Boarding House' },
    { value: 'transient', label: 'Transient' },
    { value: 'house', label: 'House' },
  ],
  sexOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'coed', label: 'Coed' },
  ],
}: AccommodationFiltersProps) {
  return (
    <div className="rounded-xl shadow-sm border border-gray-200 p-5 mb-8" style={{ backgroundColor: '#FDFFF4' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: '#44291B' }}>Filters</h2>
        <button
          onClick={onResetFilters}
          className="text-sm font-medium transition hover:opacity-80"
          style={{ color: '#264384' }}
        >
          Reset Filters
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <FilterDropdown
            label="Accommodation Type"
            value={accommodationType}
            onChange={(v) => onAccommodationTypeChange(v as AccommodationType | '')}
            disabled={loading}
            options={[
              { value: 'dormitory', label: 'Dormitory' },
              { value: 'renting_space', label: 'Renting Space' },
            ]}
          />

          {showPropertyType && (
            <FilterDropdown
              label="Property Type"
              value={propertyType}
              onChange={(v) => onPropertyTypeChange(v as PropertyType | '')}
              disabled={loading}
              options={propertyTypeOptions}
            />
          )}

          <FilterDropdown
            label="Availability"
            value={availability}
            onChange={(v) => onAvailabilityChange(v as 'vacant' | 'all')}
            disabled={loading}
            options={[
              { value: 'vacant', label: 'With Vacant Slots' },
              { value: 'all', label: 'All Accommodations' },
            ]}
          />

          {onSexFilterChange && (
            <FilterDropdown
              label="Sex Options"
              value={sexFilter}
              onChange={(v) => onSexFilterChange(v)}
              disabled={loading}
              options={sexOptions}
            />
          )}

          <div className="flex items-end h-[68px]">
            <ResultsCount count={resultCount} label="accommodations" />
          </div>
        </div>
      </div>
    </div>
  )
}
