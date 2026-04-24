// /services/student_profile/index.ts

import { createSupabaseServerClient as supabase } from "@/lib/supabase/server-client";
import {
  UserProfile,
  AccommodationAssignment,
  AccommodationApplication,
} from "@/types/student_profile";

export const studentProfileService = {
  async getProfile(user_id: string) {
    const client = await supabase();
    const { data, error } = await client
      .from("USER")
      .select("*")
      .eq("user_id", user_id)
      .single();

    return { data: data as UserProfile | null, error };
  },

  async updateProfile(user_id: string, updates: Partial<UserProfile>) {
    const client = await supabase();
    const { data, error } = await client
      .from('USER')
      .update({
        // only the name can be changed (as of now ??), nacheck ko rin supabase, srs, and specs, either not indicated/not possible
        first_name: updates.first_name,
        last_name: updates.last_name,
        middle_name: updates.middle_name,
      })
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
    }

    return { data: data as UserProfile | null, error };
  },

  // export interface AccommodationAssignment {
  //     assignment_id: string;
  //     move_In_Date: string;
  //     expected_Move_Out_Date: string;
  //     actual_Move_Out_Date?: string | null;
  //     application_id: string;

  //     // optional for history checker
  //     application?: {
  //     preferred_Unit_Type: string;
  //     preferred_Accomodation: string;
  //     };

  async getMyAssignment(application_id: string) {
    const client = await supabase();
    const { data, error } = await client
      .from("accommodation_assignment")
      .select(
        `
        assignment_id,
        move_in_date,
        expected_move_out_date,
        actual_move_out_date,
        application_id
      `,
      )
      .eq("application_id", application_id)
      .single();

    return { data: data as AccommodationAssignment | null, error };
  },

  /*

for reference:
https://supabase.com/docs/reference/javascript/storage-from-upload
https://supabase.com/docs/reference/javascript/insert
not yet tested


// */

  // const avatarFile = event.target.files[0]
  // const { data, error } = await supabase
  //   .storage
  //   .from('avatars')
  //   .upload('public/avatar1.png', avatarFile, {
  //     cacheControl: '3600',
  //     upsert: false
  //   })

  // async uploadDocument(user_id: string, application_id: string, file: File){
  //   const filePath = `${user_id}/${application_id}/${file.name}`;

  //   const { data: storageData}

  // }

  async uploadDocument(user_id: string, application_id: string, file: File) {
    const client = await supabase();
    /*
    const avatarFile = event.target.files[0]
    const { data, error } = await client
      .storage
      .from('avatars')
      .upload('public/avatar1.png', avatarFile, {
        cacheControl: '3600',
        upsert: false
      })
    */

    const filePath = `${user_id}/${application_id}/${file.name}`;
    const { data: storageData, error: storageError } = await client.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // for overwriting
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      return { data: null, error: storageError };
    }

    // added document successfully
    const { data: dbData, error: dbError } = await client
      .from("Document")
      .insert({
        user_id: user_id,
        application_id: application_id,
        file_name: file.name,
        file_type: file.type,
        file_url: storageData.path,
        // status: 'Uploaded' na dpat (to be updated!!!)
      })
      .select()
      .single();

    return { data: dbData, error: dbError };
  },

  // https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas

  /*

  export interface AccommodationApplication {
      application_id: string;
      preferred_Accomodation: string;
      preferred_Unit_Type: string;
      date_Submitter: string; // pacheck if submitter ba talaga un or submitted
      duration_Of_Stay: number | null; 
      check_In: string | null;        
      check_Out: string | null;        
      number_Of_Companions: number | null;

      // https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas
      // no status ???? (acc supabase database)
      accomodation_assignment?: AccommodationAssignment | null; 
  }
  */

  async getAccommodationHistory(user_id: string) {
    const client = await supabase();
    const { data, error } = await client
      .from("accommodation_application")
      .select(`
        application_id,
        application_status,
        preferred_accommodation_id,
        preferred_unit_type,
        date_submitted,
        duration_of_stay,
        check_in,
        check_out,
        number_of_companions,
        accommodation:preferred_accommodation_id (
          name,
          accommodation_type
        ),
        unit:unit_id (
          unit_number
        ),
        accommodation_assignment (
          actual_move_out_date
        )
      `)
      .eq("user_id", user_id)
      .order("date_submitted", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
    }

    return { data: data as AccommodationApplication[] | null, error };
  },

  // added for the cancel modal in the history and status page, 
  // to update the application_status to "cancelled" when the user cancels their pending application (pending_admin or pending_dorm_manager)
  async cancelAccommodationApplication(application_id: string) {
    const client = await supabase();

    const { data, error } = await client
      .from("accommodation_application")
      .update({ application_status: "cancelled" })
      .eq("application_id", application_id)
      .select()
      .single();

    if (error) {
      console.error("Error canceling application:", error);
      return { data: null, error };
    }

    return { data, error: null };
  },
};

/*
notes:
- date_Submitter or date_Submitted
- no status yet (??)
- not yet tested
- not sure yet for update sa students (only the name can be changed (as of now ??), nacheck ko rin supabase, srs, and specs, either not indicated/not possible)
*/
