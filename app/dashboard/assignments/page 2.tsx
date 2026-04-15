'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AccommodationAssignment, AssignmentStatus, PropertyType} from '@/types/assignment_workflow'
import type { Accommodation, Unit, AccommodationType, UnitType, FurnishingStatus, BillingPeriod} from '@/types/accommodation_units'
import { AssignmentTile } from '@/components/AssignmentTile'

// ─── Filter shape ─────────────────────────────────────────────────────────────

interface AssignmentFilters {
  assignmentStatus: AssignmentStatus | ''
  accommodationType: AccommodationType | ''
  propertyType: PropertyType | ''
  unitType: UnitType | ''
  furnishingStatus: FurnishingStatus | ''
  billingPeriod: BillingPeriod | ''
  availability: 'vacant' | 'all'
}

const DEFAULT_FILTERS: AssignmentFilters = {
  assignmentStatus: '',
  accommodationType: '',
  propertyType: '',
  unitType: '',
  furnishingStatus: '',
  billingPeriod: '',
  availability: 'all',
}

// ─── Enriched assignment ──────────────────────────────────────────────────────

interface EnrichedAssignment {
  assignment: AccommodationAssignment
  accommodation: Accommodation | null
  unit: Unit | null
}

// ─── Filter select ────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">All</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyAssignmentsPage() {
  const router = useRouter()

  const [enriched, setEnriched] = useState<EnrichedAssignment[]>([])
  const [filtered, setFiltered] = useState<EnrichedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AssignmentFilters>(DEFAULT_FILTERS)

  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [confirmTerminateId, setConfirmTerminateId] = useState<string | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null)

  // ── Filtering ──────────────────────────────────────────────────────────────

  const applyFilters = useCallback((list: EnrichedAssignment[], f: AssignmentFilters) => {
    let out = list

    if (f.assignmentStatus)
      out = out.filter(e => e.assignment?.assignment_status === f.assignmentStatus)

    if (f.accommodationType)
      out = out.filter(e => e.accommodation?.accommodation_type === f.accommodationType)

    if (f.propertyType)
      out = out.filter(e => e.accommodation?.property_type === f.propertyType)

    if (f.unitType)
      out = out.filter(e => e.unit?.unit_type === f.unitType)

    if (f.furnishingStatus)
      out = out.filter(e => e.unit?.furnishing_status === f.furnishingStatus)

    if (f.billingPeriod)
      out = out.filter(e => e.unit?.billing_period === f.billingPeriod)

    if (f.availability === 'vacant')
      out = out.filter(e => e.unit && e.unit.current_occupancy < e.unit.max_occupancy)

    setFiltered(out)
  }, [])

  // ── Fetch + enrich ─────────────────────────────────────────────────────────

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch assignments for the authenticated user
      const assignRes = await fetch('/api/assignments')
      if (!assignRes.ok) {
        if (assignRes.status === 401) { router.push('/login'); return }
        throw new Error('Failed to fetch assignments')
      }
      const assignJson = await assignRes.json()
      const assignments: AccommodationAssignment[] = assignJson.data ?? []

      // 2. Filter out "pending" assignments from display
      const visibleAssignments = assignments.filter(a => a.assignment_status !== 'pending')

      // 3. Fetch accommodations
      const accomRes = await fetch('/api/dashboard/tiles?type=accommodations')
      const accomData: Accommodation[] = accomRes.ok ? await accomRes.json() : []
      const accomMap = new Map(accomData.map(a => [a.accommodation_id, a]))
      const unitMap = new Map<string, Unit>()

      // Get accommodation IDs via unit fetches - batch by accommodation
      // First get all accommodations' units
      await Promise.all(
        accomData.map(async (accom) => {
          const res = await fetch(`/api/dashboard/tiles?type=units-by-accommodation&accommodationId=${accom.accommodation_id}`)
          if (!res.ok) return
          const units: Unit[] = await res.json()
          units.forEach(u => unitMap.set(u.unit_id, u))
        })
      )

      // 4. Enrich
      const result: EnrichedAssignment[] = visibleAssignments.map(assignment => {
        const unit = unitMap.get(assignment.unit_id) ?? null
        const accommodation = unit ? accomMap.get(unit.accommodation_id) ?? null : null
        return { assignment, accommodation, unit }
      })

      setEnriched(result)
      applyFilters(result, filters)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, applyFilters]) 

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  // ── Filter handlers ────────────────────────────────────────────────────────

  const handleFilterChange = (patch: Partial<AssignmentFilters>) => {
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

  // ── Terminate ──────────────────────────────────────────────────────────────

  const handleTerminate = async (assignmentId: string) => {
    setTerminatingId(assignmentId)
    setConfirmTerminateId(null)
    try {
      const res = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignmentId, action: 'terminate' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to terminate assignment')
      }
      await fetchAssignments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate')
    } finally {
      setTerminatingId(null)
    }
  }

  // ── Reject ─────────────────────────────────────────────────────────────────

  const handleReject = async (assignmentId: string) => {
    setRejectingId(assignmentId)
    setConfirmRejectId(null)
    try {
      const res = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignmentId, action: 'cancel' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to reject assignment')
      }
      await fetchAssignments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setRejectingId(null)
    }
  }

  // ── Counts ─────────────────────────────────────────────────────────────────

  const activeCount = enriched.filter(e => e.assignment.assignment_status === 'active').length
  const pendingCount = enriched.filter(e => e.assignment.assignment_status === 'pending').length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {enriched.length} total · {activeCount} active · {pendingCount} pending
          </p>
        </div>
        <button
            onClick={handleBackToDashBoard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-red-600 shrink-0">Dismiss</button>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <FilterSelect
            label="Assignment Status"
            value={filters.assignmentStatus}
            onChange={v => handleFilterChange({
              assignmentStatus: v as AssignmentStatus | '',
            })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Rejected' },
              { value: 'terminated', label: 'Terminated' },
              { value: 'waiting_payment', label: 'Waiting For Payment' },
            ]}
          />
          <FilterSelect
            label="Accommodation Type"
            value={filters.accommodationType}
            onChange={v => handleFilterChange({
              accommodationType: v as AccommodationType | '',
              propertyType: '',
            })}
            options={[
              { value: 'dormitory', label: 'Dormitory' },
              { value: 'renting_space', label: 'Renting Space' },
            ]}
          />
          <FilterSelect
            label="Property Type"
            value={filters.propertyType}
            onChange={v => handleFilterChange({ propertyType: v as PropertyType | '' })}
            options={[
              { value: 'apartment', label: 'Apartment' },
              { value: 'boarding', label: 'Boarding House' },
              { value: 'transient', label: 'Transient' },
              { value: 'house', label: 'House' },
            ]}
          />
          <FilterSelect
            label="Unit Type"
            value={filters.unitType}
            onChange={v => handleFilterChange({ unitType: v as UnitType | '' })}
            options={[
              { value: 'room', label: 'Room' },
              { value: 'bedspace', label: 'Bedspace' },
              { value: 'wholeunit', label: 'Whole Unit' },
            ]}
          />
          <FilterSelect
            label="Furnishing"
            value={filters.furnishingStatus}
            onChange={v => handleFilterChange({ furnishingStatus: v as FurnishingStatus | '' })}
            options={[
              { value: 'furnished', label: 'Furnished' },
              { value: 'semi-furnished', label: 'Semi-Furnished' },
              { value: 'unfurnished', label: 'Unfurnished' },
            ]}
          />
          <FilterSelect
            label="Billing Period"
            value={filters.billingPeriod}
            onChange={v => handleFilterChange({ billingPeriod: v as BillingPeriod | '' })}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'one-time', label: 'One-Time' },
            ]}
          />
          <FilterSelect
            label="Availability"
            value={filters.availability}
            onChange={v => handleFilterChange({ availability: v as 'vacant' | 'all' })}
            options={[
              { value: 'vacant', label: 'Has Vacant Slots' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of {enriched.length} assignments
        </p>
      </div>

      {/* Confirm terminate dialog */}
      {confirmTerminateId && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-800 font-medium">Are you sure you want to terminate this assignment? This action cannot be undone.</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleTerminate(confirmTerminateId)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
            >
              Yes, terminate
            </button>
            <button
              onClick={() => setConfirmTerminateId(null)}
              className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition font-medium"
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {/* Confirm reject dialog */}
      {confirmRejectId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 font-medium">Are you sure you want to reject this assignment?</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleReject(confirmRejectId)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
            >
              Yes, reject
            </button>
            <button
              onClick={() => setConfirmRejectId(null)}
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
            <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && enriched.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-sm">You have no assignments yet.</p>
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
          <p className="text-gray-500 text-sm">No assignments match your filters.</p>
          <button onClick={resetFilters} className="mt-4 text-blue-600 text-sm hover:underline font-medium">
            Clear filters
          </button>
        </div>
      )}

      {/* Tiles grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(e => (
            <AssignmentTile
              key={e.assignment.assignment_id}
              assignment={e.assignment}
              accommodation={e.accommodation}
              unit={e.unit}
              onTerminate={(id) => setConfirmTerminateId(id)}
              onReject={(id) => setConfirmRejectId(id)}
              terminating={terminatingId === e.assignment.assignment_id}
              rejecting={rejectingId === e.assignment.assignment_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}