'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { ApplicationStatus, AccommodationApplication } from '@/types/application_workflow'
import type { Accommodation, Unit } from '@/types/accommodation_units'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

// Creation payload: server generates application_id; accommodation_assignment is a join, not inserted
type ApplicationCreatePayload = Omit<AccommodationApplication, 'application_id' | 'accommodation_assignment'>

export default function ApplicationFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const accommodationIdFromQuery = searchParams.get('accommodationId') ?? ''
  const unitIdFromQuery = searchParams.get('unitId') ?? ''

  const [userId, setUserId] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState<string>('')

  const [formData, setFormData] = useState({
    preferred_unit_type: '',
    duration_of_stay: '',
    check_in: '',
    number_of_companions: '0',
  })

  const derivedCheckOut = useCallback((): string => {
    if (!formData.check_in || !formData.duration_of_stay) return ''
    const checkIn = new Date(formData.check_in)
    if (isNaN(checkIn.getTime())) return ''
    checkIn.setMonth(checkIn.getMonth() + Number(formData.duration_of_stay))
    return checkIn.toISOString().split('T')[0]
  }, [formData.check_in, formData.duration_of_stay])

  const checkOut = derivedCheckOut()

  // AUTH CHECK — must be logged in to access this page
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth')
        if (!res.ok) throw new Error('Auth failed')
        const data = await res.json()
        const user = data.user

        if (!user?.user_id) {
          router.push('/login')
          return
        }

        setUserId(user.user_id)
        setUserRole(user.role)
      } catch (err) {
        console.error(err)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router])

  // FETCH ACCOMMODATION + UNIT details for display
  useEffect(() => {
    if (!accommodationIdFromQuery) return

    const fetchAccommodation = async () => {
      try {
        const res = await fetch('/api/dashboard/tiles?type=accommodations')
        if (!res.ok) throw new Error('Failed to fetch accommodations')

        const data: Accommodation[] = await res.json()
        const matched = data.find(a => a.accommodation_id === accommodationIdFromQuery) ?? null
        setAccommodation(matched)

        if (unitIdFromQuery) {
          const resUnit = await fetch(
            `/api/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodationIdFromQuery}`
          )
          if (!resUnit.ok) throw new Error('Failed to fetch units')

          const dataUnits: Unit[] = await resUnit.json()
          const matchedUnit = dataUnits.find(u => u.unit_id === unitIdFromQuery) ?? null
          setUnit(matchedUnit)
        }
      } catch (error) {
        console.error('Failed to fetch accommodation:', error)
      }
    }

    fetchAccommodation()
  }, [accommodationIdFromQuery, unitIdFromQuery])

  // Only guests renting a renting_space need companions
  const shouldShowCompanions =
    userRole === 'guest' && accommodation?.accommodation_type === 'renting_space'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitState === 'submitting') return

    if (!checkOut) {
      setSubmitState('error')
      setSubmitMessage('Please fill in a valid check-in date and duration.')
      return
    }

    setSubmitState('submitting')
    setSubmitMessage('')

    // Send empty string when there's no specific unit — the service converts '' → null before insert.
    const payload: ApplicationCreatePayload = {
      preferred_accommodation: accommodationIdFromQuery,
      preferred_unit_type: unitIdFromQuery ? '' : formData.preferred_unit_type,
      date_submitted: new Date().toISOString(), // overwritten server-side, but satisfies the type
      duration_of_stay: Number(formData.duration_of_stay),
      check_in: formData.check_in,
      check_out: checkOut,
      number_of_companions: shouldShowCompanions
        ? Number(formData.number_of_companions)
        : 0,
      application_status: 'pending_dorm_manager' as ApplicationStatus,
      user_id: userId,
      unit_id: unitIdFromQuery, // '' when absent — handled in service
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmitState('error')
        setSubmitMessage(data.error || 'Failed to submit application.')
        return
      }

      setSubmitState('success')
      setSubmitMessage('Application submitted successfully!')
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitState('error')
      setSubmitMessage('An unexpected error occurred. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-2/3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (submitState === 'success') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Application Submitted</h2>
          <p className="text-gray-600">{submitMessage}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => router.push('/dashboard/accommodation_application')}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View My Applications
            </button>
            <button
              onClick={() => router.push('/dashboard/accommodations')}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Browse Accommodations
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Accommodation Application
        </h1>

        {/* Accommodation summary card */}
        {accommodation && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-800">{accommodation.name}</p>
            <p className="text-xs text-blue-600 mt-0.5">{accommodation.location}</p>
            {unit && (
              <p className="text-xs text-blue-600 mt-0.5">
                Unit {unit.unit_number} &mdash; {unit.unit_type}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <ReadOnlyField
            label="Preferred Accommodation ID"
            value={accommodationIdFromQuery}
          />

          {/* Specific unit selected upstream */}
          {unitIdFromQuery && (
            <ReadOnlyField label="Unit ID" value={unitIdFromQuery} />
          )}

          {/* Unit type selector — only when no specific unit pre-selected */}
          {!unitIdFromQuery && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Unit Type <RequiredMark />
              </label>
              <select
                name="preferred_unit_type"
                value={formData.preferred_unit_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select unit type</option>
                <option value="room">Room</option>
                <option value="bedspace">Bedspace</option>
                <option value="wholeunit">Whole Unit</option>
              </select>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration of Stay (months) <RequiredMark />
            </label>
            <input
              type="number"
              name="duration_of_stay"
              value={formData.duration_of_stay}
              onChange={handleChange}
              required
              min={unit?.min_stay_duration ?? 1}
              max={unit?.max_stay_duration ?? undefined}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 6"
            />
            {/* Show unit constraints when a specific unit is selected */}
            {unit && (
              <p className="text-xs text-gray-400 mt-1">
                Min: {unit.min_stay_duration} month{unit.min_stay_duration !== 1 ? 's' : ''}&nbsp;&mdash;&nbsp;
                Max: {unit.max_stay_duration} month{unit.max_stay_duration !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Check-in */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date <RequiredMark />
            </label>
            <input
              type="date"
              name="check_in"
              value={formData.check_in}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Check-out (auto-derived, read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date
              <span className="ml-2 text-xs font-normal text-gray-400">
                (calculated from check-in + duration)
              </span>
            </label>
            <input
              type="text"
              value={checkOut || '—'}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Companions — only for guests renting a renting_space */}
          {shouldShowCompanions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Companions
              </label>
              <input
                type="number"
                name="number_of_companions"
                value={formData.number_of_companions}
                onChange={handleChange}
                min={0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          )}

          {/* Application metadata */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-1">
            <MetaRow label="User ID" value={userId} />
            <MetaRow label="Status after submit" value="Pending Dorm Manager Review" />
            <MetaRow label="Your role" value={userRole || 'N/A'} />
          </div>

          {/* Inline error */}
          {submitState === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {submitMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitState === 'submitting'}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
          >
            {submitState === 'submitting' ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting…
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="text"
        value={value || '—'}
        readOnly
        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
      />
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold text-gray-700">{label}:</span>{' '}
      <span className="font-mono text-xs">{value}</span>
    </p>
  )
}

function RequiredMark() {
  return <span className="text-red-500 ml-0.5">*</span>
}