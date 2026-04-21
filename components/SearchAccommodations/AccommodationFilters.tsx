'use client'

import { AccommodationType, PropertyType } from '@/types/accommodation_units'
import { FilterDropdown } from './FilterDropdown'
import { ResultsCount } from './ResultsCount'

interface AccommodationFiltersProps {
  accommodationType: AccommodationType | ''
  propertyType: PropertyType | ''
  availability: 'vacant' | 'all'
  onAccommodationTypeChange: (value: AccommodationType | '') => void
  onPropertyTypeChange: (value: PropertyType | '') => void
  onAvailabilityChange: (value: 'vacant' | 'all') => void
  onResetFilters: () => void
  resultCount: number
  loading?: boolean
  showPropertyType?: boolean
}

export function AccommodationFilters({
  accommodationType,
  propertyType,
  availability,
  onAccommodationTypeChange,
  onPropertyTypeChange,
  onAvailabilityChange,
  onResetFilters,
  resultCount,
  loading = false,
  showPropertyType = true,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            options={[
              { value: 'apartment', label: 'Apartment' },
              { value: 'boarding', label: 'Boarding House' },
              { value: 'transient', label: 'Transient' },
              { value: 'house', label: 'House' },
            ]}
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

        <div className="flex items-end">
          <ResultsCount count={resultCount} label="accommodations" />
        </div>
      </div>
    </div>
  )
}
