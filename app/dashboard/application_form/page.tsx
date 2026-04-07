'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ApplicationStatus } from '@/types/application_workflow'
import { Accommodation, Unit } from '@/types/accommodation_units'

export default function ApplicationFormPage() {
  const searchParams = useSearchParams()

  const accommodationIdFromQuery = searchParams.get('accommodationId') || ''
  const unitIdFromQuery = searchParams.get('unitId') || ''

  const [userId, setUserId] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [accommodation, setAccommodation] = useState<Accommodation>()
  const [unit, setUnit] = useState<Unit>() 

  const [formData, setFormData] = useState({
    preferred_accommodation: accommodationIdFromQuery,
    preferred_unit_type: '',
    duration_of_stay: '',
    check_in: '',
    check_out: '',
    number_of_companions: '0',
    unit_id: unitIdFromQuery ? unitIdFromQuery : '',
  })

  const dateSubmitted = useMemo(() => new Date().toISOString(), [])
  const applicationStatus: ApplicationStatus = 'pending_dorm_manager'
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth')
        const data = await res.json()
        const user = data.user

        setUserId(user.user_id)
        setUserRole(user.role) 
      } catch (err) {
        console.error(err)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const fetchAccommodation = async () => {
      if (!accommodationIdFromQuery) return

      try {
        const res = await fetch('/api/dashboard/tiles?type=accommodations')
        if (!res.ok) throw new Error('Failed to fetch accommodations')

        const data = await res.json()

        const matchedAccommodation = data.find(
          (accommodation: any) =>
            accommodation.accommodation_id === accommodationIdFromQuery
        )
        if (matchedAccommodation) {
          setAccommodation(matchedAccommodation)
        }

        if (unitIdFromQuery) {
          const resUnit = await fetch('/api/dashboard/tiles?type=units-by-accommodation&accommodationId=' + accommodationIdFromQuery)
          if (!resUnit.ok) throw new Error('Failed to fetch units for accommodation')

          const dataUnits = await resUnit.json()
          const matchedUnit = dataUnits.find((unit: any) => unit.unit_id === unitIdFromQuery)
          if (matchedUnit) {
            setUnit(matchedUnit)
          }
        }
      } catch (error) {
        console.error('Failed to fetch accommodation type:', error)
      }
    }

    fetchAccommodation()
  }, [accommodationIdFromQuery])

  const shouldShowCompanions = userRole === 'guest' && accommodation?.accommodation_type === 'renting_space'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      preferred_accommodation: formData.preferred_accommodation,
      preferred_unit_type: unitIdFromQuery ? '' : formData.preferred_unit_type,
      date_submitted: dateSubmitted,
      duration_of_stay: Number(formData.duration_of_stay),
      check_in: formData.check_in,
      check_out: formData.check_out,
      number_of_companions: shouldShowCompanions
        ? Number(formData.number_of_companions)
        : 0,
      application_status: applicationStatus,
      user_id: userId,
      unit_id: unitIdFromQuery || null,
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(`Failed to submit application: ${data.error || 'Unknown error'}`)
        return
      }

      alert('Application submitted successfully!')
      // Optionally redirect: router.push('/dashboard/applications')
    } catch (error) {
      console.error('Submission error:', error)
      alert('An error occurred while submitting the application')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Accommodation Application Form
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Accommodation ID
            </label>
            <input
              type="text"
              value={formData.preferred_accommodation}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {!unitIdFromQuery && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Unit Type
              </label>
              <select
                name="preferred_unit_type"
                value={formData.preferred_unit_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select unit type</option>
                <option value="room">Room</option>
                <option value="bedspace">Bedspace</option>
                <option value="wholeunit">Whole Unit</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration of Stay (months)
            </label>
            <input
              type="number"
              name="duration_of_stay"
              value={formData.duration_of_stay}
              onChange={handleChange}
              required
              min={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter number of months"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date
            </label>
            <input
              type="date"
              name="check_in"
              value={formData.check_in}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date
            </label>
            <input
              type="date"
              name="check_out"
              value={formData.check_out}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

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
                required
                min={0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter number of companions"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit ID
            </label>
            <input
              type="text"
              value={formData.unit_id}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
            <p><span className="font-semibold">Date Submitted:</span> {dateSubmitted}</p>
            <p><span className="font-semibold">Application Status:</span> {applicationStatus}</p>
            <p><span className="font-semibold">User Role:</span> {userRole || 'N/A'}</p>
            <p><span className="font-semibold">Accommodation Name:</span> {accommodation?.name || 'N/A'}</p>
            <p><span className="font-semibold">Accommodation Type:</span> {accommodation?.accommodation_type || 'N/A'}</p>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Submit Application
          </button>
        </form>
      </div>
    </div>
  )
}