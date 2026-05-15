'use client'

import React, { useMemo } from 'react'
import { Accommodation, Unit } from '@/types/accommodation_units'

interface ViewAccommodationProps {
  accommodation: Accommodation
  units: Unit[]
  onBack: () => void
  onApply?: () => void
  onUnitTypeClick?: (unit: Unit) => void
  userRole?: 'student' | 'guest'
  isFetchingUnits?: boolean
}

export const ViewAccommodation: React.FC<ViewAccommodationProps> = ({
  accommodation,
  units,
  onBack,
  onApply,
  onUnitTypeClick,
  userRole = 'student',
  isFetchingUnits = false,
}) => {
  // Use the first unit's type as the general room type if not specified
  const mainUnitType = units[0]?.unit_type || 'N/A'
  const displayCapacity = accommodation.total_capacity

  // Group units by type for the list
  const unitTypeStats = useMemo(() => {
    const stats: Record<string, { type: string, capacity: number, count: number, price: number, sampleUnit: Unit }> = {}
    units.forEach(u => {
      const typeKey = u.unit_type
      if (!stats[typeKey]) {
        stats[typeKey] = {
          type: u.unit_type,
          capacity: u.max_occupancy,
          count: 0,
          price: u.rental_fee,
          sampleUnit: u
        }
      }
      stats[typeKey].count += 1
    })
    return Object.values(stats)
  }, [units])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F8D5' }}>
      {/* Back Button */}
      <div className="py-6 px-10 sm:px-20 sticky top-0 z-20 bg-[#F6F8D5]/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="group flex items-center gap-4 text-[#44291B] font-archivo font-black text-xs uppercase tracking-widest hover:text-[#264384] transition-all duration-500 ease-in-out"
        >
          <div className="w-10 h-10 rounded-full border-2 border-[#44291B] flex items-center justify-center group-hover:border-[#264384] group-hover:-translate-x-2 group-hover:scale-110 transition-all duration-500 ease-in-out bg-white/50 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="group-hover:translate-x-1 transition-transform duration-500">Back</span>
        </button>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 p-8 sm:p-12 lg:p-20 flex-1">

        {/* LEFT COLUMN */}
        <div className="min-w-0 flex flex-col gap-8">
          {/* Main Gallery */}
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-gray-200 group">
            {accommodation.image ? (
              <img
                src={accommodation.image}
                alt={accommodation.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="mt-4 text-sm text-gray-400 font-bold uppercase tracking-widest opacity-50">No Property Image</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-20" />
          </div>


          {/* Unit List */}
          <div className="bg-[#FDFFF4] rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="font-archivo font-black text-xl uppercase mb-6 pb-3 border-b-4 border-[#6a9b3a] inline-block text-[#44291B]">
              Available Unit Types
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {isFetchingUnits ? (
                <>
                  <div className="h-[92px] bg-gray-200 rounded-2xl animate-pulse"></div>
                  <div className="h-[92px] bg-gray-200 rounded-2xl animate-pulse"></div>
                  <div className="h-[92px] bg-gray-200 rounded-2xl animate-pulse"></div>
                </>
              ) : unitTypeStats.map((stat, idx) => (
                <div
                  key={idx}
                  onClick={() => userRole !== 'student' && onUnitTypeClick?.(stat.sampleUnit)}
                  className={`flex items-center justify-between p-5 bg-[#F6F8D5] rounded-2xl border border-[#44291B]/5 transition-all ${userRole !== 'student' ? 'cursor-pointer' : 'cursor-default'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#e8ebba] flex items-center justify-center text-[#264384] transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-sm font-black text-[#44291B] uppercase tracking-tight">
                        {stat.type.replace('wholeunit', 'Whole Unit')}
                      </span>
                      <span className="text-[10px] font-bold text-[#44291B]/50 uppercase tracking-widest">
                        {stat.count} Units Available
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#44291B]/40 uppercase tracking-tighter">
                      Capacity: {stat.capacity} Pax
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* INFO CARD */}
          <div className="bg-[#f0c215] rounded-[2rem] p-8 shadow-2xl sticky top-24 flex flex-col gap-6 overflow-hidden min-h-[500px]">
            <div>
              <h1 className="font-archivo font-black text-3xl sm:text-4xl text-[#44291B] leading-none uppercase mb-4">
                {accommodation.name}
              </h1>

              <div className="flex items-center gap-2 text-xs font-bold text-[#5a4a00]/70 uppercase tracking-wider">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                </svg>
                {accommodation.location}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-white/60 tracking-widest">Property Type</label>
                <span className="text-sm font-bold text-[#44291B] capitalize">{accommodation.property_type || accommodation.accommodation_type}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-white/60 tracking-widest">Total Capacity</label>
                <span className="text-sm font-bold text-[#44291B]">{displayCapacity} Pax</span>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] font-black uppercase text-white/60 tracking-widest">Sex Allowed</label>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#44291B]">
                  {(!accommodation.accomm_sex || accommodation.accomm_sex.toLowerCase() === 'all' || accommodation.accomm_sex.toLowerCase() === 'coed') && (
                    <>
                      <svg className="w-4 h-4 text-purple-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="15" r="5" />
                        <path d="M9 20v3M7 22h4" />
                        <circle cx="15" cy="9" r="5" />
                        <path d="M18.5 5.5L22 2M17 2h5v5" />
                      </svg>
                      <span>COED</span>
                    </>
                  )}
                  {(accommodation.accomm_sex?.toLowerCase() === 'female' || accommodation.accomm_sex?.toLowerCase() === 'f') && (
                    <>
                      <svg className="w-4 h-4 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="6"/><path d="M12 16v6M9 19h6"/></svg>
                      <span>Female only</span>
                    </>
                  )}
                  {(accommodation.accomm_sex?.toLowerCase() === 'male' || accommodation.accomm_sex?.toLowerCase() === 'm') && (
                    <>
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="6"/><path d="M14.243 9.757L21 3M16 3h5v5"/></svg>
                      <span>Male only</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {accommodation.allowed_application && (
              <>
                <div className="h-0.5 bg-[#c9a200]/30 rounded-full" />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-white/60 tracking-widest">Application Period</label>
                  <div className={`${new Date() > new Date(accommodation.allowed_application) ? 'opacity-30 grayscale' : ''}`}>
                    <span className="text-sm font-bold text-[#44291B]">
                      Until {new Date(accommodation.allowed_application).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="mt-auto flex flex-col gap-3">
              <button
                className={`w-full py-5 text-white font-archivo font-black text-sm rounded-2xl shadow-lg transition-all uppercase tracking-widest ${!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-[#264384] shadow-[#264384]/30 hover:scale-[1.02] hover:bg-[#1f3a7a] active:scale-[0.98]'
                  }`}
                onClick={onApply}
                disabled={!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)}
              >
                {!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)
                  ? 'Applications Closed'
                  : 'Apply Now'}
              </button>
            </div>

            {/* Decorative Background Assets */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 pointer-events-none transform rotate-12">
              <img src="/textured-green 3.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-16 -right-16 w-64 h-64 opacity-5 pointer-events-none transform -rotate-12">
              <img src="/texturized-logo-icon 1.png" alt="" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}
