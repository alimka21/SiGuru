
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// KONFIGURASI ENVIRONMENT VARIABLES
// ------------------------------------------------------------------
// PENTING: Akses harus ditulis eksplisit (import.meta.env.NAMA_VAR)
// agar Vite dapat melakukan 'static replacement' saat build.
// Jangan membungkusnya dalam objek dinamis atau casting yang kompleks.

let url = '';
let key = '';

// 1. Coba ambil dari Vite (import.meta.env)
try {
  // @ts-ignore - Mengabaikan error TS agar bundler tetap bisa membaca syntax ini
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    url = import.meta.env.VITE_SUPABASE_URL || '';
    // @ts-ignore
    key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch (e) {
  // Hiraukan jika import.meta tidak didukung
}

// 2. Fallback ke Process Env (Node.js / Webpack standar) jika Vite kosong
if (!url || !key) {
  try {
    if (typeof process !== 'undefined' && process.env) {
      url = url || process.env.VITE_SUPABASE_URL || '';
      key = key || process.env.VITE_SUPABASE_ANON_KEY || '';
    }
  } catch (e) {
    // Hiraukan error process
  }
}

// ------------------------------------------------------------------
// VALIDASI & INISIALISASI
// ------------------------------------------------------------------

export const isSupabaseConfigured = !!url && !!key && url !== 'https://placeholder.supabase.co';

if (!isSupabaseConfigured) {
  console.error("CRITICAL: Supabase Configuration Missing!");
  console.log("Debug URL:", url ? "Set (Hidden)" : "Empty");
  console.log("Debug Key:", key ? "Set (Hidden)" : "Empty");
  console.warn("Tips: Jika di Vercel, pastikan sudah 'Redeploy' setelah menambah Environment Variables.");
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co', 
  key || 'placeholder'
);
