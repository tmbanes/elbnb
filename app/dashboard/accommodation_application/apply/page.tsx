'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Accommodation, Unit } from '@/types/accommodation_units'

export default function AccommodationApplicationFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const accommodationId = searchParams.get('accommodationId') ?? ''
  const accommodationType = searchParams.get('accommodationType') ?? ''
  const accommodationName = searchParams.get('accommodationName') ?? ''
  const unitId = searchParams.get('unitId') ?? ''
  const unitTypeFromQuery = searchParams.get('unitType') ?? ''

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    preferred_unit_type: unitTypeFromQuery,
    duration_of_stay: '',
    check_in: '',
    check_out: '',
    number_of_companions: '0',
    stay_count: '',
    stay_unit: 'days',
  })

  const normalizedAccommodationType = accommodationType.trim().toLowerCase()
  const isDormitory = normalizedAccommodationType === 'dormitory'
  const isRentalSpace =
    normalizedAccommodationType === 'rental_space' ||
    normalizedAccommodationType === 'rental space'

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true)
      setError(null)

      try {
        const [accommodationResponse, unitsResponse] = await Promise.all([
          fetch('/api/dashboard/tiles?type=accommodations'),
          accommodationId
            ? fetch(
                `/api/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodationId}`,
              )
            : Promise.resolve(null as Response | null),
        ])

        if (!accommodationResponse.ok) {
          throw new Error('Failed to load accommodation information')
        }

        const accommodationList = (await accommodationResponse.json()) as Accommodation[]

        const selectedAccommodation =
          accommodationList.find((item) => item.accommodation_id === accommodationId) ??
          null

        setAccommodation(selectedAccommodation)

        if (unitsResponse && unitsResponse.ok) {
          const unitsResult = (await unitsResponse.json()) as Unit[]
          const filteredUnits = unitsResult.filter(
            (unit) => unit.unit_status === 'active' && unit.vacant_slots > 0,
          )
          setAvailableUnits(filteredUnits)
        }

        if (!selectedAccommodation) {
          throw new Error('Selected accommodation was not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoadingMeta(false)
      }
    }

    loadMeta()
  }, [accommodationId])

  const availableUnitTypes = useMemo(() => {
    return Array.from(
      new Set(availableUnits.map((unit) => unit.unit_type).filter(Boolean)),
    )
  }, [availableUnits])

  const canSubmit =
    !!accommodation &&
    !!formData.preferred_unit_type &&
    !!formData.duration_of_stay &&
    !!formData.check_in &&
    !!formData.check_out

  const handleChange = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const payload: Record<string, unknown> = {
        preferred_accommodation: accommodationId,
        preferred_unit_type: formData.preferred_unit_type,
        duration_of_stay: Number(formData.duration_of_stay),
        check_in: formData.check_in,
        check_out: formData.check_out,
        number_of_companions: Number(formData.number_of_companions),
        selected_unit_id: unitId || null,
        accommodation_type: accommodationType,
      }

      if (isRentalSpace) {
        payload.stay_count = formData.stay_count ? Number(formData.stay_count) : undefined
        payload.stay_unit = formData.stay_unit
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application')
      }

      setSuccessMessage('Application submitted successfully.')

      setTimeout(() => {
        router.push('/dashboard/accommodation_application')
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Form</h1>
          <p className="mt-1 text-sm text-gray-600">
            Submit an accommodation application based on the selected listing.
          </p>
        </div>
      </div>

      {loadingMeta ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Accommodation</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {accommodation?.name ?? accommodationName || '—'}
              </p>
              <p className="text-xs text-gray-500">{accommodationId}</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Accommodation Type</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {accommodationType || '—'}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Application Target</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {isDormitory ? 'Accommodation' : 'Unit'}
              </p>
              <p className="text-xs text-gray-500">
                {isDormitory
                  ? 'Dormitory applications are submitted to the accommodation.'
                  : `Rental space applications are submitted from the chosen unit${unitId ? ` (${unitId})` : ''}.`}
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Accommodation Type
                </label>
                <input
                  value={accommodationType}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {isDormitory ? 'Preferred Unit Type' : 'Selected Unit Type'}
                </label>

                {isDormitory ? (
                  <select
                    value={formData.preferred_unit_type}
                    onChange={(e) =>
                      handleChange('preferred_unit_type', e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Select unit type</option>
                    {availableUnitTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={formData.preferred_unit_type}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
                  />
                )}
              </div>

              {!isDormitory && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Selected Unit ID
                  </label>
                  <input
                    value={unitId}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Duration of Stay
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_of_stay}
                  onChange={(e) => handleChange('duration_of_stay', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={formData.check_in}
                  onChange={(e) => handleChange('check_in', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={formData.check_out}
                  onChange={(e) => handleChange('check_out', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Number of Companions
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.number_of_companions}
                  onChange={(e) =>
                    handleChange('number_of_companions', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {isRentalSpace && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Stay Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.stay_count}
                      onChange={(e) => handleChange('stay_count', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Billing Unit
                    </label>
                    <select
                      value={formData.stay_unit}
                      onChange={(e) => handleChange('stay_unit', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="days">days</option>
                      <option value="weeks">weeks</option>
                      <option value="months">months</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard/accommodations')}
                className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}