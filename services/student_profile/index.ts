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
      .from("users")
      .select("*")
      .eq("user_id", user_id)
      .single();

    return { data: data as UserProfile | null, error };
  },

  async updateProfile(user_id: string, updates: Partial<UserProfile>) {
    const client = await supabase();
    const { data, error } = await client
      .from('users')
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
      .from("documents")
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

  async getDocuments(user_id: string) {
    const client = await supabase();

    const { data, error } = await client
      .from("documents")
  async getCurrentAccommodation(user_id: string) {
      const client = await supabase();
      const { data, error } = await client
        .from("accommodation_assignment")
        .select(`
        assignment_id,
        move_in_date,
        expected_move_out_date,
        assignment_status,
        unit:unit_id (
          unit_number,
          unit_type,
          accommodation:accommodation_id (
            name,
            location,
            renewal_start_date,
            renewal_end_date
          )
        )
      `)
        .eq("user_id", user_id)
        .in("assignment_status", ["active", "waiting_payment", "pending"])
        .maybeSingle();

      return { data, error };
    },

  async getDashboardStats(user_id: string) {
      const client = await supabase();

      // Get summary of bills
      const { data: billingData } = await client
        .from("billing")
        .select("amount, status, accommodation_assignment!inner(user_id)")
        .eq("accommodation_assignment.user_id", user_id);

      let totalBalance = 0;
      billingData?.forEach(bill => {
        if (bill.status !== 'paid') totalBalance += bill.amount;
      });

      // Get latest application
      const { data: latestApp } = await client
        .from("accommodation_application")
        .select("application_status, date_submitted")
        .eq("user_id", user_id)
        .order("date_submitted", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        totalBalance,
        latestApplicationStatus: latestApp?.application_status || null,
      };
    },

  async getDocuments(user_id: string) {
      const client = await supabase();
      const { data, error } = await client
        .from("Document")
        .select("*")
        .eq("user_id", user_id);

      return { data, error };
    },

  async createExtensionApplication(user_id: string, currentResidency: any) {
      const client = await supabase();

      const { data, error } = await client
        .from("accommodation_application")
        .insert({
          user_id: user_id,
          preferred_accommodation_id: currentResidency.unit.accommodation.accommodation_id,
          unit_id: currentResidency.unit.unit_id,
          preferred_unit_type: currentResidency.unit.unit_type,
          application_status: "pending_dorm_manager",
          date_submitted: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error };
    },

  async getNotifications(user_id: string) {
      const client = await supabase();
      const { data, error } = await client
        .from("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (error) {
        // PGRST116 is the error code for 'relation not found' (table missing)
        if ((error as any).code === 'PGRST116' || error.message?.includes('Could not find the table')) {
          console.warn("Documents table is missing in Supabase. Returning empty array.");
          return { data: [], error: null };
        }
        console.error("Error fetching documents:", error.message, error.details, error.hint);
      }

      return { data, error };
    },
    return { data, error };
  }
};

/*
notes:
- date_Submitter or date_Submitted
- no status yet (??)
- not yet tested
- not sure yet for update sa students (only the name can be changed (as of now ??), nacheck ko rin supabase, srs, and specs, either not indicated/not possible)
*/
