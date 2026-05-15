'use client'

import React, { useMemo, useState, useRef } from 'react'
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
  const displayCapacity = accommodation.total_capacity
  const displayImages = accommodation.images || (accommodation.image ? [accommodation.image] : [])

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

  // Zoom / pan state
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const lastTouchDist = useRef<number | null>(null)

  const resetView = () => { setZoom(1); setPanX(0); setPanY(0) }

  const goTo = (idx: number) => {
    setActiveIndex(idx)
    resetView()
  }

  // ── Wheel / trackpad pinch ──────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    // ctrlKey is set by the browser when two-finger pinch triggers wheel
    const delta = e.ctrlKey ? e.deltaY * 0.012 : e.deltaY * 0.004
    setZoom(z => {
      const next = Math.min(4, Math.max(1, z * (1 - delta)))
      if (next <= 1) { setPanX(0); setPanY(0) }
      return next
    })
  }

  // ── Mouse drag ──────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    isDragging.current = true
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX, panY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    setPanX(dragStart.current.panX + e.clientX - dragStart.current.x)
    setPanY(dragStart.current.panY + e.clientY - dragStart.current.y)
  }

  const handleMouseUp = () => { isDragging.current = false; setDragging(false) }

  // ── Touch (pinch + single-finger pan) ──────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    } else if (e.touches.length === 1 && zoom > 1) {
      isDragging.current = true
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX, panY }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ratio = dist / lastTouchDist.current
      setZoom(z => Math.min(4, Math.max(1, z * ratio)))
      lastTouchDist.current = dist
    } else if (e.touches.length === 1 && isDragging.current) {
      setPanX(dragStart.current.panX + e.touches[0].clientX - dragStart.current.x)
      setPanY(dragStart.current.panY + e.touches[0].clientY - dragStart.current.y)
    }
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    lastTouchDist.current = null
  }

  const zoomLabel = zoom > 1 ? `${Math.round(zoom * 100)}%` : null

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
        <div className="min-w-0 flex flex-col gap-6">

          {/* ── Image viewer ── */}
          {displayImages.length > 0 ? (
            <div className="flex flex-col gap-3">

              {/* Main viewer */}
              <div
                className="relative aspect-video rounded-[2rem] overflow-hidden shadow-xl border-[6px] border-white group select-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
              >
                {/* Blurred background */}
                <img
                  src={displayImages[activeIndex]}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none"
                  style={{ filter: 'blur(22px)', opacity: 0.65, transition: 'opacity 0.4s' }}
                />
                <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                {/* Zoomable image */}
                <img
                  src={displayImages[activeIndex]}
                  alt={`${accommodation.name} photo ${activeIndex + 1}`}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                    transformOrigin: 'center center',
                    transition: dragging ? 'none' : 'transform 0.12s ease-out',
                    userSelect: 'none',
                  }}
                />

                {/* Cursor overlay (captures events without blocking image) */}
                <div
                  className="absolute inset-0 z-10"
                  style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
                />

                {/* Navigation arrows */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); goTo((activeIndex - 1 + displayImages.length) % displayImages.length) }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#F6F8D5] border-2 border-[#44291B]/15 flex items-center justify-center text-[#264384] shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#264384] hover:text-white active:scale-90"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); goTo((activeIndex + 1) % displayImages.length) }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#F6F8D5] border-2 border-[#44291B]/15 flex items-center justify-center text-[#264384] shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#264384] hover:text-white active:scale-90"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Counter */}
                    <div className="absolute top-4 left-4 z-20 bg-[#F6F8D5] border border-[#44291B]/15 px-3 py-1 rounded-full text-[11px] font-black text-[#264384] shadow-sm tracking-wider">
                      {activeIndex + 1} / {displayImages.length}
                    </div>
                  </>
                )}

                {/* Zoom level badge + reset */}
                {zoomLabel && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <span className="bg-[#264384] text-white px-3 py-1 rounded-full text-[11px] font-black shadow-md tracking-wider">
                      {zoomLabel}
                    </span>
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); resetView() }}
                      className="bg-[#F6F8D5] border border-[#44291B]/15 text-[#264384] px-3 py-1 rounded-full text-[11px] font-black shadow-sm hover:bg-[#264384] hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {/* Hint */}
                {!zoomLabel && (
                  <div className="absolute bottom-4 right-4 z-20 bg-[#F6F8D5]/90 border border-[#44291B]/10 px-3 py-1 rounded-full text-[10px] font-bold text-[#264384] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm pointer-events-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Scroll / pinch to zoom
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {displayImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                  {displayImages.map((img, idx) => {
                    const isActive = idx === activeIndex
                    return (
                      <button
                        key={idx}
                        onClick={() => goTo(idx)}
                        className="relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border-[3px] transition-all duration-200"
                        style={{
                          borderColor: isActive ? '#264384' : 'white',
                          boxShadow: isActive ? '0 0 0 1px #264384' : '0 2px 8px rgba(0,0,0,0.12)',
                          opacity: isActive ? 1 : 0.65,
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.opacity = '1' }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.opacity = '0.65' }}
                      >
                        <div className="relative w-full h-full bg-[#1a1a1a]">
                          <img src={img} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110" style={{ filter: 'blur(8px)', opacity: 0.5 }} />
                          <img src={img} alt={`Photo ${idx + 1}`} className="absolute inset-0 w-full h-full object-contain" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center aspect-video rounded-[2rem] bg-gradient-to-br from-gray-100 to-gray-200 border-[6px] border-white shadow-xl">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="mt-3 text-sm text-gray-400 font-bold uppercase tracking-widest opacity-50">No Property Images</span>
            </div>
          )}

          {/* Unit List */}
          <div className="bg-[#FDFFF4] rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="font-archivo font-black text-xl uppercase mb-6 pb-3 border-b-4 border-[#6a9b3a] inline-block text-[#44291B]">
              Available Unit Types
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {isFetchingUnits ? (
                <>
                  <div className="h-[92px] bg-gray-200 rounded-2xl animate-pulse" />
                  <div className="h-[92px] bg-gray-200 rounded-2xl animate-pulse" />
                  <div className="h-[92px] bg-gray-200 rounded-2xl animate-pulse" />
                </>
              ) : unitTypeStats.map((stat, idx) => (
                <div
                  key={idx}
                  onClick={() => userRole !== 'student' && onUnitTypeClick?.(stat.sampleUnit)}
                  className={`flex items-center justify-between p-5 bg-[#F6F8D5] rounded-2xl border border-[#44291B]/5 transition-all ${userRole !== 'student' ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#e8ebba] flex items-center justify-center text-[#264384]">
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
                  {(!accommodation.accomm_sex || ['all', 'coed'].includes(accommodation.accomm_sex.toLowerCase())) && (
                    <>
                      <svg className="w-4 h-4 text-purple-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="15" r="5" /><path d="M9 20v3M7 22h4" />
                        <circle cx="15" cy="9" r="5" /><path d="M18.5 5.5L22 2M17 2h5v5" />
                      </svg>
                      <span>COED</span>
                    </>
                  )}
                  {['female', 'f'].includes(accommodation.accomm_sex?.toLowerCase() ?? '') && (
                    <>
                      <svg className="w-4 h-4 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="6"/><path d="M12 16v6M9 19h6"/></svg>
                      <span>Female only</span>
                    </>
                  )}
                  {['male', 'm'].includes(accommodation.accomm_sex?.toLowerCase() ?? '') && (
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
                  <div className={new Date() > new Date(accommodation.allowed_application) ? 'opacity-30 grayscale' : ''}>
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
                {!accommodation.allowed_application || new Date() > new Date(accommodation.allowed_application) ? 'Applications Closed' : 'Apply Now'}
              </button>
            </div>

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
