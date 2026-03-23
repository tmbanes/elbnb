// USER UTILITY FUNCTIONS
// import { supabase } from "./supabase/supabaseClient";
// import { NextRequest, NextResponse } from "next/server";
// import { User } from "@/types/user.types";


//----READ FUNCTIONS----

// FUNCTION : Get current authenticated user
// async function getCurrentUser(): Promise<User | string> {
//     try {
//         const {data: {user}, error}= await supabase.auth.getUser(); 
//         if (error) throw error; // if there's an error, throw it to be caught in the catch block
//         if (!user) return "No authenticated user found"; // if no user is found, return a message

//         const { data } = await supabase.from("USER").select("*").eq("id", user.id).single(); // fetch user data from USER table using the authenticated user's ID
        
// }
// }

//----CREATE FUNCTIONS----

//