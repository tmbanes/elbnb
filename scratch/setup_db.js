const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SECRET_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    console.log('Setting up accommodation_images table...');
    
    // Attempt to create the table via a SQL RPC if available, 
    // or just check if it exists and inform the user.
    // Since we don't have a direct SQL tool, we rely on the user having 
    // the table or we provide the SQL.
    
    const sql = `
        CREATE TABLE IF NOT EXISTS public.accommodation_images (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            accommodation_id UUID REFERENCES public.accommodation(accommodation_id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            is_primary BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create bucket if not exists
        -- Note: This usually requires different permissions
    `;

    console.log('Please ensure the following SQL is run in your Supabase SQL Editor:');
    console.log(sql);
}

setupDatabase();
