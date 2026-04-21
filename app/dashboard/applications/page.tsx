'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AccommodationApplication, ApplicationStatus, CancellableStatus } from '@/types/application_workflow'
import type { Accommodation, Unit, UnitType, FurnishingStatus, AccommodationType } from '@/types/accommodation_units'

// ─── Filter shape ────────────────────────────────────────────────────────────

interface ApplicationFilters {
  accommodationType: AccommodationType | ''
  unitType: UnitType | ''
  furnishingStatus: FurnishingStatus | ''
  applicationStatus: ApplicationStatus | ''
}

const DEFAULT_FILTERS: ApplicationFilters = {
  accommodationType: '',
  unitType: '',
  furnishingStatus: '',
  applicationStatus: '',
}

// ─── Enriched application (joins accommodation + unit data) ──────────────────

interface EnrichedApplication {
  application: AccommodationApplication
  accommodation: Accommodation | null
  unit: Unit | null
}

// ─── Status badge config ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<ApplicationStatus, { bg: string; text: string; label: string }> = {
  pending_dorm_manager: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending Review' },
  pending_admin:        { bg: 'bg-blue-100',  text: 'text-blue-800',  label: 'Pending Admin' },
  pending_payment:      { bg: 'bg-purple-100',text: 'text-purple-800',label: 'Pending Payment' },
  approved:             { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  rejected:             { bg: 'bg-red-100',   text: 'text-red-800',   label: 'Rejected' },
  cancelled:            { bg: 'bg-gray-100',  text: 'text-gray-500',  label: 'Cancelled' },
}

