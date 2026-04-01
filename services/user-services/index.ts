import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { AccomodationHistory } from "@/types/accomodation/accomodationHistory";

//-----ACCOMODATION SERVICES-----//
// FUNCTION:   Get accomodation history
export async function getAccomodationHistory(user_id: string) { 
    const supabase = await createSupabaseServerClient();
     const { data, error } = await supabase
    .from("accommodation_application")
    .select(`
      application_id,
      date_submitted,
      preferred_accommodation,
      preferred_unit_type,
      duration_of_stay,
      check_in,
      check_out,
      number_of_companions,
      application_status,
      accommodation_assignment ( 
        assignment_id,
        move_in_date,
        expected_move_out_date,
        actual_move_out_date,
        assignment_status
      )
    `)
    .eq("user_id", user_id)
    .order("date_submitted", { ascending: false });

     const flattened = data?.map(({ accommodation_assignment, ...app }) => ({ // eradicates nested values
    ...app,
    ...(accommodation_assignment ?? { // if accommodation_assignment is null, provide default values
      assignment_id: null,
      move_in_date: null,
      expected_move_out_date: null,
      actual_move_out_date: null,
      assignment_status: null,
    }),
  }));

  return { data: (flattened as unknown) as AccomodationHistory[] | null ?? null, error };
}

//-----DOCUMENT  SERVICES-----//