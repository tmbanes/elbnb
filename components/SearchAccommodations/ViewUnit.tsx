import React from 'react'
import { Accommodation, Unit } from '@/types/accommodation_units'
import { ImageWithLoader } from '@/components/shared/ImageWithLoader'
import { Building2, Users, Clock, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react'

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
        
        {/* Main Header - Consistent with Accommodation */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-[2px] bg-[#6a9b3a]" />
            <span className="text-[10px] font-black text-[#6a9b3a] uppercase tracking-[0.3em]">Unit Details</span>
          </div>
          <h1 className="font-archivo font-black text-4xl sm:text-5xl lg:text-6xl text-[#44291B] leading-[0.9] uppercase tracking-tighter">
            {unit.unit_type.replace('wholeunit', 'Whole Unit')}
          </h1>
          <div className="flex items-center gap-2 text-sm font-bold text-[#44291B]/60 uppercase tracking-widest">
            <MapPin className="w-4 h-4 text-[#6a9b3a]" />
            {accommodation.name} • {accommodation.location}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* LEFT COLUMN */}
          <div className="min-w-0 flex flex-col gap-8">
            {/* Main Gallery / Featured Image */}
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-white group select-none transition-all duration-500 ease-out hover:shadow-3xl bg-gray-200">
              {accommodation.image ? (
                <ImageWithLoader
                  src={accommodation.image}
                  alt={unit.unit_type}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Building2 className="w-20 h-20 text-gray-300" />
                  <span className="mt-4 text-sm text-gray-400 font-bold uppercase tracking-widest opacity-50">No Property Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Features Section */}
            <div className="bg-[#FDFFF4] rounded-[2.5rem] p-10 shadow-sm border border-gray-100/50">
              <h2 className="font-archivo font-black text-2xl uppercase text-[#44291B] tracking-tight mb-8">
                Unit Features & Amenities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-[#F6F8D5]/50 rounded-[2rem] border border-[#44291B]/5 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#6a9b3a] shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase opacity-40 mb-1">Furnishing Status</span>
                    <p className="text-lg font-archivo font-black text-[#44291B] uppercase tracking-tight">
                      {unit.furnishing_status?.replace('-', ' ') || 'Fully Furnished'}
                    </p>
                  </div>
                </div>

                <div className="p-8 bg-[#F6F8D5]/50 rounded-[2rem] border border-[#44291B]/5 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#6a9b3a] shadow-sm">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase opacity-40 mb-1">Minimum Lease</span>
                    <p className="text-lg font-archivo font-black text-[#44291B] uppercase tracking-tight">
                      {unit.min_stay_duration || 6} Months
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#f0c215] rounded-[3rem] p-10 shadow-3xl sticky top-32 flex flex-col gap-8 overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-col gap-2 mb-6">
                  <h3 className="font-archivo font-black text-4xl text-[#44291B] uppercase tracking-tighter leading-none">
                    Reservation
                  </h3>
                  <p className="text-xs font-bold text-[#44291B]/60 uppercase tracking-widest">
                    Secure your spot today
                  </p>
                </div>

                {/* Unit Snapshot */}
                <div className="flex flex-col gap-3 py-6 border-y border-[#44291B]/10 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#44291B]/40 uppercase tracking-widest">
                            <Building2 className="w-3 h-3" />
                            Unit Type
                        </div>
                        <span className="text-[11px] font-black text-[#44291B] uppercase tracking-tight">
                            {unit.unit_type.replace('wholeunit', 'Whole Unit')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#44291B]/40 uppercase tracking-widest">
                            <Users className="w-3 h-3" />
                            Capacity
                        </div>
                        <span className="text-[11px] font-black text-[#44291B] uppercase tracking-tight">
                            {unit.max_occupancy} Pax
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#44291B]/40 uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3" />
                            Furnishing
                        </div>
                        <span className="text-[11px] font-black text-[#44291B] uppercase tracking-tight">
                            {unit.furnishing_status?.replace('-', ' ') || 'Standard'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-white/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-[#44291B]/40 uppercase tracking-widest">{unit.billing_period || 'Monthly'} Rent</span>
                      <span className="text-2xl font-black text-[#44291B]">
                        ₱{unit.rental_fee?.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#44291B]/40 uppercase tracking-widest">/ {unit.billing_period || 'month'}</span>
                  </div>

                  <button 
                    onClick={onApply}
                    disabled={!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)}
                    className={`w-full py-6 font-black text-sm uppercase tracking-[0.2em] rounded-3xl transition-all active:scale-[0.98] shadow-2xl ${
                      !accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application)
                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                        : 'bg-[#44291B] text-white hover:bg-[#5D3A29]'
                    }`}
                  >
                    {!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application) 
                      ? 'Closed' 
                      : 'Apply Now'}
                  </button>
                </div>

                {accommodation.allowed_application && (
                  <div className="mt-8 pt-8 border-t border-[#44291B]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#44291B]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#44291B]/40 uppercase tracking-widest leading-none mb-1">Application Deadline</span>
                        <span className="text-sm font-black text-[#44291B] uppercase tracking-tight">
                          {new Date(accommodation.allowed_application).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
    </div>
  )
}

