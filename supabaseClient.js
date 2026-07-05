//import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://oideqchfbloxeweleqae.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fYVRKkPJoJeEE-cT9G7Neg_tW9UT2G8";

const supabaseLibrary = window.supabase;

if (!supabaseLibrary) {
    throw new Error("supase CDN script failed to load.");
}

export const supabaseClient = supabaseLibrary.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


