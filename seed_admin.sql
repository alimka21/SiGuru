
-- =================================================================
-- LANGKAH 2: SEED USER ADMIN
-- 
-- SYARAT: Pastikan Anda sudah menjalankan 'migration_role.sql' 
--         terlebih dahulu agar role 'ADMIN' dikenali.
-- 
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Login dengan:
--    Email: admin@siguru.com
--    Pass:  admin123
-- =================================================================

-- 1. Pastikan Ekstensi Enkripsi Aktif
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Script Pembuatan User (Atomic Transaction)
DO $$
DECLARE
    new_user_id UUID := uuid_generate_v4();
    school_id_val UUID;
BEGIN
    -- A. Buat/Ambil Sekolah Default untuk Admin
    INSERT INTO schools (name, level)
    VALUES ('Sekolah Administrator', 'SMA')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO school_id_val FROM schools WHERE name = 'Sekolah Administrator' LIMIT 1;

    -- B. Cek apakah user sudah ada untuk menghindari duplikat error
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@siguru.com') THEN
        
        -- C. Insert ke AUTH.USERS (Tabel Login Supabase)
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
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            'admin@siguru.com',
            crypt('admin123', gen_salt('bf')), -- Password: admin123
            now(), -- Langsung dikonfirmasi
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Super Admin"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );

        -- D. Insert ke AUTH.IDENTITIES (Agar bisa login)
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
            jsonb_build_object('sub', new_user_id, 'email', 'admin@siguru.com'),
            'email',
            new_user_id::text,
            now(),
            now(),
            now()
        );

        -- E. Insert ke PUBLIC.TEACHERS (Data Aplikasi)
        -- Role 'ADMIN' di sini aman digunakan KARENA migration_role.sql sudah dijalankan terpisah
        INSERT INTO public.teachers (
            user_id,
            school_id,
            email,
            full_name,
            nip,
            role
        ) VALUES (
            new_user_id,
            school_id_val,
            'admin@siguru.com',
            'Super Admin',
            '00000000',
            'ADMIN'
        );
        
        RAISE NOTICE 'User Admin berhasil dibuat. Login: admin@siguru.com / admin123';
    
    ELSE
        RAISE NOTICE 'User admin@siguru.com sudah ada. Tidak ada perubahan yang dilakukan.';
    END IF;

END $$;
