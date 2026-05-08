-- ==========================================
-- MASTER SCHEMA SIGURU - FRESH DEPLOYMENT
-- ==========================================

-- Pastikan UUID extension berjalan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel User Profil (Teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SUBJECT_TEACHER', -- 'ADMIN', 'HOMEROOM_TEACHER', 'SUBJECT_TEACHER'
    level TEXT NOT NULL DEFAULT 'SMA', -- 'SD', 'SMP', 'SMA'
    is_active BOOLEAN NOT NULL DEFAULT true,
    nip TEXT,
    active_semester TEXT DEFAULT '1',
    active_academic_year TEXT DEFAULT '2025/2026',
    school_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Setup Admin Default (Auth & Profile)
DO $$
DECLARE
    admin_uid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Masukkan ke auth.users (Supabase native auth)
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        role, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        admin_uid,
        '00000000-0000-0000-0000-000000000000',
        'admin@siguru.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"System Admin"}',
        now(), now(), 'authenticated', '', '', '', ''
    ) ON CONFLICT (id) DO UPDATE SET 
        encrypted_password = crypt('admin123', gen_salt('bf')),
        email = EXCLUDED.email;

    -- Masukkan ke public.teachers (Profile)
    INSERT INTO public.teachers (id, email, full_name, role, level, is_active)
    VALUES (admin_uid, 'admin@siguru.com', 'System Admin', 'ADMIN', 'SMA', true)
    ON CONFLICT (id) DO UPDATE SET
        role = 'ADMIN',
        full_name = 'System Admin',
        is_active = true,
        email = 'admin@siguru.com';
END $$;
