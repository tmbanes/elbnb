import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { AccommodationApplication, ApplicationStatus, CancellableStatus } from '@/types/application_workflow'

// Input type for creation: server generates application_id; accommodation_assignment is a join
type CancelApplicationInput = AccommodationApplication
const CANCELLABLE_STATUSES = ['pending_dorm_manager', 'pending_admin', 'pending_payment']
const CANCELLED_STATUS = 'cancelled'

export class CancelApplicationService {
  // VALIDATION — if status is cancellable
  static validateCancellation(data: Partial<CancelApplicationInput>): string[] {
    const errors: string[] = []
    
    // GUARD CHECK 1: check if status is cancellable
    if (!data.application_status || !CANCELLABLE_STATUSES.includes(data.application_status)) {
        errors.push('Cannot cancel status of application')
    }

    return errors
  }

    // UPDATE APPLICATION STATUS
  static async cancelApplicationStatus(application: Partial<CancelApplicationInput>): Promise<AccommodationApplication> {

    if (!application.application_status || !CANCELLABLE_STATUSES.includes(application.application_status)) {
        throw new Error('Failed to update application: Cannot cancel status of application')
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('accommodation_application')
      .update({ application_status: CANCELLED_STATUS })
      .eq('application_id', application.application_id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update application: ${error.message}`)
    }

    return data
  }

}