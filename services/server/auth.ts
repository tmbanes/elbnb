// /services/server/auth.ts
import { DormitoryManagerCreationRequest, StudentCreationRequest, UserCreationRequest } from "@/types/user.types";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// FUNCTION: Sign up with email and password [To-Do: Test]
export async function createUserProfile(userData: UserCreationRequest) { 
    const supabase = await createSupabaseServerClient();
    const { email, password, ...userMetadata} = userData
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { ...userMetadata } // pass all metadata including its subclass
        }
    });
    console.log('Supabase response:', { data, error }) // [DEBUGGING LOG] to check the response from Supabase
    // Modified duplicate checker
    if (error) {
        if (error.message.includes("User already registered")) {
            return { success: false, error: "This email is already taken!" };
        }
        return { success: false, error: error.message };
    }

    // VARIABLE: userId to be used in inserting a row in users table
    return { success: true, userId: data.user?.id };
}

// FUNCTION: Sign Up as student
export async function createStudentProfile(studentData: StudentCreationRequest) {   
    return createUserProfile({
    ...studentData,
    role: 'student',
    });
}

// FUNCTION: Create dormitory manager [ADMIN ROLE ONLY]
export async function createDormitoryManager(managerData: DormitoryManagerCreationRequest) {
    return createUserProfile({
    ...managerData,
    role: 'dormitory_manager',
    });
}

// FUNCTION: Sign in with email and password [To-Do: Test]
export async function signInWithEmail({ email, password} : { email: string, password: string }) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Supabase response:', { data, error }) // [DEBUGGING LOG] to check the response from Supabase
    if (error) return { success: false, error: error.message };
    return { success: true };
}   


// FUNCTION: to sign out
export async function signOut() {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();    
    if (error) {
        console.error('[ERROR] signing out:', error.message);
    }
}
