import { createClient } from "@supabase/supabase-js";

// Helper untuk membaca env var dengan aman (Anti-Error TypeScript Vercel)
const getEnv = (key: string, fallback: string) => {
  // 1. Coba Vite Environment (dengan casting 'as any' agar TS tidak rewel)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Abaikan error akses import.meta
  }

  // 2. Coba Process Environment (Standard Node.js/Vercel)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Abaikan error akses process
  }

  // 3. Kembalikan Fallback jika tidak ditemukan
  return fallback;
};

// Konfigurasi URL dan Key dengan Fallback yang diberikan
// Menggunakan .trim() untuk menghapus spasi yang mungkin tidak sengaja terbawa saat copy-paste
const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://wesgfvldvcxvleyxrksm.supabase.co').trim();
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc2dmdmxkdmN4dmxleXhya3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQ2NzUsImV4cCI6MjA4NTc2MDY3NX0.pK1-4Du31K34sNimDZg8o6a-mKJqJN5HsQrMINfqAZs').trim();

// Validasi sederhana untuk flag UI
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co';

// Helper Debug: Ambil Project ID dari URL
export const getSupabaseProjectId = () => {
    try {
        if (!supabaseUrl) return 'Unknown';
        const url = new URL(supabaseUrl);
        // Ambil subdomain (project id)
        return url.hostname.split('.')[0];
    } catch {
        return 'Invalid URL';
    }
};

// Logging status konfigurasi
if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase Configuration Missing. App running in fallback/demo mode.");
} else {
  console.log(`✅ Supabase Configured on Project: ${getSupabaseProjectId()}`);
}

// Konfigurasi Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});