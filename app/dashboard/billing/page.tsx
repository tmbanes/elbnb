'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { AccommodationAssignment } from '@/types/assignment_workflow'
import type { Accommodation, Unit } from '@/types/accommodation_units'

type PayState = 'idle' | 'paying' | 'success' | 'error'

export default function BillingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const assignmentId = searchParams.get('assignmentId') ?? ''

  const [assignment, setAssignment] = useState<AccommodationAssignment | null>(null)
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)
  const [payState, setPayState] = useState<PayState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!assignmentId) { setLoading(false); return }

    const fetchData = async () => {
      try {
        // Fetch the assignment
        const assignRes = await fetch('/api/assignments')
        if (!assignRes.ok) {
          throw new Error('Failed to fetch assignments')
        }
        const assignJson = await assignRes.json()
        const assignments: AccommodationAssignment[] = assignJson.data ?? []
        const found = assignments.find(a => a.assignment_id === assignmentId) ?? null
        setAssignment(found)

        if (!found) return

        // Fetch accommodations for lookup
        const accomRes = await fetch('/api/dashboard/tiles?type=accommodations')
        const accomData: Accommodation[] = accomRes.ok ? await accomRes.json() : []

        // Fetch unit from each accommodation until found
        let matchedUnit: Unit | null = null
        let matchedAccom: Accommodation | null = null

        for (const accom of accomData) {
          const unitRes = await fetch(`/api/dashboard/tiles?type=units-by-accommodation&accommodationId=${accom.accommodation_id}`)
          if (!unitRes.ok) continue
          const units: Unit[] = await unitRes.json()
          const u = units.find(u => u.unit_id === found.unit_id) ?? null
          if (u) {
            matchedUnit = u
            matchedAccom = accom
            break
          }
        }

        setUnit(matchedUnit)
        setAccommodation(matchedAccom)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId])

  const handlePayDeposit = async () => {
    setPayState('paying')
    setErrorMsg('')
    try {
      const res = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignmentId, action: 'activate' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Payment failed')
      }
      setPayState('success')
    } catch (err) {
      setPayState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Payment failed')
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (payState === 'success') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Deposit Paid!</h2>
          <p className="text-gray-500 text-sm">Your assignment is now active. Welcome to your new unit.</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => router.push('/dashboard/assignments')}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
            >
              View My Assignments
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────────────────────

  if (!assignment) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500">Assignment not found.</p>
          <button
            onClick={() => router.push('/dashboard/assignments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition font-medium"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    )
  }

  // ── Billing view ───────────────────────────────────────────────────────────

  const deposit = unit ? unit.rental_fee * 2 : null

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">

      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/assignments')}
        className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition"
      >
        ← Back to Assignments
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
          <h1 className="text-xl font-bold text-white">Billing & Payment</h1>
          <p className="text-blue-100 text-sm mt-0.5">Complete your deposit to activate your assignment</p>
        </div>

        <div className="p-6 space-y-6">

          {/* Assignment summary */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Assignment Summary</h2>
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
              {[
                { label: 'Accommodation', value: accommodation?.name ?? '—' },
                { label: 'Location', value: accommodation?.location ?? '—' },
                { label: 'Unit', value: unit?.unit_number ?? '—' },
                { label: 'Unit Type', value: unit?.unit_type ?? '—' },
                { label: 'Furnishing', value: unit?.furnishing_status ?? '—' },
                { label: 'Move-in Date', value: fmt(assignment.move_in_date) },
                { label: 'Expected Move-out', value: fmt(assignment.expected_move_out_date) },
                { label: 'Assignment Status', value: assignment.assignment_status },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-medium text-gray-800 capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Billing breakdown */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Billing Breakdown</h2>
            <div className="bg-blue-50 rounded-xl border border-blue-100 divide-y divide-blue-100">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-blue-700">Rental Fee</span>
                <span className="text-sm font-semibold text-blue-900">
                  ₱{unit ? unit.rental_fee.toLocaleString() : '—'} / {unit?.billing_period ?? ''}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-blue-700">Security Deposit (2 months)</span>
                <span className="text-sm font-semibold text-blue-900">
                  {deposit != null ? `₱${deposit.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-blue-100 rounded-b-xl">
                <span className="text-sm font-bold text-blue-900">Total Due Now</span>
                <span className="text-base font-bold text-blue-900">
                  {deposit != null ? `₱${deposit.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 px-1">
              * This is a placeholder billing page. Actual payment processing is not yet implemented.
            </p>
          </div>

          {/* Error */}
          {payState === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Pay deposit button */}
          <button
            onClick={handlePayDeposit}
            disabled={payState === 'paying'}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {payState === 'paying' ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pay Deposit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}