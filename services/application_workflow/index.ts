import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  ApplicationStatus,
  SubmitAccommodationApplicationInput,
} from "@/types/application_workflow";

const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "pending",
  "pending_for_approval",
  "waiting_for_payment",
];

const CANCELLABLE_STATUSES: ApplicationStatus[] = [
  // for readability, can be changed
  "pending",
  "pending_for_approval",
  "waiting_for_payment",
];

const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  pending: ["pending_for_approval", "rejected", "cancelled"],
  pending_for_approval: ["waiting_for_payment", "rejected", "cancelled"],
  waiting_for_payment: ["accepted", "cancelled"],
  accepted: [],
  rejected: [],
  cancelled: [],
};

function isIsoDate(value: string) {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function assertTransition(from: ApplicationStatus, to: ApplicationStatus) {
  if (!TRANSITIONS[from]?.includes(to)) {
    throw new Error(`Invalid transition: ${from} -> ${to}`);
  }
}

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// TO DO: based on unit or based on accommodation?
export const applicationWorkflowService = {
  async listAvailableAccommodations(): Promise<ServiceResult<unknown[]>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("unit")
      .select("is_active")
      .eq("is_active", true);

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data ?? [], error: null };
  },

  async submitApplication(
    input: SubmitAccommodationApplicationInput,
  ): Promise<ServiceResult<unknown>> {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user?.id) {
      return { data: null, error: "Unauthorized" };
    }

    const userId = authData.user.id;

    // VALIDATION CHECK: missing input fields
    if (
      !input.user_fname ||
      !input.user_lname ||
      !input.user_email ||
      !input.contact_number ||
      !input.check_in ||
      !input.check_out
    ) {
      return { data: null, error: "Missing required fields" };
    } else if (!input.accommodation_id) {
      return { data: null, error: "Accommodation ID is required" };
    }

    // VALIDATION CHECK: invalid date formats and logical date errors
    if (!isIsoDate(input.check_in) || !isIsoDate(input.check_out)) {
      return { data: null, error: "Invalid date format" };
    }

    // VALIDATION CHECK: check_out must be after check_in
    if (new Date(input.check_in) > new Date(input.check_out)) {
      return {
        data: null,
        error: "Check-out date must be after check-in date",
      };
    }

    // VALIDATION CHECK: user is already assigned here
    const { data: activeAssignment, error: activeAssignmentError } =
      await supabase
        .from("accomodation_assignment")
        .select("assignment_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

    if (activeAssignmentError) {
      return { data: null, error: activeAssignmentError.message };
    }

    if (activeAssignment) {
      return { data: null, error: "User already has an active assignment" };
    }

    // VALIDATION CHECK: user already has an ongoing application for the accomodation
    const { data: activeApplication, error: activeApplicationError } =
      await supabase
        .from("accomodation_application")
        .select("application_id")
        .eq("user_id", userId)
        .in("application_status", ACTIVE_APPLICATION_STATUSES)
        .maybeSingle();

    if (activeApplicationError) {
      return { data: null, error: activeApplicationError.message };
    }

    if (activeApplication) {
      return { data: null, error: "User already has an ongoing application" };
    }

    // VALIDATION CHECK: accommodation exists, is active, and has vacant slots
    const { data: selectedAccommodation, error: selectedAccommodationError } =
      await supabase
        .from("unit")
        .select("accommodation_id,vacant_slots,is_active")
        .eq("accommodation_id", input.accommodation_id)
        .single();

    if (selectedAccommodationError) {
      return { data: null, error: selectedAccommodationError.message };
    }

    if (!selectedAccommodation) {
      return { data: null, error: "Accommodation not found" };
    }

    if (!selectedAccommodation.is_active) {
      return { data: null, error: "Accommodation is not active" };
    }

    if ((selectedAccommodation.vacant_slots ?? 0) <= 0) {
      return { data: null, error: "No available slots" };
    }

    // VALIDATED: create application with "pending" status
    const { data, error } = await supabase
      .from("accomodation_application")
      .insert({
        user_id: userId,
        preferred_Accomodation: input.accommodation_id,
        check_In: input.check_in,
        check_Out: input.check_out,
        contact_number: input.contact_number,
        notes: input.notes ?? null, // will be null if notes is undefined, otherwise will insert the string (even if it's empty)
        application_status: "pending",
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async cancelMyApplication(
    applicationId: string,
  ): Promise<ServiceResult<unknown>> {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user?.id) {
      return { data: null, error: "Unauthorized" };
    }

    const userId = authData.user.id;

    const { data: existingApplication, error: existingApplicationError } =
      await supabase
        .from("accomodation_application")
        .select("application_id,application_status")
        .eq("application_id", applicationId)
        .eq("user_id", userId)
        .single();

    if (existingApplicationError) {
      return { data: null, error: existingApplicationError.message };
    }

    // VALIDATION CHECK: application must be in a cancellable status
    const currentStatus =
      existingApplication.application_status as ApplicationStatus;

    if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
      return {
        data: null,
        error: `Cannot cancel application in '${currentStatus}' status`,
      };
    }

    // UPDATE application status to "cancelled"
    const { data, error } = await supabase
      .from("accomodation_application")
      .update({ application_status: "cancelled" })
      .eq("application_id", applicationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async transitionApplicationStatus(params: {
    applicationId: string;
    toStatus: ApplicationStatus;
    actorUserId: string;
    remarks?: string;
  }): Promise<ServiceResult<unknown>> {
    const supabase = await createSupabaseServerClient();

    const { data: existingApplication, error: existingApplicationError } =
      await supabase
        .from("accomodation_application")
        .select("application_id,application_status")
        .eq("application_id", params.applicationId)
        .single();

    if (existingApplicationError) {
      return { data: null, error: existingApplicationError.message };
    }

    // VALIDATION CHECK: valid transition
    const fromStatus =
      existingApplication.application_status as ApplicationStatus;
    assertTransition(fromStatus, params.toStatus);

    // UPDATE application status
    const { data, error } = await supabase
      .from("accomodation_application")
      .update({
        application_status: params.toStatus,
        reviewed_by: params.actorUserId,
        review_remarks: params.remarks ?? null,
      })
      .eq("application_id", params.applicationId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },
};