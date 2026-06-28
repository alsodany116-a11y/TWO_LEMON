import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// This is the public client to be used in client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper for server-side admin operations (like updating configs, fetching all orders)
export const getAdminSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceRoleKey);
};
