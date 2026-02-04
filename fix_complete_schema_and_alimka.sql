
-- =================================================================
-- FIX COMPLETE SCHEMA & RELOAD CACHE
-- Jalankan script ini untuk mengatasi "Database error querying schema"
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PASTIKAN TIPE DATA ADA
DO $$ BEGIN
    CREATE TYPE semester_enum AS ENUM ('1', '2', 'Ganjil', 'Genap');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE teacher_role_enum AS ENUM ('CLASS_TEACHER', 'SUBJECT_TEACHER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PASTIKAN TABEL SEKOLAH ADA & ADA ISINYA (Untuk Foreign Key)
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    level VARCHAR(20) DEFAULT 'SMA'
);

INSERT INTO schools (name, level) 
SELECT 'SMA Negeri 1 Merdeka', 'SMA'
WHERE NOT EXISTS (SELECT 1 FROM schools LIMIT 1);

-- 3. PERBAIKAN STRUKTUR TABEL TEACHERS (ADD MISSING COLUMNS)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'SMA';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS active_academic_year VARCHAR(20) DEFAULT '2025/2026';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS active_semester semester_enum DEFAULT '1';

-- Update kolom yang null agar tidak error saat select
UPDATE teachers SET level = 'SMA' WHERE level IS NULL;
UPDATE teachers SET is_active = FALSE WHERE is_active IS NULL;
UPDATE teachers SET is_active = TRUE WHERE role = 'ADMIN';

-- 4. FORCE RELOAD SCHEMA CACHE (SOLUSI UTAMA ERROR QUERYING SCHEMA)
-- Memberitahu PostgREST untuk membaca ulang struktur tabel
NOTIFY pgrst, 'reload config';

-- 5. RE-SEED USER ALIMKA (Pastikan data benar)
DO $$
DECLARE
    new_user_id UUID := uuid_generate_v4();
    target_email TEXT := 'alimka@siguru.com';
    target_pass TEXT := 'alimka123';
    default_school_id UUID;
BEGIN
    SELECT id INTO default_school_id FROM schools LIMIT 1;

    -- Cek User Auth
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
        -- Insert Auth
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
            target_email, crypt(target_pass, gen_salt('bf')), 
            now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ibu Alimka"}', 
            now(), now()
        );

        -- Insert Identity
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, 
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(), new_user_id, 
            jsonb_build_object('sub', new_user_id, 'email', target_email), 
            'email', new_user_id::text, 
            now(), now(), now()
        );

        -- Insert/Update Teacher Profile
        IF EXISTS (SELECT 1 FROM public.teachers WHERE email = target_email) THEN
             UPDATE public.teachers 
             SET user_id = new_user_id, is_active = TRUE, level = 'SMA', school_id = default_school_id
             WHERE email = target_email;
        ELSE
             INSERT INTO public.teachers (user_id, email, full_name, role, level, is_active, school_id)
             VALUES (new_user_id, target_email, 'Ibu Alimka', 'SUBJECT_TEACHER', 'SMA', TRUE, default_school_id);
        END IF;

        RAISE NOTICE 'User Alimka dibuat baru.';
    ELSE
        -- User Auth sudah ada, pastikan Teacher Profile aktif
        UPDATE public.teachers 
        SET is_active = TRUE, level = 'SMA', school_id = default_school_id
        WHERE email = target_email;
        
        RAISE NOTICE 'User Alimka sudah ada, profile diperbarui aktif.';
    END IF;
END $$;
