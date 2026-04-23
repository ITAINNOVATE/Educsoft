const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL or SUPABASE_KEY is missing in backend .env");
    // Mock to avoid crash
    supabase = null;
} else {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;
