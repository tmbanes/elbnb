import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { AccommodationAssignment, AssignmentStatus } from '@/types/assignment_workflow'

// Statuses that can be terminated by the user (active → terminated)
const TERMINATABLE_STATUSES: AssignmentStatus[] = ['active']

// Statuses that can be cancelled by the user (pending → cancelled)
const CANCELLABLE_STATUSES: AssignmentStatus[] = ['pending']

export class AssignmentService {

  // ─── READ ────────────────────────────────────────────────────────────────────

  /** Fetch all assignments for a given user, joined with unit + accommodation data. */
  static async getAssignmentsByUser(userId: string): Promise<AccommodationAssignment[]> {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_assignment')
      .select(`
        *,
        unit:unit_id (
          unit_id,
          unit_number,
          unit_type,
          furnishing_status,
          rental_fee,
          billing_period,
          max_occupancy,
          current_occupancy,
          accommodation_id,
          accommodation:accommodation_id (
            accommodation_id,
            name,
            location,
            accommodation_type,
            property_type
          )
        )
      `)
      .eq('user_id', userId)
      .order('move_In_Date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`)
    }

    return data || []
  }

  /** Fetch a single assignment by ID. */
  static async getAssignmentById(assignmentId: string): Promise<AccommodationAssignment | null> {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_assignment')
      .select('*')
      .eq('assignment_id', assignmentId)
      .single()

    if (error) return null
    return data
  }

  // ─── TERMINATE (active → terminated) ─────────────────────────────────────────

  /** Validate that an assignment can be terminated. */
  static validateTermination(assignment: Partial<AccommodationAssignment>): string[] {
    const errors: string[] = []

    if (
      !assignment.assignment_status ||
      !TERMINATABLE_STATUSES.includes(assignment.assignment_status)
    ) {
      errors.push('Only active assignments can be terminated.')
    }

    return errors
  }

  /** Update assignment status from active → terminated and record actual move-out date. */
  static async terminateAssignment(assignment: Partial<AccommodationAssignment>): Promise<AccommodationAssignment> {
    if (
      !assignment.assignment_status ||
      !TERMINATABLE_STATUSES.includes(assignment.assignment_status)
    ) {
      throw new Error('Cannot terminate: assignment is not active.')
    }

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_assignment')
      .update({
        assignment_status: 'terminated' as AssignmentStatus,
        actual_Move_Out_Date: new Date().toISOString(),
      })
      .eq('assignment_id', assignment.assignment_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to terminate assignment: ${error.message}`)
    }

    return data
  }

  // ─── CANCEL (pending → cancelled) ────────────────────────────────────────────

  /** Validate that an assignment can be cancelled (rejected by user). */
  static validateCancellation(assignment: Partial<AccommodationAssignment>): string[] {
    const errors: string[] = []

    if (
      !assignment.assignment_status ||
      !CANCELLABLE_STATUSES.includes(assignment.assignment_status)
    ) {
      errors.push('Only pending assignments can be cancelled.')
    }

    return errors
  }

  /** Update assignment status from pending → cancelled. */
  static async cancelAssignment(assignment: Partial<AccommodationAssignment>): Promise<AccommodationAssignment> {
    if (
      !assignment.assignment_status ||
      !CANCELLABLE_STATUSES.includes(assignment.assignment_status)
    ) {
      throw new Error('Cannot cancel: assignment is not pending.')
    }

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_assignment')
      .update({ assignment_status: 'cancelled' as AssignmentStatus })
      .eq('assignment_id', assignment.assignment_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to cancel assignment: ${error.message}`)
    }

    return data
  }

  // ─── ACTIVATE (pending → active) via deposit payment ─────────────────────────

  /** Validate that an assignment can be activated (deposit paid). */
  static validateActivation(assignment: Partial<AccommodationAssignment>): string[] {
    const errors: string[] = []

    if (assignment.assignment_status !== 'pending') {
      errors.push('Only pending assignments can be activated.')
    }

    return errors
  }

  /** Update assignment status from pending → active after deposit payment. */
  static async activateAssignment(assignment: Partial<AccommodationAssignment>): Promise<AccommodationAssignment> {
    if (assignment.assignment_status !== 'pending') {
      throw new Error('Cannot activate: assignment is not pending.')
    }

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_assignment')
      .update({ assignment_status: 'active' as AssignmentStatus })
      .eq('assignment_id', assignment.assignment_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to activate assignment: ${error.message}`)
    }

    return data
  }
}