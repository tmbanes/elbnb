'use client'

import React from 'react'
import { Accommodation, Unit } from '@/types/accommodation_units'
import { ImageWithLoader } from '@/components/shared/ImageWithLoader'


interface ViewUnitProps {
  accommodation: Accommodation
  unit: Unit
  onBack: () => void
  onApply?: () => void
}

export const ViewUnit: React.FC<ViewUnitProps> = ({
  accommodation,
  unit,
  onBack,
  onApply,
}) => {
  const displayPrice = unit.rental_fee
  const displayCapacity = unit.max_occupancy

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
              <ImageWithLoader
                src={accommodation.image}
                alt={accommodation.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}


            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="mt-4 text-sm text-gray-400 font-bold uppercase tracking-widest opacity-50">No Property Image</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>


          {/* Unit Features Section */}
          <div className="bg-[#FDFFF4] rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="font-archivo font-black text-xl uppercase mb-6 pb-3 border-b-4 border-[#6a9b3a] inline-block text-[#44291B]">
              Unit Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-[#F6F8D5] rounded-3xl border border-[#44291B]/5">
                    <span className="block text-[10px] font-black uppercase opacity-40 mb-1">Furnishing</span>
                    <span className="text-lg font-archivo font-black text-[#44291B] capitalize">
                        {unit.furnishing_status?.replace('-', ' ') || 'Standard'}
                    </span>
                </div>
                <div className="p-6 bg-[#F6F8D5] rounded-3xl border border-[#44291B]/5">
                    <span className="block text-[10px] font-black uppercase opacity-40 mb-1">Minimum Stay</span>
                    <span className="text-lg font-archivo font-black text-[#44291B]">
                        {unit.min_stay_duration || 6} Months
                    </span>
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* INFO CARD */}
          <div className="bg-[#f0c215] rounded-[2rem] p-8 shadow-2xl sticky top-24 flex flex-col gap-6 overflow-hidden min-h-[500px]">
            <div>
              <h1 className="font-archivo font-black text-3xl sm:text-4xl text-[#44291B] leading-none uppercase mb-4">
                {unit.unit_type.replace('wholeunit', 'Whole Unit')}
              </h1>
              <p className="text-xs font-bold text-[#5a4a00]/70 uppercase tracking-widest mb-2">{accommodation.name}</p>

              <div className="flex items-center gap-2 text-xs font-bold text-[#5a4a00]/70 uppercase tracking-wider">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                </svg>
                {accommodation.location}
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-archivo font-black text-5xl text-[#44291B]">₱{displayPrice.toLocaleString()}</span>
              <span className="text-sm font-bold text-[#5a4a00] uppercase tracking-tighter">/ {unit.billing_period || 'month'}</span>
            </div>

            <div className="h-0.5 bg-[#c9a200]/30 rounded-full" />

            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-white/60 tracking-widest">Accommodation</label>
                <span className="text-sm font-bold text-[#44291B]">{accommodation.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-white/60 tracking-widest">Capacity</label>
                <span className="text-sm font-bold text-[#44291B]">{displayCapacity} Pax</span>
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
                className={`w-full py-5 text-white font-archivo font-black text-sm rounded-2xl shadow-lg transition-all uppercase tracking-widest ${
                  !accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)
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
