import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-safe initialization
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Check Vercel Environment Variables.");
  // Provide a fallback mock client to prevent app-wide crashes
  supabase = {
    from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: new Error("Supabase not configured") }) }) }),
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
