import { supabase } from '@/lib/supabase/supabaseClient'; 
import { UserProfile, AccommodationAssignment } from '@/types/student_profile';

export const studentProfileService = {


  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('USER')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data: data as UserProfile | null, error };
  },


  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('USER')
        .update({
          // only the name can be changed (as of now ??), nacheck ko rin supabase, srs, and specs, either not indicated/not possible
        first_name: updates.first_name,
        last_name: updates.last_name,
        middle_name: updates.middle_name,
      })
      .eq('user_id', userId)
      .select()
      .single();

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

  async getMyAssignment(applicationId: string) {
    const { data, error } = await supabase
      .from('accomodation_assignment')
      .select(`
        assignment_id,
        move_In_Date,
        expected_Move_Out_Date,
        actual_Move_Out_Date,
        application_id
      `)
      .eq('application_id', applicationId)
      .single();

    return { data: data as AccommodationAssignment | null, error };
  }
};