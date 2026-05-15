import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const HousingService = {
  // --- Dorms ---
  async getDorm(id: string) {
    const { data, error } = await supabaseAdmin
      .from("accommodation")
      .select(`
        accommodation_id, name, location,
        accommodation_type, accommodation_status, total_capacity,
        manager_id,
        dormitory_manager!accommodation_manager_id_fkey (
          employee_id, users (first_name, last_name, email)
        ),
        dormitory (
          number_of_semestersAllowed, curfew_time, allowed_programs, term_type, separate_by_gender
        ),
        unit (
          unit_id, unit_number, unit_type, max_occupancy, current_occupancy, rental_fee, unit_status
        )
      `)
      .eq("accommodation_id", id)
      .single();

    if (error) throw new Error(error.message);
    return data && data.unit ? { ...data, units: data.unit } : data;
  },

  async getAllDorms() {
    const { data, error } = await supabaseAdmin
      .from("accommodation")
      .select(`
        accommodation_id, name, location, accommodation_type, accommodation_status, total_capacity, manager_id,
        dormitory_manager!accommodation_manager_id_fkey (employee_id, users (first_name, last_name, email)),
        dormitory (number_of_semestersAllowed, curfew_time, allowed_programs, term_type, separate_by_gender),
        unit (current_occupancy)
      `)
      .eq("accommodation_type", "dormitory");

    if (error) throw new Error(error.message);
    return data?.map((item: any) => ({
      ...item,
      dormitory: Array.isArray(item.dormitory) ? item.dormitory[0] : item.dormitory,
      dormitory_manager: Array.isArray(item.dormitory_manager) ? item.dormitory_manager[0] : item.dormitory_manager,
      units: item.unit || []
    }));
  },

  async createDorm(body: any) {
    const { data, error } = await supabaseAdmin.rpc("create_dormitory_full", {
      p_name: body.name, p_location: body.location, p_manager_id: body.manager_id,
      p_total_capacity: body.total_capacity, p_number_of_semesters_allowed: body.number_of_semesters_allowed,
      p_curfew_time: body.curfew_time ?? null, p_allowed_programs: body.allowed_programs ?? null,
      p_term_type: body.term_type, p_separate_by_gender: body.separate_by_gender,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async updateDorm(id: string, accommodationFields: any, dormitoryFields: any) {
    if (accommodationFields && Object.keys(accommodationFields).length > 0) {
      const { error } = await supabaseAdmin.from("accommodation").update(accommodationFields).eq("accommodation_id", id);
      if (error) throw new Error(error.message);
    }
    if (dormitoryFields && Object.keys(dormitoryFields).length > 0) {
      const { error } = await supabaseAdmin.from("dormitory").update(dormitoryFields).eq("accommodation_id", id);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  },

  // --- Rental Spaces ---
  async getRentalSpace(id: string) {
    const { data, error } = await supabaseAdmin
      .from("accommodation")
      .select(`
        accommodation_id, name, location, accommodation_type, accommodation_status, total_capacity, manager_id,
        dormitory_manager!accommodation_manager_id_fkey (employee_id, users (first_name, last_name, email)),
        renting_space (property_type, allow_shortterm_stay, allow_longterm_stay, minimum_stay_days, maximum_stay_days, security_deposit_required),
        unit (unit_id, unit_number, unit_type, max_occupancy, current_occupancy, rental_fee, unit_status)
      `)
      .eq("accommodation_id", id)
      .single();

    if (error) throw new Error(error.message);
    return data && data.unit ? { ...data, units: data.unit } : data;
  },

  async getAllRentalSpaces() {
    const { data, error } = await supabaseAdmin
      .from("accommodation")
      .select(`
        accommodation_id, name, location, accommodation_type, accommodation_status, total_capacity, manager_id,
        dormitory_manager!accommodation_manager_id_fkey (employee_id, users (first_name, last_name, email)),
        renting_space (property_type, allow_shortterm_stay, allow_longterm_stay, minimum_stay_days, maximum_stay_days, security_deposit_required),
        unit (current_occupancy)
      `)
      .eq("accommodation_type", "renting_space");

    if (error) throw new Error(error.message);
    return data?.map((item: any) => ({
      ...item,
      dormitory_manager: Array.isArray(item.dormitory_manager) ? item.dormitory_manager[0] : item.dormitory_manager,
      units: item.unit || []
    }));
  },

  async createRentalSpace(body: any) {
    const { data, error } = await supabaseAdmin.rpc("create_rental_space_full", {
      p_name: body.name, p_location: body.location, p_manager_id: body.manager_id,
      p_total_capacity: body.total_capacity, p_property_type: body.property_type,
      p_allow_shortterm_stay: body.allow_shortterm_stay, p_allow_longterm_stay: body.allow_longterm_stay,
      p_minimum_stay_days: body.minimum_stay_days ?? null, p_maximum_stay_days: body.maximum_stay_days ?? null,
      p_security_deposit_required: body.security_deposit_required,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async updateRentalSpace(id: string, accommodationFields: any, rentingFields: any) {
    if (accommodationFields && Object.keys(accommodationFields).length > 0) {
      const { error } = await supabaseAdmin.from("accommodation").update(accommodationFields).eq("accommodation_id", id);
      if (error) throw new Error(error.message);
    }
    if (rentingFields && Object.keys(rentingFields).length > 0) {
      const { error } = await supabaseAdmin.from("renting_space").update(rentingFields).eq("accommodation_id", id);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  },

  // --- Shared / Managers ---
  async deleteAccommodation(id: string) {
    const { data, error } = await supabaseAdmin.rpc("delete_accommodation", { p_accommodation_id: id });
    if (error) throw new Error(error.message);
    return data;
  },

  async getManager(id: string) {
    const { data, error } = await supabaseAdmin
      .from("dormitory_manager")
      .select(`employee_id, office_location, users (user_id, first_name, last_name, email, role)`)
      .eq("employee_id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getAllManagers() {
    const { data, error } = await supabaseAdmin
      .from("dormitory_manager")
      .select(`employee_id, office_location, users (user_id, first_name, last_name, email, role), accommodation:accommodation(name)`);
    if (error) throw new Error(error.message);
    return data;
  },

  async createManager(body: any) {
    const { data, error } = await supabaseAdmin.rpc("create_dormitory_manager", {
      p_user_id: body.user_id ?? null, p_first_name: body.first_name ?? null,
      p_last_name: body.last_name ?? null, p_email: body.email ?? null,
      p_office_location: body.office_location,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async updateManager(id: string, managerFields: any, userFields: any, user_id: string) {
    if (managerFields && Object.keys(managerFields).length > 0) {
      const { error } = await supabaseAdmin.from("dormitory_manager").update(managerFields).eq("employee_id", id);
      if (error) throw new Error(error.message);
    }
    if (userFields && user_id && Object.keys(userFields).length > 0) {
      const { error } = await supabaseAdmin.from("users").update(userFields).eq("user_id", user_id);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  },

  async deleteManager(id: string) {
    const { data: assigned } = await supabaseAdmin.from("accommodation").select("accommodation_id").eq("manager_id", id).eq("accommodation_status", "active");
    if (assigned && assigned.length > 0) throw new Error("Cannot delete — this manager is assigned to an active property.");

    const { data: manager, error: fetchError } = await supabaseAdmin.from("dormitory_manager").select("user_id").eq("employee_id", id).single();
    if (fetchError) throw new Error(fetchError.message);

    const userId = manager.user_id;
    const { error: deleteManagerError } = await supabaseAdmin.from("dormitory_manager").delete().eq("employee_id", id);
    if (deleteManagerError) throw new Error(deleteManagerError.message);

    const { error: deleteUserError } = await supabaseAdmin.from("users").delete().eq("user_id", userId);
    if (deleteUserError) throw new Error(deleteUserError.message);

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw new Error(deleteAuthError.message);

    return { success: true };
  }
};
