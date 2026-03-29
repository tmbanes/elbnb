  import { Accommodation, Unit } from "@/types/accommodation_units";
  import { SupabaseClient } from "@supabase/supabase-js";
  import { createSupabaseServerClient } from "@/lib/supabase/server-client";

  type ServiceResult<T> = {
    data: T | null;
    error: string | null;
  };

  export const UnitAccomodationsDisplayService = {
    // lists all ACTIVE ACCOMMODATIONS
    async listAccomodations(supabaseClient?: SupabaseClient): Promise<ServiceResult<Accommodation[]>> {
      try {
        // Use provided client (for testing) or create new one
        const supabase = supabaseClient || (await createSupabaseServerClient());
        const { data, error } = await supabase
          .from("accommodation")
          .select("*")
          .eq("accommodation_status", "active");

        if (error) {
          return { data: null, error: error.message };
        }
        return { data: data as Accommodation[], error: null };
      } catch (error) {
        return { data: null, error: (error as Error).message };
      }
      },
      
      // list all ACTIVE UNITS for a given ACCOMMODATION input
      async listUnitsForAccomodation(accommodationId: string, supabaseClient?: SupabaseClient): Promise<ServiceResult<Unit[]>> {
        try {
          // Use provided client (for testing) or create new one
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
        }
        catch (error) {
          return { data: null, error: (error as Error).message };
        }
      },

      // list all ACTIVE UNITS (no accommodation filter)
      async listUnits(accommodationId: string, supabaseClient?: SupabaseClient): Promise<ServiceResult<Unit[]>> {
        try {
          // Use provided client (for testing) or create new one
          const supabase = supabaseClient || (await createSupabaseServerClient());
          const { data, error } = await supabase
            .from("unit")
            .select("*")
            .eq("unit_status", "active");

          if (error) {
            return { data: null, error: error.message };
          }
          return { data: data as Unit[], error: null };
        }
        catch (error) {
          return { data: null, error: (error as Error).message };
        }
      }
  };