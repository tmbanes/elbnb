// /services/server/auth.ts
import {
  DormitoryManagerCreationRequest,
  StudentCreationRequest,
  UserCreationRequest,
} from "@/types/user.types";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLog, getCurrentUserRole } from "../activity_log/server";

// FUNCTION: Sign up with email and password [To-Do: Test]
export async function createUserProfile(userData: UserCreationRequest) {
  const supabase = await createSupabaseServerClient();
  const { email, password, ...userMetadata } = userData;

  //test: set to inactive
  const metadata = {
    ...userMetadata,
    user_status: userData.user_status ?? "inactive",
  };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    console.log("Supabase response:", { data, error });

    if (error) {
      // If user is already registered
      if (error.message.includes("User already registered")) {
        return { success: false, error: "This email is already taken!" };
      }
      return { success: false, error: error.message };
    }

    // If no user is returned
    if (!data.user) {
      return { success: false, error: "Signup failed, no user returned" };
    }

    // Return id and session
    const result = {
      success: true,
      userId: data.user.id,
      session: data.session || null, // null if email verification required
      emailVerificationRequired: data.session === null,
    };

    // Log the user creation
    await createActivityLog({
      p_user_id: data.user.id,
      p_action_type: "create_user",
      p_log_desc: `${userMetadata.first_name} ${userMetadata.last_name} created their account`,
      p_entity_type: "user",
      p_entity_id: data.user.id,
      p_user_role: userMetadata.role || "guest",
    });

    return result;
  } catch (err: any) {
    console.error("Unexpected signup error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// FUNCTION: Sign Up as student
export async function createStudentProfile(
  studentData: StudentCreationRequest,
) {
  return createUserProfile({
    ...studentData,
    role: "student",
  });
}

// FUNCTION: Create dormitory manager [ADMIN ROLE ONLY]
export async function createDormitoryManager(
  managerData: DormitoryManagerCreationRequest,
) {
  return createUserProfile({
    ...managerData,
    role: "dormitory_manager",
  });
}

// FUNCTION: Sign in with email and password [To-Do: Test]
export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log("Supabase response:", { data, error }); // [DEBUGGING LOG] to check the response from Supabase
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// FUNCTION: to sign out
export async function signOut() {
  const user = await getCurrentUserRole();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[ERROR] signing out:", error.message);
  } else if (user) {
    await createActivityLog({
      p_user_id: user.userId,
      p_action_type: "logout",
      p_log_desc: `${user.first_name} logged out`,
      p_entity_type: "auth",
      p_entity_id: user.userId,
      p_user_role: user.role,
    });
  }
}


// FUNCTION: to delete user account, ensure it is done only by the user themselves or by an admin
// export async function deleteUser() {
//   const supabase = await createSupabaseServerClient();
//   const {data,error} = await supabase.auth.admin.deleteUser(supabase.auth.getUser()? || '');

// }