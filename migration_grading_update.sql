
-- =================================================================
-- MIGRATION: GRADING & ACADEMIC CONTEXT
-- Jalankan script ini di SQL Editor Supabase
-- =================================================================

-- 1. Tambahkan ENUM untuk Tipe Asesmen
DO $$ BEGIN
    CREATE TYPE assessment_type_enum AS ENUM ('FORMATIVE', 'SUMMATIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update Tabel Kriteria Penilaian
-- Menambahkan kolom 'type' untuk membedakan Nilai TP (Formatif) dan Nilai Sumatif
ALTER TABLE assessment_criteria 
ADD COLUMN IF NOT EXISTS type assessment_type_enum DEFAULT 'FORMATIVE';

-- 3. Update Tabel Guru
-- Menyimpan konteks tahun ajaran dan semester aktif agar persisten saat reload/export
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS active_academic_year VARCHAR(20) DEFAULT '2025/2026',
ADD COLUMN IF NOT EXISTS active_semester semester_enum DEFAULT '1';

-- 4. Update Tabel Jurnal
-- Menambahkan kolom subject_name (denormalisasi) untuk memudahkan query report tanpa join berat
-- (Opsional, tapi membantu performa export Excel)
ALTER TABLE journals
ADD COLUMN IF NOT EXISTS subject_name VARCHAR(100);

-- =================================================================
-- CONTOH DATA SEEDING (Update data lama jika ada)
-- =================================================================

-- Set semua kriteria lama sebagai FORMATIVE (Default)
UPDATE assessment_criteria SET type = 'FORMATIVE' WHERE type IS NULL;

-- Contoh: Tambahkan 1 kriteria Sumatif untuk testing
-- INSERT INTO assessment_criteria (tp_id, code, description, type)
-- VALUES ('<tp_uuid>', 'SAS', 'Sumatif Akhir Semester', 'SUMMATIVE');
