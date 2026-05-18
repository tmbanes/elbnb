import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { AccommodationApplication, ApplicationStatus, CancellableStatus } from '@/types/application_workflow'
import { createActivityLog, getCurrentUserRole } from '@/services/activity_log/server'

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

    // Also update the billing status to cancelled if it exists
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("accommodation_assignment")
      .select("assignment_id")
      .eq("application_id", application.application_id)
      .maybeSingle();

    if (!assignmentError && assignment?.assignment_id) {
      await supabaseAdmin
        .from("billing")
        .delete()
        .eq("assignment_id", assignment.assignment_id)
        .in("status", ["unpaid", "pending", "pending_verification", "overdue"]);
        
      await supabaseAdmin
        .from("accommodation_assignment")
        .update({ assignment_status: "cancelled" })
        .eq("assignment_id", assignment.assignment_id);
    }

    // Log the cancellation
    const actor = await getCurrentUserRole()
    if (actor) {
      await createActivityLog({
        p_user_id: actor.userId,
        p_action_type: "cancel_application",
        p_log_desc: `${actor.first_name} cancelled application ${application.application_id}`,
        p_entity_type: "application",
        p_entity_id: data.application_id,
        p_user_role: actor.role,
      })
    }

    return data
  }

}