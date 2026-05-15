
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnitsSchema() {
    console.log('Checking units table...');
    
    const { data, error } = await supabase
        .from('unit')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching units:', error);
    } else {
        console.log('Columns in units:', Object.keys(data[0] || {}));
    }
}

checkUnitsSchema();
