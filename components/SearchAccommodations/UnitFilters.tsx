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
  propertyTypeOptions = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'boarding', label: 'Boarding House' },
    { value: 'transient', label: 'Transient' },
    { value: 'house', label: 'House' },
  ],
}: UnitFiltersProps) {
  return (
    <div className="rounded-xl shadow-sm border border-gray-200 px-5 py-4 mb-8" style={{ backgroundColor: '#FDFFF4' }}>
      <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>

        {/* Accommodation Type */}
        <div className="flex-shrink-0 min-w-[160px]">
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

        {/* Unit Type */}
        <div className="flex-shrink-0 min-w-[130px]">
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
        <div className="flex-shrink-0 min-w-[150px]">
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

        {/* Availability */}
        <div className="flex-shrink-0 min-w-[150px]">
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
        <div className="flex-shrink-0 min-w-[140px]">
          <FilterDropdown
            label="Property Type"
            value={propertyType}
            onChange={(v) => onPropertyTypeChange(v as PropertyType | '')}
            disabled={loading}
            options={propertyTypeOptions}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Results + Reset */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1 self-end pb-0.5">
          <ResultsCount count={resultCount} label="units" />
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
