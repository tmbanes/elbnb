'use client'

import React, { useMemo, useState, useRef } from 'react'
import { Accommodation, Unit } from '@/types/accommodation_units'
import { Building2, Users } from 'lucide-react'

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
  const displayCapacity = accommodation.total_capacity
  const displayImages = accommodation.images || (accommodation.image ? [accommodation.image] : [])

  // Support both flattened and nested structures for Dormitory specifications
  const termType = accommodation.term_type || (accommodation as any).dormitory?.term_type;
  const curfewTime = accommodation.curfew_time || (accommodation as any).dormitory?.curfew_time;
  const semestersAllowed = accommodation.number_of_semestersAllowed ?? (accommodation as any).dormitory?.number_of_semestersAllowed;
  const separateByGender = accommodation.separate_by_gender ?? (accommodation as any).dormitory?.separate_by_gender;
  const allowedPrograms = accommodation.allowed_programs || (accommodation as any).dormitory?.allowed_programs;

  // Support both flattened and nested structures for Renting Space specifications
  const propertyType = accommodation.property_type || (accommodation as any).renting_space?.property_type;
  const allowShorttermStay = accommodation.allow_shortterm_stay ?? (accommodation as any).renting_space?.allow_shortterm_stay;
  const allowLongtermStay = accommodation.allow_longterm_stay ?? (accommodation as any).renting_space?.allow_longterm_stay;
  const minimumStayDays = accommodation.minimum_stay_days ?? (accommodation as any).renting_space?.minimum_stay_days;
  const maximumStayDays = accommodation.maximum_stay_days ?? (accommodation as any).renting_space?.maximum_stay_days;
  const securityDepositRequired = accommodation.security_deposit_required ?? (accommodation as any).renting_space?.security_deposit_required;

  const unitTypeStats = useMemo(() => {
    const stats: Record<string, { type: string; capacity: number; count: number; price: number; sampleUnit: Unit }> = {}
    units.forEach(u => {
      if (!stats[u.unit_type]) {
        stats[u.unit_type] = { type: u.unit_type, capacity: u.max_occupancy, count: 0, price: u.rental_fee, sampleUnit: u }
      }
      stats[u.unit_type].count += 1
    })
    return Object.values(stats)
  }, [units])

  // Active image
  const [activeIndex, setActiveIndex] = useState(0)

  const goTo = (idx: number) => {
    setActiveIndex(idx)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F8D5' }}>

      {/* Back Button */}
      <div className="py-4 px-10 sm:px-20 lg:px-32 sticky top-0 z-20 bg-[#F6F8D5]/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="group flex items-center gap-4 text-[#44291B] font-archivo font-black text-xs uppercase tracking-widest hover:text-[#6a9b3a] transition-all duration-500 ease-in-out"
        >
          <div className="w-10 h-10 rounded-full border-2 border-[#44291B] flex items-center justify-center group-hover:border-[#6a9b3a] group-hover:-translate-x-2 group-hover:scale-110 transition-all duration-500 ease-in-out bg-white/50 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="group-hover:translate-x-1 transition-transform duration-500">Back</span>
        </button>
      </div>

      {/* Layout Grid */}
      <div className="max-w-[1200px] mx-auto w-full p-6 sm:p-8 lg:px-12 lg:py-10 flex-1 flex flex-col gap-8">
        
        {/* Main Header - Context First */}
        <div className="flex flex-col gap-2">
          <h1 className="font-archivo font-black text-4xl sm:text-5xl lg:text-6xl text-[#44291B] leading-[0.9] uppercase tracking-tighter">
            {accommodation.name}
          </h1>
          <div className="flex items-center gap-2 text-sm font-bold text-[#44291B]/60 uppercase tracking-widest">
            <svg className="w-5 h-5 text-[#6a9b3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
            </svg>
            {accommodation.location}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* LEFT COLUMN */}
          <div className="min-w-0 flex flex-col gap-8">

            {/* ── Image viewer ── */}
            {displayImages.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div
                  className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-white group select-none transition-all duration-500 ease-out hover:shadow-3xl"
                >
                  {/* Blurred background fill */}
                  <img
                    src={displayImages[activeIndex]}
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none transition-opacity duration-700"
                    style={{ filter: 'blur(30px)', opacity: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/40 pointer-events-none" />

                  {/* Static main image */}
                  <img
                    src={displayImages[activeIndex]}
                    alt={`${accommodation.name} photo ${activeIndex + 1}`}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-500"
                  />

                  {/* Navigation Arrows Overlay */}
                  {displayImages.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <button
                        onClick={(e) => { e.stopPropagation(); goTo((activeIndex - 1 + displayImages.length) % displayImages.length); }}
                        className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#264384] shadow-2xl hover:bg-white hover:scale-110 active:scale-95 transition-all pointer-events-auto border border-gray-100"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); goTo((activeIndex + 1) % displayImages.length); }}
                        className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#264384] shadow-2xl hover:bg-white hover:scale-110 active:scale-95 transition-all pointer-events-auto border border-gray-100"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Counter badge */}
                  {displayImages.length > 1 && (
                    <div className="absolute bottom-8 right-8 z-20 bg-black/70 backdrop-blur-md px-5 py-2 rounded-2xl text-[11px] font-black text-white shadow-2xl tracking-[0.3em] uppercase border border-white/10">
                      {activeIndex + 1} / {displayImages.length}
                    </div>
                  )}
                </div>

                {/* Refined Thumbnail Strip */}
                {displayImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto py-2 px-1 no-scrollbar">
                    {displayImages.map((img, idx) => {
                      const isActive = idx === activeIndex
                      return (
                        <button
                          key={idx}
                          onClick={() => goTo(idx)}
                          className={`flex-shrink-0 relative w-24 aspect-square rounded-2xl overflow-hidden transition-all duration-300 border-2 ${isActive ? 'border-[#264384] scale-105 shadow-lg' : 'border-white opacity-60 hover:opacity-100 hover:scale-105'}`}
                        >
                          <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                          {isActive && <div className="absolute inset-0 bg-[#264384]/10" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center aspect-video rounded-[2.5rem] bg-gradient-to-br from-gray-100 to-gray-200 border-[8px] border-white shadow-xl">
                <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="mt-4 text-sm text-gray-400 font-black uppercase tracking-widest opacity-50">No Property Photos</span>
              </div>
            )}

            {/* Unified Specifications & Units Card */}
            <div className="bg-[#FDFFF4] rounded-[2.5rem] p-10 mt-6 shadow-sm border border-gray-100/50 flex flex-col gap-8">
              
              {/* Dormitory Specifications Section */}
              {accommodation.accommodation_type === 'dormitory' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#44291B]/10">
                    <div className="w-1.5 h-4 rounded-full bg-[#6a9b3a]" />
                    <h3 className="font-archivo font-black text-[11px] uppercase tracking-[0.2em] text-[#44291B]">
                      Dormitory Specifications & Policies
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {termType && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Rental Term</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">{termType}</span>
                        </div>
                      </div>
                    )}

                    {semestersAllowed != null && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Min Stay</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">
                            {semestersAllowed} {semestersAllowed === 1 ? 'Semester' : 'Semesters'}
                          </span>
                        </div>
                      </div>
                    )}

                    {curfewTime && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Curfew Time</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">
                            {new Date(`1970-01-01T${curfewTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </div>
                    )}

                    {separateByGender != null && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Gender Policy</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">
                            {separateByGender ? 'Separated' : 'Mixed'} Rooms
                          </span>
                        </div>
                      </div>
                    )}

                    {allowedPrograms && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm sm:col-span-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Allowed Programs</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">{allowedPrograms}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Renting Space Specifications Section */}
              {accommodation.accommodation_type === 'renting_space' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#44291B]/10">
                    <div className="w-1.5 h-4 rounded-full bg-[#6a9b3a]" />
                    <h3 className="font-archivo font-black text-[11px] uppercase tracking-[0.2em] text-[#44291B]">
                      Property Specifications & Policies
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {propertyType && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Property Type</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">{propertyType}</span>
                        </div>
                      </div>
                    )}

                    {(allowShorttermStay != null || allowLongtermStay != null) && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Stay Duration</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">
                            {allowShorttermStay && allowLongtermStay
                              ? 'Short & Long Term'
                              : allowLongtermStay
                              ? 'Long Term Only'
                              : allowShorttermStay
                              ? 'Short Term Only'
                              : 'Not Specified'}
                          </span>
                        </div>
                      </div>
                    )}

                    {minimumStayDays != null && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Minimum Stay</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">
                            {minimumStayDays} {minimumStayDays === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      </div>
                    )}

                    {securityDepositRequired != null && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Security Deposit</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">
                            {securityDepositRequired ? 'Required' : 'Not Required'}
                          </span>
                        </div>
                      </div>
                    )}

                    {maximumStayDays != null && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#44291B]/5 shadow-sm sm:col-span-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Maximum Stay Limit</span>
                          <span className="text-xs font-black text-[#44291B] uppercase truncate">
                            {maximumStayDays} {maximumStayDays === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Decorative Section Divider */}
              {(accommodation.accommodation_type === 'dormitory' || accommodation.accommodation_type === 'renting_space') && (
                <div className="border-t border-[#44291B]/10 my-1" />
              )}

              {/* Available Units Section */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 pb-2 border-b border-[#44291B]/10">
                  <div className="w-1.5 h-4 rounded-full bg-[#264384]" />
                  <h3 className="font-archivo font-black text-[11px] uppercase tracking-[0.2em] text-[#44291B]">
                    Available Units
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {isFetchingUnits ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-24 bg-gray-100 rounded-3xl animate-pulse" />
                    ))
                  ) : unitTypeStats.map((stat, idx) => (
                    <div
                      key={idx}
                      onClick={() => userRole !== 'student' && onUnitTypeClick?.(stat.sampleUnit)}
                      className={`flex items-center justify-between p-6 bg-[#F6F8D5]/50 rounded-3xl border-2 border-transparent transition-all duration-300 ${
                        userRole !== 'student' 
                          ? 'group cursor-pointer hover:border-[#264384] hover:bg-white hover:shadow-xl' 
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#264384] shadow-sm group-hover:bg-[#264384] group-hover:text-white group-hover:border-[#264384] transition-all duration-300">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div>
                          <span className="block text-lg font-black text-[#44291B] uppercase tracking-tight group-hover:text-[#264384] transition-colors">
                            {stat.type.replace('wholeunit', 'Whole Unit')}
                          </span>
                          <span className="text-[11px] font-bold text-[#6a9b3a] uppercase tracking-widest">
                            {stat.count} {stat.count === 1 ? 'Unit' : 'Units'} available
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-xl font-black text-[#264384]">
                          ₱{stat.price.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-black text-[#44291B]/30 uppercase tracking-tighter">
                          PER MONTH • {stat.capacity} PAX
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN - Sticky CTA */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#f0c215] rounded-[3rem] p-10 shadow-3xl sticky top-32 flex flex-col gap-8 overflow-hidden">
              
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <label className="text-[11px] font-black uppercase text-[#44291B]/40 tracking-[0.2em]">Property Overview</label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Property Type */}
                    <div className="bg-white/30 rounded-2xl p-4 flex flex-col gap-2 border border-white/20">
                      <div className="w-8 h-8 rounded-xl bg-[#44291B]/80 flex items-center justify-center text-white shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#44291B]/50 uppercase tracking-widest leading-none mb-1">Type</span>
                        <span className="text-xs font-black text-[#44291B] uppercase tracking-tight truncate">
                          {accommodation.property_type || accommodation.accommodation_type}
                        </span>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="bg-white/30 rounded-2xl p-4 flex flex-col gap-2 border border-white/20">
                      <div className="w-8 h-8 rounded-xl bg-[#44291B]/80 flex items-center justify-center text-white shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#44291B]/50 uppercase tracking-widest leading-none mb-1">Capacity</span>
                        <span className="text-xs font-black text-[#44291B] uppercase tracking-tight">
                          {displayCapacity} Pax
                        </span>
                      </div>
                    </div>

                    {/* Sex Restriction */}
                    <div className="bg-white/30 rounded-2xl p-4 flex flex-col gap-2 border border-white/20 col-span-2">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#44291B]/80 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                          {['female', 'f'].includes(accommodation.accomm_sex?.toLowerCase() ?? '') ? (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="9" r="4"/><path d="M12 13v9M9 19h6"/>
                            </svg>
                          ) : ['male', 'm'].includes(accommodation.accomm_sex?.toLowerCase() ?? '') ? (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="15" r="4"/><path d="M13 11l7-7M14 4h6v6"/>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-[#44291B]/50 uppercase tracking-widest leading-none mb-1">Sex Allowed</span>
                          <span className="text-sm font-black text-[#44291B] uppercase tracking-widest">
                            {(!accommodation.accomm_sex || ['all', 'coed'].includes(accommodation.accomm_sex.toLowerCase())) ? 'COED / ALL' : 
                              ['female', 'f'].includes(accommodation.accomm_sex?.toLowerCase() ?? '') ? 'Female only' : 'Male only'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {accommodation.allowed_application && (
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-black uppercase text-[#44291B]/40 tracking-[0.2em]">Application Period</label>
                    <div className="bg-[#44291B]/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl border border-white/10 backdrop-blur-sm">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Deadline</span>
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          {new Date(accommodation.allowed_application).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button
                  className={`w-full py-6 text-white font-archivo font-black text-sm rounded-[2rem] shadow-2xl transition-all uppercase tracking-[0.2em] ${
                    !accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-[#264384] hover:scale-[1.05] hover:bg-[#1a2f5e] active:scale-[0.95]'
                  }`}
                  onClick={onApply}
                  disabled={!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)}
                >
                  {!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application) ? 'Closed' : 'Apply Now'}
                </button>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -left-10 w-48 h-48 opacity-10 pointer-events-none transform rotate-12">
                <img src="/textured-green 3.png" alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
