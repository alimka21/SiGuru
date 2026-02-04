
-- =================================================================
-- MIGRATION: FUNGSI MEMBUAT USER OLEH ADMIN
-- Jalankan script ini di SQL Editor Supabase
-- =================================================================

-- 1. Aktifkan ekstensi enkripsi (biasanya sudah aktif)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buat Fungsi RPC (Remote Procedure Call)
-- Fungsi ini berjalan dengan hak akses superuser (SECURITY DEFINER)
-- sehingga bisa insert ke auth.users
CREATE OR REPLACE FUNCTION create_new_user(
    email TEXT,
    password TEXT,
    full_name TEXT,
    role TEXT,
    level TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    encrypted_pw TEXT;
    caller_role TEXT;
BEGIN
    -- A. Cek Hak Akses: Hanya user dengan role 'ADMIN' di tabel teachers yang boleh memanggil fungsi ini
    SELECT t.role INTO caller_role
    FROM public.teachers t
    WHERE t.user_id = auth.uid();

    IF caller_role IS DISTINCT FROM 'ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized: Hanya Admin yang bisa menambah user.';
    END IF;

    -- B. Cek apakah email sudah ada
    IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = create_new_user.email) THEN
        RAISE EXCEPTION 'Email sudah terdaftar.';
    END IF;

    -- C. Generate ID dan Enkripsi Password
    new_user_id := uuid_generate_v4();
    encrypted_pw := crypt(password, gen_salt('bf'));

    -- D. Insert ke auth.users (Membuat akun login)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        now(), -- Langsung confirm email
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', full_name, 'role', role, 'level', level),
        now(),
        now()
    );

    -- E. Insert ke auth.identities (Agar user bisa login via email)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        uuid_generate_v4(),
        new_user_id,
        jsonb_build_object('sub', new_user_id, 'email', email),
        'email',
        new_user_id::text,
        now(),
        now(),
        now()
    );

    -- F. Insert ke public.teachers (Data Profil Aplikasi)
    -- Status langsung ACTIVE (TRUE) karena dibuat oleh Admin
    INSERT INTO public.teachers (
        user_id,
        email,
        full_name,
        role,
        level,
        is_active,
        school_id
    ) VALUES (
        new_user_id,
        email,
        full_name,
        role::teacher_role_enum, -- Casting ke enum
        level,
        TRUE, -- Admin created = Auto Active
        (SELECT school_id FROM teachers WHERE user_id = auth.uid() LIMIT 1) -- Samakan sekolah dengan admin
    );

    RETURN json_build_object('id', new_user_id, 'email', email);
END;
$$;
