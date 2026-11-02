/**
 * Ethyra Consulting Services - Supabase Client Configuration
 * Initialises and exports the global Supabase client instance.
 */

const SUPABASE_URL = "https://lshpfmperwmdcwavlgfx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHBmbXBlcndtZGN3YXZsZ2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4ODUwMzUsImV4cCI6MjEwODQ2MTAzNX0.kO_xIDmHEGAxk0eQ07NUYtNsrRt2msBVBb3fzzL_3Mw";

let _supabaseInstance = null;

function getSupabase() {
  if (!_supabaseInstance) {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      _supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } else {
      console.error("Supabase SDK is not loaded. Ensure @supabase/supabase-js is included in your page.");
    }
  }
  return _supabaseInstance;
}

// Attach to window for global access across all pages
window.getSupabase = getSupabase;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
