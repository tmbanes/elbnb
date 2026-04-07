import { Accommodation, Unit } from "@/types/accommodation_units";
import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { UserRole } from "@/types/user.types";

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const UnitAccomodationsDisplayService = {
  
  // lists all ACTIVE ACCOMMODATIONS with optional role-based filtering (adds property type to the Accommodation Interface)
  async listAccomodations(userRole?: UserRole): Promise<ServiceResult<Accommodation[]>> {
    try {
      const supabase = await createSupabaseServerClient()

      let query = supabase
        .from('accommodation')
        .select('*, renting_space(property_type)')  // join renting_space
        .eq('accommodation_status', 'active')

      if (userRole && userRole !== 'student') {
        query = query.eq('accommodation_type', 'renting_space')
      }

      const { data, error } = await query
      if (error) return { data: null, error: error.message }

      // Flatten property_type onto the accommodation object
      const flattened = (data ?? []).map((a: any) => ({
        ...a,
        property_type: a.renting_space?.property_type ?? null,
        renting_space: undefined,
      }))

      return { data: flattened as Accommodation[], error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  },
  
  // list all ACTIVE UNITS for a given ACCOMMODATION input
  async listUnitsForAccomodation(
    accommodationId: string,
    supabaseClient?: SupabaseClient
  ): Promise<ServiceResult<Unit[]>> {
    try {
      const supabase = supabaseClient || (await createSupabaseServerClient());
      const { data, error } = await supabase
        .from("unit")
        .select("*")
        .eq("accommodation_id", accommodationId)
        .eq("unit_status", "active");

      if (error) {
        return { data: null, error: error.message };
      }
      return { data: data as Unit[], error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },

  // list all ACTIVE UNITS (no accommodation filter)
  async listUnits(
    accommodationId: string,
    supabaseClient?: SupabaseClient
  ): Promise<ServiceResult<Unit[]>> {
    try {
      const supabase = supabaseClient || (await createSupabaseServerClient());
      const { data, error } = await supabase
        .from("unit")
        .select("*")
        .eq("unit_status", "active");

      if (error) {
        return { data: null, error: error.message };
      }
      return { data: data as Unit[], error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }
};