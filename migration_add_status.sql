
-- =================================================================
-- MIGRATION: MENAMBAHKAN STATUS AKTIF/PENDING PENGGUNA
-- Jalankan script ini di SQL Editor Supabase untuk memperbaiki tabel
-- =================================================================

-- 1. Tambahkan kolom 'is_active' ke tabel 'teachers'
-- Default FALSE artinya PENDING (harus di-approve Admin)
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- 2. Pastikan akun dengan role ADMIN selalu Aktif (TRUE)
UPDATE teachers 
SET is_active = TRUE 
WHERE role = 'ADMIN';

-- 3. (Opsional) Jika Anda ingin semua akun guru yang SUDAH ADA sebelumnya 
-- dianggap aktif, jalankan baris di bawah ini. 
-- Jika tidak dijalankan, guru lama harus di-approve admin dulu.
-- UPDATE teachers SET is_active = TRUE WHERE role != 'ADMIN';

-- Konfirmasi hasil
SELECT full_name, email, role, is_active FROM teachers;
