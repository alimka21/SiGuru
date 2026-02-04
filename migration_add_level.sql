
-- =================================================================
-- MIGRATION: MENAMBAHKAN KOLOM LEVEL (JENJANG)
-- Jalankan script ini di SQL Editor Supabase
-- =================================================================

-- 1. Tambahkan kolom 'level' ke tabel 'teachers'
-- Kita gunakan VARCHAR agar fleksibel (SD, SMP, SMA, SMK)
-- Default kita set 'SMA' agar data lama tidak error
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'SMA';

-- 2. Update kolom level untuk admin agar konsisten
UPDATE teachers 
SET level = 'SMA' 
WHERE role = 'ADMIN';

-- 3. Cek hasil
SELECT full_name, email, role, level FROM teachers;
