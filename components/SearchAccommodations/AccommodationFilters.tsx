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
    { value: 'F', label: 'Female' },
    { value: 'M', label: 'Male' },
    { value: 'COED', label: 'Coed' },
  ],
}: AccommodationFiltersProps) {
  return (
    <div className="rounded-xl shadow-sm border border-gray-200 px-5 py-4 mb-8" style={{ backgroundColor: '#FDFFF4' }}>
      <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>

        {/* Accommodation Type */}
        <div className="flex-shrink-0 min-w-[150px]">
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
        </div>

        {/* Property Type */}
        {showPropertyType && (
          <div className="flex-shrink-0 min-w-[140px]">
            <FilterDropdown
              label="Property Type"
              value={propertyType}
              onChange={(v) => onPropertyTypeChange(v as PropertyType | '')}
              disabled={loading}
              options={propertyTypeOptions}
            />
          </div>
        )}

        {/* Availability */}
        <div className="flex-shrink-0 min-w-[150px]">
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
        </div>

        {/* Sex Options */}
        {onSexFilterChange && (
          <div className="flex-shrink-0 min-w-[120px]">
            <FilterDropdown
              label="Sex Options"
              value={sexFilter}
              onChange={(v) => onSexFilterChange(v)}
              disabled={loading}
              options={sexOptions}
            />
          </div>
        )}

        {/* Price Range */}
        {onMinPriceChange && onMaxPriceChange && (
          <div className="flex-shrink-0 flex flex-col gap-1.5">
            <label className="text-sm font-semibold whitespace-nowrap" style={{ color: '#44291B' }}>Price Range</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value ? Number(e.target.value) : '')}
                disabled={loading}
                className="w-24 h-[42px] px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{ backgroundColor: '#FDFFF4', color: '#44291B', '--tw-ring-color': '#264384' } as any}
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value ? Number(e.target.value) : '')}
                disabled={loading}
                className="w-24 h-[42px] px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{ backgroundColor: '#FDFFF4', color: '#44291B', '--tw-ring-color': '#264384' } as any}
              />
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Results + Reset */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1 self-end pb-0.5">
          <ResultsCount count={resultCount} label="accommodations" />
          <button
            onClick={onResetFilters}
            className="text-xs font-medium transition hover:opacity-80 whitespace-nowrap"
            style={{ color: '#264384' }}
          >
            Reset Filters
          </button>
        </div>

      </div>
    </div>
  )
}

