import { createClient } from '@supabase/supabase-js';

// Helper to safely get environment variables
const getEnvVar = (key: string) => {
  try {
    // Try import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    // Try process.env (Webpack/Create React App/Node)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    console.warn('Error reading env var', e);
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL atau Anon Key belum diset di environment variables. Pastikan file .env ada dan terisi.");
}

// Fallback to prevent crash on init if keys are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
