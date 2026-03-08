import { sign } from "crypto";
import { supabase } from "./supabase/supabaseClient";
import { UserCreationRequest, GuestCreationRequest, StudentCreationRequest, DormitoryManagerCreationRequest } from "@/types/user.types";
import { metadata } from "@/app/layout";


// FUNCTION: Sign up with email and password [To-Do: Test]
async function signUpWithEmail(userData: UserCreationRequest) { 
    const { email, password, ...metadata} = userData
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { ...metadata } // pass all metadata including its subclass
        }
    });
    console.log('Supabase response:', { data, error }) // [DEBUGGING LOG] to check the response from Supabase
    if (error) return { success: false, error: error.message };

    if (data.user && data.user.identities?.length === 0) { // If email was already taken 
    return { success: false, error: "This email is already taken!" };
    }

    return { success: true };
}

// FUNCTION: Sign Un as guest 
async function signUpAsGuest(guestData: GuestCreationRequest) {
   return signUpWithEmail({
    ...guestData,
    role: 'guest',
    });
}

// FUNCTION: Sign Up as student
async function signUpAsStudent(studentData: StudentCreationRequest) {   
    return signUpWithEmail({
    ...studentData,
    role: 'student',
    });
}

// FUNCTION: Create dormitory manager [ADMIN ROLE ONLY]
async function createDormitoryManager(managerData: DormitoryManagerCreationRequest) {
    return signUpWithEmail({
    ...managerData,
    role: 'dormitory_manager',
    });
}

// FUNCTION: Sign in with email and password [To-Do: Test]
async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Supabase response:', { data, error }) // [DEBUGGING LOG] to check the response from Supabase
    if (error) return { success: false, error: error.message };
    return { success: true };
}   

// FUNCTION: to sign in/sign up using Google [instantly creates User if they don't exist in DB ]
 async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        hd: 'up.edu.ph',  // only allow UP mail sign in (restrict to UP domain)
      },
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
    if (error) {
        console.error('[ERROR] signing in with Google:', error.message);
    }
}

// FUNCTION: to sign out
async function signOut() {
    const { error } = await supabase.auth.signOut();    
    if (error) {
        console.error('[ERROR] signing out:', error.message);
    }
}



export {signUpAsGuest, signUpAsStudent, createDormitoryManager,signInWithGoogle, signInWithEmail , signOut };