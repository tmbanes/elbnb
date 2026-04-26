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
  sortBy: string
  onSortByChange: (value: string) => void
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
  propertyTypeOptions = [],
  sexOptions = [],
  sortBy,
  onSortByChange,
}: AccommodationFiltersProps) {
  return (

    <div className="rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 px-6 py-5 mb-10 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]" style={{ backgroundColor: '#FDFFF4' }}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        
        {/* Filters Group */}
        <div className="flex-1 flex flex-wrap items-center gap-4 md:gap-6">
          
          {/* Accommodation Type */}
          <div className="flex-shrink-0 min-w-[180px]">
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
            <div className="flex-shrink-0 min-w-[150px]">
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
          <div className="flex-shrink-0 min-w-[170px]">
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
            <div className="flex-shrink-0 min-w-[130px]">
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
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider ml-1 opacity-60" style={{ color: '#44291B' }}>Price Range</label>
              <div className="flex items-center gap-1.5">
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => onMinPriceChange(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading}
                    className="w-24 px-4 py-3 text-sm font-semibold shadow-sm transition-all border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#264384]/5 focus:border-[#264384] bg-white/50 disabled:opacity-50"
                    style={{ color: '#44291B' }}
                  />
                </div>
                <span className="text-gray-300 font-bold">–</span>
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => onMaxPriceChange(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading}
                    className="w-24 px-4 py-3 text-sm font-semibold shadow-sm transition-all border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#264384]/5 focus:border-[#264384] bg-white/50 disabled:opacity-50"
                    style={{ color: '#44291B' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sort By */}
          <div className="flex-shrink-0 min-w-[160px] md:ml-auto">
            <FilterDropdown
              label="Sort By"
              value={sortBy}
              onChange={(v) => onSortByChange(v)}
              disabled={loading}
              options={[
                { value: 'name-asc', label: 'Name (A-Z)' },
                { value: 'name-desc', label: 'Name (Z-A)' },
                { value: 'price-asc', label: 'Price (Lowest)' },
                { value: 'price-desc', label: 'Price (Highest)' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100/50">
        <ResultsCount count={resultCount} label="accommodations" />
        
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

