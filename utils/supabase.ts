// utils/supabase.ts
import { createClient } from "@supabase/supabase-js";

const fallbackUrl = 'https://wesgfvldvcxvleyxrksm.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc2dmdmxkdmN4dmxleXhya3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQ2NzUsImV4cCI6MjA4NTc2MDY3NX0.pK1-4Du31K34sNimDZg8o6a-mKJqJN5HsQrMINfqAZs';

// Vite inlines these during build
let envUrl = import.meta.env.VITE_SUPABASE_URL || '';
let envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean up: Hapus quotes, spasi di dalam, trailing slash
envUrl = String(envUrl).replace(/['"]/g, '').replace(/\s/g, '').replace(/\/+$/, '');
envUrl = envUrl.replace(/\/rest\/v1$/, '').replace(/\/auth\/v1$/, '').replace(/\/+$/, '');
envKey = String(envKey).replace(/['"]/g, '').replace(/\s/g, '');

// Gunakan fallback jika env kosong, undefined, atau masih placeholder bawaan
const supabaseUrl = (!envUrl || envUrl === 'undefined' || envUrl.includes('your-project-id')) ? fallbackUrl : envUrl;
const supabaseAnonKey = (!envKey || envKey === 'undefined' || envKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) ? fallbackKey : envKey;


// Validasi sederhana untuk flag UI
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl.startsWith('http');

// Helper Debug: Ambil Project ID dari URL
export const getSupabaseProjectId = () => {
    try {
        if (!supabaseUrl || !supabaseUrl.startsWith('http')) return 'Unknown';
        const url = new URL(supabaseUrl);
        return url.hostname.split('.')[0];
    } catch {
        return 'Invalid URL';
    }
};

// Logging status konfigurasi
if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase Configuration Missing or Invalid. App running in fallback/demo mode.");
  console.log("Current URL:", supabaseUrl);
} else {
  console.log(`✅ Supabase Configured on Project: ${getSupabaseProjectId()}`);
}

// Ensure the URL is valid by parsing it before creating the client
let finalUrl = fallbackUrl;
try {
  if (!supabaseUrl.startsWith('http')) {
     throw new Error("Missing protocol");
  }
  new URL(supabaseUrl);
  finalUrl = supabaseUrl;
} catch (e) {
  console.error("Invalid Supabase URL caught, falling back.", supabaseUrl);
}
console.log("FINAL SUPABASE URL:", JSON.stringify(finalUrl));

// Konfigurasi Supabase Client
export const supabase = createClient(finalUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
