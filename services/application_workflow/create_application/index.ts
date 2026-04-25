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
      .eq('preferred_accommodation_id', data.preferred_accommodation_id)
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
        .eq('accommodation_id', data.preferred_accommodation_id)
        .single()

      if (accommodationError || !accommodation) throw new Error('Accommodation not found.')

      const { data: units, error: unitAccommodationError } = await supabase
        .from('unit')
        .select('current_occupancy, max_occupancy')
        .eq('accommodation_id', data.preferred_accommodation_id)

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
      .eq('accommodation_id', data.preferred_accommodation_id)
      .single()

    if (accomError || !accommodation) throw new Error('Accommodation not found.')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(accommodation.allowed_application)
    deadline.setHours(0, 0, 0, 0)

    if (today > deadline) {
      throw new Error('The application period for this accommodation has ended.')
    }

    // GUARD 4: check if user is already actively assigned
    // const { data: assignment, error: assignmentError } = await supabase
    //   .from('accommodation_assignment')
    //   .select('assignment_id')
    //   .eq('user_id', data.user_id)
    //   .eq('assignment_status', 'active')
    //   .limit(1)

    // if (assignmentError) throw new Error(`Failed to fetch assignment: ${assignmentError.message}`)

    // // Only block if they actually have an active assignment
    // if (assignment) {
    //   throw new Error('You are already assigned to a unit.')
    // }

    // GUARD 5: user cannot apply to more than 3 dormitory-type accommodations
    const { data: accommodationType, error: typeError } = await supabase
      .from('accommodation')
      .select('accommodation_type')
      .eq('accommodation_id', data.preferred_accommodation_id)
      .single()

    if (typeError || !accommodationType) throw new Error('Accommodation not found.')

    const { data: applications, error: applicationsError } = await supabase
      .from('accommodation_application')
      .select('application_id, preferred_accommodation_id, accommodation!inner(accommodation_type)')
      .eq('user_id', data.user_id)
      .eq('accommodation.accommodation_type', accommodationType.accommodation_type)
      .in('application_status', CANCELLABLE_STATUSES)

    if (applicationsError) throw new Error('Failed to fetch applications.')

    if (applications.length >= 3) {
      throw new Error('You cannot apply to more than 3 dormitory-type accommodations.')
    }

    // GUARD 6: check if the accomm_sex of the accommodation matches the sex of the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('sex')
      .eq('user_id', data.user_id)
      .single()

    if (userError || !user) throw new Error('User not found.')

    const { data: accommodationSex, error: accommodationSexError } = await supabase
      .from('accommodation')
      .select('accomm_sex')
      .eq('accommodation_id', data.preferred_accommodation_id)
      .single()

    if (accommodationSexError || !accommodationSex) throw new Error('Accommodation not found.')

    if (accommodationSex.accomm_sex !== 'COED' && accommodationSex.accomm_sex !== user.sex) {
      throw new Error('The sex of the accommodation does not match the sex of the user.')
    }

    //////// SERVER CONTROLLING FIELDS ////////////////
    const payload = {
      ...data,
      unit_id: unitId,                                // normalised null
      date_submitted: new Date().toISOString(),       // authoritative timestamp
      application_status: INITIAL_SUBMIT_APPLICATION_STATUS,
      file: data.file ?? null
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

    if (!data.preferred_accommodation_id) {
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