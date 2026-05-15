
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SECRET_KEY is required to check schema');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking tables...');
    
    // We can't easily list all tables via the JS client without SQL access,
    // but we can try to query some common names or use a RPC if available.
    // However, I'll try to just check the columns of 'accommodation' first.
    
    const { data, error } = await supabase
        .from('accommodation')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching accommodation:', error);
    } else {
        console.log('Columns in accommodation:', Object.keys(data[0] || {}));
    }

    // Check for accommodation_images table
    const { data: imgData, error: imgError } = await supabase
        .from('accommodation_images')
        .select('*')
        .limit(1);

    if (imgError) {
        console.log('accommodation_images table might not exist:', imgError.message);
    } else {
        console.log('accommodation_images table exists! Columns:', Object.keys(imgData[0] || {}));
    }
}

checkSchema();
