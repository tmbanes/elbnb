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
  minPrice?: number | ''
  maxPrice?: number | ''
  onAccommodationTypeChange: (value: AccommodationType | '') => void
  onPropertyTypeChange: (value: PropertyType | '') => void
  onAvailabilityChange: (value: 'vacant' | 'all') => void
  onSexFilterChange?: (value: 'female' | 'male' | 'coed' | string) => void
  onMinPriceChange?: (value: number | '') => void
  onMaxPriceChange?: (value: number | '') => void
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
  minPrice = '',
  maxPrice = '',
  onAccommodationTypeChange,
  onPropertyTypeChange,
  onAvailabilityChange,
  onSexFilterChange,
  onMinPriceChange,
  onMaxPriceChange,
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

          {onMinPriceChange && onMaxPriceChange && (
            <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <label className="text-sm font-semibold" style={{ color: '#44291B' }}>Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value ? Number(e.target.value) : '')}
                  disabled={loading}
                  className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{ backgroundColor: '#FDFFF4', color: '#44291B', '--tw-ring-color': '#264384' } as any}
                />
                <span style={{ color: '#44291B' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value ? Number(e.target.value) : '')}
                  disabled={loading}
                  className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{ backgroundColor: '#FDFFF4', color: '#44291B', '--tw-ring-color': '#264384' } as any}
                />
              </div>
            </div>
          )}

          <div className="flex items-end h-[68px]">
            <ResultsCount count={resultCount} label="accommodations" />
          </div>
        </div>
      </div>
    </div>
  )
}
