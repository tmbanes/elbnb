import { supabase } from '@/lib/supabase/supabaseClient'; 
import { UserProfile, AccommodationAssignment } from '@/types/student_profile';

export const studentProfileService = {


  async getProfile(user_id: string) {
    const { data, error } = await supabase
      .from('USER')
      .select('*')
      .eq('user_id', user_id)
      .single();

    return { data: data as UserProfile | null, error };
  },


  async updateProfile(user_id: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('USER')
        .update({
          // only the name can be changed (as of now ??), nacheck ko rin supabase, srs, and specs, either not indicated/not possible
        first_name: updates.first_name,
        last_name: updates.last_name,
        middle_name: updates.middle_name,
      })
      .eq('user_id', user_id)
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

  async getMyAssignment(application_id: string) {
    const { data, error } = await supabase
      .from('accomodation_assignment')
      .select(`
        assignment_id,
        move_In_Date,
        expected_Move_Out_Date,
        actual_Move_Out_Date,
        application_id
      `)
      .eq('application_id', application_id)
      .single();

    return { data: data as AccommodationAssignment | null, error };
  },



/*

for reference:
https://supabase.com/docs/reference/javascript/storage-from-upload
https://supabase.com/docs/reference/javascript/insert
not yet tested - NOT YET WORKING (NO INTERFACE YET FOR ACCOMODATION_APPLICATION)

hindi pa makakapagselect from supabase


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

    /*
    const avatarFile = event.target.files[0]
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .upload('public/avatar1.png', avatarFile, {
        cacheControl: '3600',
        upsert: false
      })
    */
    
    const filePath = `${user_id}/${application_id}/${file.name}`;
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // for overwriting
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      return { data: null, error: storageError };
    }

    // added document successfully
    const { data: dbData, error: dbError } = await supabase
      .from('Document')
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

  
  

};

