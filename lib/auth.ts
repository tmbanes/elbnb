import { supabase } from "./supabase/supabaseClient";
import { UserCreationRequest } from "@/types/user.types";


// FUNCTION: Sign up with email and password [To-Do: Test]
async function signUpWithEmail(userData: UserCreationRequest) { 
    const { email, password, first_name, last_name, middle_name, role, user_status } = userData
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { first_name, last_name, middle_name, role, user_status }
        }
    });
    console.log('Supabase response:', { data, error }) // [DEBUGGING LOG] to check the response from Supabase
    if (error) return { success: false, error: error.message };

    if (data.user && data.user.identities?.length === 0) { // If email was already taken 
    return { success: false, error: "This email is already taken!" };
    }

    return { success: true };
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



export {signUpWithEmail, signInWithGoogle, signInWithEmail , signOut };