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

    // catch error
    if (error) {
      console.error("Error fetching accommodation history:", error);
      return { data: null, error };
    }

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

export async function insertDocument( 
    user_id: string,  // FLOW: append existing user_id and application_id so it can be referenced in the db.
    application_id: string,
    doc_name: string,
    file_url: string, 
    document_type: string) {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
    .rpc("insert_document_metadata", {
        p_user_id: user_id,
        p_application_id: application_id,
        p_doc_name: doc_name,
        p_file_url: file_url,
        p_document_type: document_type})

    if (error) {
        console.error("Error inserting document metadata:", error);
        return { data: null, error };
    }

  }
    