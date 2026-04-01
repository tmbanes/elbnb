import { getSupabaseBrowserClient } from "../../lib/supabase/browser-client";
import { UserCreationRequest, GuestCreationRequest, StudentCreationRequest, DormitoryManagerCreationRequest } from "@/types/auth/user.types";


// VARIABLE: Browser client instance
const browserClient = getSupabaseBrowserClient(); 

// FUNCTION: Sign up with email and password [To-Do: Test]
async function signUpWithEmail(userData: UserCreationRequest) { 

    const { email, password, ...userMetadata} = userData
    const { data, error } = await browserClient.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/welcome`,
            data: { ...userMetadata } // pass all metadata including its subclass
        }
    });
    console.log('Supabase response:', { data, error }) // [DEBUGGING LOG] to check the response from Supabase
    if (error) return { success: false, error: error.message };

    if (data.user && data.user.identities?.length === 0) { // If email was already taken 
    return { success: false, error: "This email is already taken!" };
    }

    // VARIABLE: userId to be used in inserting a row in users table
    return { success: true, userId: data.user?.id };
}

// FUNCTION: Sign Up as guest 
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
async function signInWithEmail({ email, password} : { email: string, password: string }) {
    const { data, error } = await browserClient.auth.signInWithPassword({ email, password });
    console.log('Supabase response:', { data, error }) // [DEBUGGING LOG] to check the response from Supabase
    if (error) return { success: false, error: error.message };
    return { success: true };
}   

// FUNCTION: to sign in/sign up using Google [instantly creates User if they don't exist in DB ]
async function signInWithGoogle(next = '/') {
    const { error } = await browserClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
        queryParams: {
            hd: 'up.edu.ph',  // only allow UP mail sign in (restrict to UP domain)
        },
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        }
    });
    if (error) {
        console.error('[ERROR] signing in with Google:', error.message);
        return { success: false, error: error.message}
    }
    return { success: true }
}

// FUNCTION: to sign out
async function signOut() {
    const { error } = await browserClient.auth.signOut();    
    if (error) {
        console.error('[ERROR] signing out:', error.message);
    }
}



export {signInWithGoogle , signOut, signUpWithEmail, signUpAsGuest, signUpAsStudent, createDormitoryManager,signInWithEmail };