const CANCELLABLE_STATUSES: CancellableStatus[] = [
  'pending_dorm_manager',
  'pending_admin',
  'pending_payment',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ─── Application tile ────────────────────────────────────────────────────────

interface ApplicationTileProps {
  enriched: EnrichedApplication
  onCancel: (applicationId: string) => Promise<void>
  cancelling: boolean
}

function ApplicationTile({ enriched, onCancel, cancelling }: ApplicationTileProps) {
  const { application, accommodation, unit } = enriched
  console.log('STATUS VALUE:', application.application_status)
  const status = STATUS_STYLES[application.application_status]
  const isCancellable = (CANCELLABLE_STATUSES as string[]).includes(application.application_status)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">
            {accommodation?.name ?? 'Unknown Accommodation'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{accommodation?.location ?? '—'}</p>
        </div>
        <span className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Unit / general badge */}
      <div className="flex flex-wrap gap-2">
        {unit ? (
          <>
            <Pill label="Unit" value={unit.unit_number} />
            <Pill label="Type" value={unit.unit_type} />
            <Pill label="Furnishing" value={unit.furnishing_status} />
          </>
        ) : (
          <>
            <Pill label="Preferred type" value={application.preferred_unit_type || '—'} />
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">General application</span>
          </>
        )}
        {accommodation && (
          <Pill label="Accommodation type" value={accommodation.accommodation_type} />
        )}
      </div>

      {/* Date info */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <DateBlock label="Submitted" value={fmt(application.date_submitted)} />
        <DateBlock label="Check-in" value={fmt(application.check_in)} />
        {application.check_out && (
          <DateBlock label="Check-out" value={fmt(application.check_out)} />
        )}
      </div>

      {/* Stay + companions */}
      <div className="flex gap-4 text-xs text-gray-600">
        <span><span className="font-medium text-gray-800">{application.duration_of_stay}</span> month{application.duration_of_stay !== 1 ? 's' : ''}</span>
        {application.number_of_companions > 0 && (
          <span><span className="font-medium text-gray-800">{application.number_of_companions}</span> companion{application.number_of_companions !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Unit rental info */}
      {unit && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          ₱{unit.rental_fee.toLocaleString()} / {unit.billing_period}
          <span className="mx-2 text-gray-300">·</span>
          Max occupancy: {unit.max_occupancy}
          <span className="mx-2 text-gray-300">·</span>
          Vacant slots: {unit.vacant_slots ?? unit.max_occupancy - unit.current_occupancy}
        </div>
      )}

      {/* Cancel button */}
      {isCancellable && (
        <button
          onClick={() => onCancel(application.application_id)}
          disabled={cancelling}
          className="mt-auto w-full py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {cancelling ? 'Cancelling…' : 'Cancel Application'}
        </button>
      )}
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
      {label}: <span className="font-medium">{value}</span>
    </span>
  )
}

function DateBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2 py-1.5">
      <p className="text-gray-400 text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-gray-800 font-medium mt-0.5">{value}</p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyApplicationsPage() {
  const router = useRouter()

  const [enriched, setEnriched] = useState<EnrichedApplication[]>([])
  const [filtered, setFiltered] = useState<EnrichedApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // ── Fetch + enrich ─────────────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. applications
      const appRes = await fetch('/api/applications/get_applications')
      if (!appRes.ok) {
        if (appRes.status === 401) { router.push('/login'); return }
        throw new Error('Failed to fetch applications')
      }
      const appJson = await appRes.json()
      const applications: AccommodationApplication[] = appJson.data ?? []

      // 2. accommodations lookup
      const accomRes = await fetch('/api/dashboard/tiles?type=accommodations')
      const accomData: Accommodation[] = accomRes.ok ? await accomRes.json() : []
      const accomMap = new Map(accomData.map(a => [a.accommodation_id, a]))

      // 3. units lookup (fetch per unique accommodation)
<<<<<<< HEAD
      const uniqueAccomIds = [...new Set(applications.map(a => a.preferred_accommodation))]
=======
      const uniqueAccomIds = [...new Set(applications.map(a => a.preferred_accommodation_id))]
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
      const unitMap = new Map<string, Unit>()

      await Promise.all(
        uniqueAccomIds.map(async (id) => {
          const res = await fetch(`/api/dashboard/tiles?type=units-by-accommodation&accommodationId=${id}`)
          if (!res.ok) return
          const units: Unit[] = await res.json()
          units.forEach(u => unitMap.set(u.unit_id, u))
        })
      )

      // 4. enrich
      const result: EnrichedApplication[] = applications.map(app => ({
        application: app,
<<<<<<< HEAD
        accommodation: accomMap.get(app.preferred_accommodation) ?? null,
=======
        accommodation: accomMap.get(app.preferred_accommodation_id) ?? null,
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
        unit: app.unit_id ? unitMap.get(app.unit_id) ?? null : null,
      }))

      setEnriched(result)
      applyFilters(result, filters)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [router]) 

  useEffect(() => { fetchApplications() }, [fetchApplications])

  // ── Filtering ──────────────────────────────────────────────────────────────
  const applyFilters = useCallback((list: EnrichedApplication[], f: ApplicationFilters) => {
    let out = list

    if (f.accommodationType)
      out = out.filter(e => e.accommodation?.accommodation_type === f.accommodationType)

    if (f.unitType)
      out = out.filter(e =>
        e.unit?.unit_type === f.unitType ||
        e.application.preferred_unit_type === f.unitType
      )

    if (f.furnishingStatus)
      out = out.filter(e => e.unit?.furnishing_status === f.furnishingStatus)

    if (f.applicationStatus)
      out = out.filter(e => e.application.application_status === f.applicationStatus)

    setFiltered(out)
  }, [])

  const handleFilterChange = (patch: Partial<ApplicationFilters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    applyFilters(enriched, next)
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    applyFilters(enriched, DEFAULT_FILTERS)
  }

  const handleBackToDashBoard = () => {
    router.push('/dashboard')
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancel = async (applicationId: string) => {
    setCancellingId(applicationId)
    setConfirmId(null)
    try {
      const res = await fetch('/api/applications/cancel_application', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to cancel application')
      }
      await fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setCancellingId(null)
    }
  }

  // ── Counts ─────────────────────────────────────────────────────────────────
  const activeCount = enriched.filter(e =>
    (CANCELLABLE_STATUSES as string[]).includes(e.application.application_status)
  ).length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {enriched.length} total · {activeCount} active
          </p>
        </div>
        <button
          onClick={handleBackToDashBoard}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:`bg`-gray-200 transition font-medium"
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={() => router.push('/dashboard/accommodations')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Browse Accommodations
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-red-600">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterSelect
            label="Status"
            value={filters.applicationStatus}
            onChange={v => handleFilterChange({ applicationStatus: v as ApplicationStatus | '' })}
            options={[
              { value: 'pending_dorm_manager', label: 'Pending Review' },
              { value: 'pending_admin',        label: 'Pending Admin' },
              { value: 'pending_payment',      label: 'Pending Payment' },
              { value: 'approved',             label: 'Approved' },
              { value: 'rejected',             label: 'Rejected' },
              { value: 'cancelled',            label: 'Cancelled' },
            ]}
          />
          <FilterSelect
            label="Accommodation type"
            value={filters.accommodationType}
            onChange={v => handleFilterChange({ accommodationType: v as AccommodationType | '' })}
            options={[
              { value: 'dormitory',     label: 'Dormitory' },
              { value: 'renting_space', label: 'Renting Space' },
            ]}
          />
          <FilterSelect
            label="Unit type"
            value={filters.unitType}
            onChange={v => handleFilterChange({ unitType: v as UnitType | '' })}
            options={[
              { value: 'room',      label: 'Room' },
              { value: 'bedspace',  label: 'Bedspace' },
              { value: 'wholeunit', label: 'Whole Unit' },
            ]}
          />
          <FilterSelect
            label="Furnishing"
            value={filters.furnishingStatus}
            onChange={v => handleFilterChange({ furnishingStatus: v as FurnishingStatus | '' })}
            options={[
              { value: 'furnished',      label: 'Furnished' },
              { value: 'semi-furnished', label: 'Semi-furnished' },
              { value: 'unfurnished',    label: 'Unfurnished' },
            ]}
          />
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of {enriched.length} applications
        </p>
      </div>

      {/* Confirm cancel dialog */}
      {confirmId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 font-medium">Are you sure you want to cancel this application?</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleCancel(confirmId)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
            >
              Yes, cancel
            </button>
            <button
              onClick={() => setConfirmId(null)}
              className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition font-medium"
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && enriched.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-sm">You haven't submitted any applications yet.</p>
          <button
            onClick={() => router.push('/dashboard/accommodations')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Browse Accommodations
          </button>
        </div>
      )}

      {!loading && enriched.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-sm">No applications match your filters.</p>
          <button onClick={resetFilters} className="mt-4 text-blue-600 text-sm hover:underline font-medium">
            Clear filters
          </button>
        </div>
      )}

      {/* Tiles grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(e => (
            <ApplicationTile
              key={e.application.application_id}
              enriched={e}
              onCancel={async (id) => setConfirmId(id)}
              cancelling={cancellingId === e.application.application_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Shared filter select ────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
      >
        <option value="">All</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}