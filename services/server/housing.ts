// services/server/housing.ts
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// ── Managers ────────────────────────────────────────────────────────────────

export async function getAllManagers() {
  return supabaseAdmin
    .from("dormitory_manager")
    .select(
      `employee_id, office_location, users (user_id, first_name, last_name, email)`,
    );
}

export async function createManager(payload: {
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  office_location: string;
}) {
  return supabaseAdmin.rpc("create_dormitory_manager", {
    p_user_id: payload.user_id ?? null,
    p_first_name: payload.first_name ?? null,
    p_last_name: payload.last_name ?? null,
    p_email: payload.email ?? null,
    p_office_location: payload.office_location,
  });
}

export async function deleteManager(employee_id: string) {
  return supabaseAdmin
    .from("dormitory_manager")
    .delete()
    .eq("employee_id", employee_id);
}

// ── Accommodations ──────────────────────────────────────────────────────────

export async function getAllAccommodations() {
  return supabaseAdmin.from("accommodation").select(`
      accommodation_id, name, location,
      accommodation_type, accommodation_status, total_capacity,
      dormitory_manager (
        employee_id,
        users (first_name, last_name, email)
      )
    `);
}

// ── Dormitories ─────────────────────────────────────────────────────────────

export async function createDormitory(payload: {
  name: string;
  location: string;
  manager_id: string;
  total_capacity: number;
  number_of_semesters_allowed: number;
  curfew_time?: string;
  allowed_programs?: string;
  term_type: "semester" | "annual";
  separate_by_gender: boolean;
}) {
  return supabaseAdmin.rpc("create_dormitory_full", {
    p_name: payload.name,
    p_location: payload.location,
    p_manager_id: payload.manager_id,
    p_total_capacity: payload.total_capacity,
    p_number_of_semesters_allowed: payload.number_of_semesters_allowed,
    p_curfew_time: payload.curfew_time ?? null,
    p_allowed_programs: payload.allowed_programs ?? null,
    p_term_type: payload.term_type,
    p_separate_by_gender: payload.separate_by_gender,
  });
}

export async function getDormitoryDetails(accommodation_id: string) {
  return supabaseAdmin.rpc("get_dormitory_details", {
    p_accommodation_id: accommodation_id,
  });
}

export async function updateDormitory(
  accommodation_id: string,
  accommodationFields: Partial<{
    name: string;
    location: string;
    manager_id: string;
    total_capacity: number;
  }>,
  dormitoryFields: Partial<{
    number_of_semestersAllowed: number;
    curfew_time: string;
    allowed_programs: string;
    term_type: string;
    separate_by_gender: boolean;
  }>,
) {
  if (Object.keys(accommodationFields).length > 0) {
    await supabaseAdmin
      .from("accommodation")
      .update(accommodationFields)
      .eq("accommodation_id", accommodation_id);
  }
  if (Object.keys(dormitoryFields).length > 0) {
    await supabaseAdmin
      .from("dormitory")
      .update(dormitoryFields)
      .eq("accommodation_id", accommodation_id);
  }
}

// ── Rental Spaces ────────────────────────────────────────────────────────────

export async function createRentalSpace(payload: {
  name: string;
  location: string;
  manager_id: string;
  total_capacity: number;
  property_type: "apartment" | "boarding" | "transient" | "house";
  allow_shortterm_stay: boolean;
  allow_longterm_stay: boolean;
  minimum_stay_days?: number;
  maximum_stay_days?: number;
  security_deposit_required: boolean;
}) {
  return supabaseAdmin.rpc("create_rental_space_full", {
    p_name: payload.name,
    p_location: payload.location,
    p_manager_id: payload.manager_id,
    p_total_capacity: payload.total_capacity,
    p_property_type: payload.property_type,
    p_allow_shortterm_stay: payload.allow_shortterm_stay,
    p_allow_longterm_stay: payload.allow_longterm_stay,
    p_minimum_stay_days: payload.minimum_stay_days ?? null,
    p_maximum_stay_days: payload.maximum_stay_days ?? null,
    p_security_deposit_required: payload.security_deposit_required,
  });
}

export async function updateRentalSpace(
  accommodation_id: string,
  accommodationFields: Partial<{
    name: string;
    location: string;
    manager_id: string;
  }>,
  rentingFields: Partial<{
    property_type: string;
    allow_shortterm_stay: boolean;
    allow_longterm_stay: boolean;
    minimum_stay_days: number;
    maximum_stay_days: number;
    security_deposit_required: boolean;
  }>,
) {
  if (Object.keys(accommodationFields).length > 0) {
    await supabaseAdmin
      .from("accommodation")
      .update(accommodationFields)
      .eq("accommodation_id", accommodation_id);
  }
  if (Object.keys(rentingFields).length > 0) {
    await supabaseAdmin
      .from("renting_space")
      .update(rentingFields)
      .eq("accommodation_id", accommodation_id);
  }
}

// ── Delete (shared for both types) ──────────────────────────────────────────

export async function deleteAccommodation(accommodation_id: string) {
  return supabaseAdmin.rpc("delete_accommodation", {
    p_accommodation_id: accommodation_id,
  });
}

// ── Units ────────────────────────────────────────────────────────────────────

export async function addUnit(payload: {
  accommodation_id: string;
  unit_number: string;
  unit_type: "room" | "bedspace" | "wholeunit";
  max_occupancy: number;
  rental_fee: number;
  billing_period: "daily" | "weekly" | "monthly";
  furnishing_status: string;
}) {
  return supabaseAdmin
    .from("unit")
    .insert({ ...payload, current_occupancy: 0, is_active: true })
    .select()
    .single();
}

export async function updateUnit(
  unit_id: string,
  fields: Partial<{
    unit_number: string;
    unit_type: string;
    max_occupancy: number;
    rental_fee: number;
    unit_status: string;
    furnishing_status: string;
  }>,
) {
  return supabaseAdmin.from("unit").update(fields).eq("unit_id", unit_id);
}

export async function deleteUnit(unit_id: string) {
  return supabaseAdmin.from("unit").delete().eq("unit_id", unit_id);
}
