
-- =================================================================
-- MANUAL SEED: BUAT AKUN LOGIN UTK USER "HANDI"
-- Jalankan ini jika Anda ingin Handi bisa login tanpa Register ulang
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    new_user_id UUID := uuid_generate_v4();
    target_email TEXT := 'handi@siguru.com';
    target_pass TEXT := 'handi123';
BEGIN
    -- 1. Cek apakah user Handi sudah ada di AUTH?
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
        
        -- A. Buat User di AUTH.USERS
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
            target_email, crypt(target_pass, gen_salt('bf')), 
            now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Handi Guru"}', 
            now(), now()
        );

        -- B. Buat Identitas di AUTH.IDENTITIES
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, 
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(), new_user_id, 
            jsonb_build_object('sub', new_user_id, 'email', target_email), 
            'email', new_user_id::text, 
            now(), now(), now()
        );

        -- C. UPDATE tabel TEACHERS (Link Data Profil ke Akun Login Baru)
        -- Jika data guru Handi sudah ada (ditambah admin), kita update user_id-nya
        UPDATE public.teachers 
        SET user_id = new_user_id, is_active = TRUE
        WHERE email = target_email;

        -- D. Jika Handi belum ada di tabel teachers sama sekali, Insert baru
        INSERT INTO public.teachers (user_id, email, full_name, role, level, is_active)
        SELECT new_user_id, target_email, 'Handi Guru', 'SUBJECT_TEACHER', 'SMA', TRUE
        WHERE NOT EXISTS (SELECT 1 FROM public.teachers WHERE email = target_email);

        RAISE NOTICE 'Akun Handi berhasil dibuat. Login: handi@siguru.com / handi123';
    ELSE
        RAISE NOTICE 'User Auth Handi sudah ada.';
    END IF;
END $$;
