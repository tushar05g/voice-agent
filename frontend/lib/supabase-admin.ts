import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// This client bypasses RLS completely. ONLY use it on the server (API routes), never in the browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
