import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { AccommodationApplication, ApplicationStatus, CancellableStatus } from '@/types/application_workflow'

// Input type for creation: server generates application_id; accommodation_assignment is a join
type CreateApplicationInput = Omit<AccommodationApplication, 'application_id' | 'accommodation_assignment'>
const CANCELLABLE_STATUSES: CancellableStatus[] = ['pending_dorm_manager', 'pending_admin', 'pending_payment']
const INITIAL_SUBMIT_APPLICATION_STATUS = 'pending_dorm_manager' as ApplicationStatus

export class CreateApplicationService {
  
  // CREATE ACCOMMODATION APPLICATION WITH GUARD CHECKERS
  static async createApplication(data: CreateApplicationInput): Promise<AccommodationApplication> {
    const supabase = await createSupabaseServerClient()

    // Normalise unit_id: the form sends '' when no specific unit was selected.
    // Store null in DB so foreign key constraints and queries work correctly.
    const unitId = data.unit_id && data.unit_id.trim() !== '' ? data.unit_id : null

    // GUARD 1: reject if user already has a pending application for specific unit
    let duplicateQuery = supabase
      .from('accommodation_application')
      .select('application_id')
      .eq('user_id', data.user_id)
      .eq('preferred_accommodation', data.preferred_accommodation)
      .in('application_status', CANCELLABLE_STATUSES)

    if (unitId) {
      duplicateQuery = duplicateQuery.eq('unit_id', unitId)
    }

    const { data: existing, error: dupError } = await duplicateQuery.maybeSingle()

    if (dupError) {
      throw new Error(`Duplicate check failed: ${dupError.message}`)
    }

    if (existing) {
      throw new Error(
        'You already have a pending application for this accommodation. Please wait for it to be reviewed before submitting another.'
      )
    }

    // GUARD 2: Check vacant slots (unit must have space)
    if (unitId) {
      const { data: unit, error: unitError } = await supabase
        .from('unit')
        .select('current_occupancy, max_occupancy')
        .eq('unit_id', unitId)
        .single()

      if (unitError || !unit) throw new Error('Unit not found.')

      if (unit.current_occupancy >= unit.max_occupancy) {
        throw new Error('This unit has no vacant slots.')
      }
    } else { // check if there are available vacancies in any unit of the accommodation
      const { data: accommodation, error: accommodationError } = await supabase
        .from('accommodation')
        .select('accommodation_id')
        .eq('accommodation_id', data.preferred_accommodation)
        .single()

      if (accommodationError || !accommodation) throw new Error('Accommodation not found.')

      const { data: units, error: unitAccommodationError } = await supabase
        .from('unit')
        .select('current_occupancy, max_occupancy')
        .eq('accommodation_id', data.preferred_accommodation)

      if (unitAccommodationError || !units) throw new Error('Failed to fetch units for accommodation.')

      const totalVacantSlots = units.reduce((sum, unit) => sum + (unit.max_occupancy - unit.current_occupancy), 0)
      if (totalVacantSlots <= 0) {
        throw new Error('There are no vacant slots available in any unit of this accommodation.')
      }
    }

    // GUARD 3: application period has ended
    const { data: accommodation, error: accomError } = await supabase
      .from('accommodation')
      .select('allowed_application')
      .eq('accommodation_id', data.preferred_accommodation)
      .single()

    if (accomError || !accommodation) throw new Error('Accommodation not found.')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(accommodation.allowed_application)
    deadline.setHours(0, 0, 0, 0)

    if (today > deadline) {
      throw new Error('The application period for this accommodation has ended.')
    }

    // GUARD 4: if user is currently assigned to this unit
    // TO DO: GUARD 4

    //////// SERVER CONTROLLING FIELDS ////////////////
    const payload = {
      ...data,
      unit_id: unitId,                                // normalised null
      date_submitted: new Date().toISOString(),       // authoritative timestamp
      application_status: INITIAL_SUBMIT_APPLICATION_STATUS,    
    }

    const { data: application, error } = await supabase
      .from('accommodation_application')
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create application: ${error.message}`)
    }

    return application
  }

  // GET ALL APPLICATIONS FOR A USER
  static async getApplicationsByUser(userId: string): Promise<AccommodationApplication[]> {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_application')
      .select('*')
      .eq('user_id', userId)
      .order('date_submitted', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    return data || []
  }

  // GET APPLICATION BY ID
  static async getApplicationById(applicationId: string): Promise<AccommodationApplication | null> {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_application')
      .select('*')
      .eq('application_id', applicationId)
      .single()

    if (error) return null
    return data
  }

  // VALIDATION — runs in the API route before calling createApplication
  static validateApplication(data: Partial<CreateApplicationInput>): string[] {
    const errors: string[] = []

    if (!data.preferred_accommodation) {
      errors.push('Accommodation is required')
    }

    if (!data.duration_of_stay || data.duration_of_stay < 1) {
      errors.push('Duration of stay must be at least 1 month')
    }

    if (!data.check_in) {
      errors.push('Check-in date is required')
    }

    if (!data.check_out) {
      errors.push('Check-out date is required')
    }

    if (data.check_in && data.check_out) {
      const checkIn = new Date(data.check_in)
      const checkOut = new Date(data.check_out)

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        errors.push('Check-in and check-out must be valid dates')
      } else if (checkOut <= checkIn) {
        errors.push('Check-out date must be after check-in date')
      }
    }

    return errors
  }
}