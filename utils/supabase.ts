import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// KONFIGURASI ENVIRONMENT VARIABLES
// ------------------------------------------------------------------

let supabaseUrl = '';
let supabaseAnonKey = '';

// Akses import.meta.env dengan aman
// Menggunakan try-catch dan pengecekan eksistensi untuk menghindari error "Cannot read properties of undefined"
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (error) {
  console.warn('Environment variables (import.meta.env) tidak tersedia.');
}

// ------------------------------------------------------------------
// VALIDASI & INISIALISASI
// ------------------------------------------------------------------

// Cek apakah variabel sudah terisi
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co';

// Logging status konfigurasi
if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase Configuration Missing.");
  console.log("Aplikasi berjalan dalam Mode Demo.");
} else {
  console.log("✅ Supabase Configured");
}

// Buat client Supabase
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);