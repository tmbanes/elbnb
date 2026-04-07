import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { AccommodationApplication } from '@/types/application_workflow'

// Input type for creation: server generates application_id; accommodation_assignment is a join
type CreateApplicationInput = Omit<AccommodationApplication, 'application_id' | 'accommodation_assignment'>

export class ApplicationService {
  
  // CREATE ACCOMMODATION APPLICATION
  static async createApplication(data: CreateApplicationInput): Promise<AccommodationApplication> {
    const supabase = await createSupabaseServerClient()

    // Normalise unit_id: the form sends '' when no specific unit was selected.
    // Store null in DB so foreign key constraints and queries work correctly.
    const unitId = data.unit_id && data.unit_id.trim() !== '' ? data.unit_id : null

    // Guard: reject if user already has a pending application for this accommodation (+ unit if specified)
    let duplicateQuery = supabase
      .from('accommodation_application')
      .select('application_id')
      .eq('user_id', data.user_id)
      .eq('preferred_accommodation', data.preferred_accommodation)
      .in('application_status', ['pending_dorm_manager', 'pending_admin'])

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

    // Server is the single source of truth for these fields — overwrite whatever came from the client
    const payload = {
      ...data,
      unit_id: unitId,                                // normalised null
      date_submitted: new Date().toISOString(),       // authoritative timestamp
      application_status: 'pending_dorm_manager',    // always start here
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

  // UPDATE APPLICATION STATUS
  static async updateApplicationStatus(
    applicationId: string,
    status: string
  ): Promise<AccommodationApplication> {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_application')
      .update({ application_status: status })
      .eq('application_id', applicationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update application: ${error.message}`)
    }

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