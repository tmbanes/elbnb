import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { Accommodation, Unit } from '@/types/accommodation_units'
import { User } from '@/types/user.types'
import { AccommodationApplication,  } from '@/types/application_workflow'

export class ApplicationService {
  // CREATE ACCOMMODATION APPLICATION
  static async createApplication(data: AccommodationApplication): Promise<AccommodationApplication> {
    const supabase = await createSupabaseServerClient()

    // Business logic: Set defaults
    const payload = {
      ...data,
      date_submitted: new Date().toISOString(),
      application_status: 'pending_dorm_manager',
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

    if (error) {
      return null
    }

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

  // VALIDATION LOGIC
  static validateApplication(data: Partial<AccommodationApplication>): string[] {
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
      
      if (checkOut <= checkIn) {
        errors.push('Check-out date must be after check-in date')
      }
    }

    return errors
  }
}