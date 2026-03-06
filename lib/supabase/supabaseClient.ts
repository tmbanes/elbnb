import {createClient, SupabaseClient} from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY as string;

console.log('Supabase URL:', supabaseUrl); // Debug log to verify environment variable is loadeds
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey); // create client instance