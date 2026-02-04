
-- =================================================================
-- SUPER FIX: SCHEMA & USER ALIMKA
-- Jalankan script ini di SQL Editor Supabase
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PERBAIKAN STRUKTUR DATABASE (Mengatasi error "querying schema")
-- Memastikan kolom 'level' dan 'is_active' benar-benar ada di tabel teachers
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'SMA';

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Update admin agar konsisten datanya
UPDATE teachers SET level = 'SMA', is_active = TRUE WHERE role = 'ADMIN';


-- 2. BUAT USER "ALIMKA" MANUAL (Agar bisa login langsung)
DO $$
DECLARE
    new_user_id UUID := uuid_generate_v4();
    target_email TEXT := 'alimka@siguru.com';
    target_pass TEXT := 'alimka123';
BEGIN
    -- Cek apakah user Auth sudah ada?
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
        
        -- A. Insert ke AUTH.USERS (Sistem Login)
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

        -- B. Insert ke AUTH.IDENTITIES
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, 
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(), new_user_id, 
            jsonb_build_object('sub', new_user_id, 'email', target_email), 
            'email', new_user_id::text, 
            now(), now(), now()
        );

        -- C. Insert/Link ke PUBLIC.TEACHERS (Data Profil)
        -- Cek jika data teacher sudah ada (misal bekas add manual admin)
        IF EXISTS (SELECT 1 FROM public.teachers WHERE email = target_email) THEN
            UPDATE public.teachers 
            SET user_id = new_user_id, is_active = TRUE, level = 'SMA'
            WHERE email = target_email;
        ELSE
            INSERT INTO public.teachers (user_id, email, full_name, role, level, is_active)
            VALUES (new_user_id, target_email, 'Ibu Alimka', 'SUBJECT_TEACHER', 'SMA', TRUE);
        END IF;

        RAISE NOTICE 'User Alimka berhasil diperbaiki/dibuat. Silahkan login.';
    
    ELSE
        -- Jika user auth sudah ada, pastikan data di public.teachers sinkron & aktif
        -- Ini mengatasi kasus login gagal karena status PENDING
        UPDATE public.teachers 
        SET is_active = TRUE, level = 'SMA' 
        WHERE email = target_email;
        
        RAISE NOTICE 'User Alimka sudah ada, status dipastikan AKTIF dan LEVEL ada.';
    END IF;
END $$;
