import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { AccommodationAssignment, AssignmentStatus } from '@/types/assignment_workflow'
import { AccommodationHistory } from '@/types/accomodation/accomodationHistory'

// Statuses that can be terminated by the user (active → terminated)
const TERMINATABLE_STATUSES: AssignmentStatus[] = ['active']
// Statuses that can be cancelled by the user (pending → cancelled)
const CANCELLABLE_STATUSES: AssignmentStatus[] = ['pending', 'waiting_payment']
// Statuses that can be activated by the user (waiting_payment → active)
const ACTIVATABLE_STATUSES: AssignmentStatus[] = ['waiting_payment']

export class AssignmentService {

  // ─── READ ────────────────────────────────────────────────────────────────────

  /** Fetch all assignments for a given user, joined with unit + accommodation data. */
  static async getAssignmentsByUser(userId: string): Promise<AccommodationAssignment[]> {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('accommodation_assignment')
      .select('*')
      .eq('user_id', userId)
      .order('move_in_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`)
    }
    console.log("Fetched Assignments from Service: " + data)
    return data || []
  }

  /** Fetch the Accommodation History of a User including all complete details of the Assignment, Accommodation, and Unit */
  static async getAccommodationHistoryByUser(
    userId: string
  ): Promise<AccommodationHistory[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("accommodation_assignment")
      .select(`
        *,
        unit:unit_id (
          *,
          accommodation:accommodation_id (
            *
          )
        )
      `)
      .eq("user_id", userId)
      .order("move_in_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch accommodation history: ${error.message}`);
    }

    // Flatten the nested structure to match the expected interface
    const flattenedData = (data || []).map((item: any) => ({
      ...item,
      accommodation: item.unit?.accommodation || null
    }));

    console.log("Fetched Accommodation History from Service:", flattenedData);

    return flattenedData as AccommodationHistory[];
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
        actual_move_out_date: new Date().toISOString(),
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
      errors.push('Only pending and waiting for payment assignments can be cancelled.')
    }

    return errors
  }

  /** Update assignment status from pending/'waiging for payment' → cancelled. */
  static async cancelAssignment(assignment: Partial<AccommodationAssignment>): Promise<AccommodationAssignment> {
    if (
      !assignment.assignment_status ||
      !CANCELLABLE_STATUSES.includes(assignment.assignment_status)
    ) {
      throw new Error("'Cannot cancel: assignment is not 'pending' or 'waiting for payment.'")
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

  // ─── ACTIVATE (pending/waiting_payment → active) via deposit payment ─────────────────────────

  /** Validate that an assignment can be activated (deposit paid). */
  static validateActivation(assignment: Partial<AccommodationAssignment>): string[] {
    const errors: string[] = []

    if (!assignment.assignment_status || !ACTIVATABLE_STATUSES.includes(assignment.assignment_status)) {
      errors.push('Only waiting for payment assignments can be activated.')
    }

    return errors
  }

  /** Update assignment status from pending → active after deposit payment. */
  static async activateAssignment(assignment: Partial<AccommodationAssignment>): Promise<AccommodationAssignment> {
    if (!assignment.assignment_status || !ACTIVATABLE_STATUSES.includes(assignment.assignment_status)) {
      throw new Error('Cannot activate: assignment is not waiting for payment.')
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