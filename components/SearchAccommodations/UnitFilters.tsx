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
}: UnitFiltersProps) {
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

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <div className="flex items-end lg:justify-end">
          <ResultsCount count={resultCount} label="units" />
        </div>
      </div>
    </div>
  )
}
