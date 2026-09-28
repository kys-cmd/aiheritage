import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Environment variables
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://oxtizbezemnptiuifgtv.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dGl6YmV6ZW1ucHRpdWlmZ3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MDkxNjMsImV4cCI6MjEwNTk4NTE2M30.z6rvHAmcFzhIge3RbQrrlQ4ALCQKiYnsk-Q7Ygy5khA';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

// Fallback client or active instance
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
