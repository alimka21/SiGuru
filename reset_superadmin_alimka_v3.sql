-- ==========================================
-- RESET USERS AND CREATE SUPER ADMIN (VERSI FINAL)
-- ==========================================

DO $$
DECLARE
    superadmin_uid UUID := uuid_generate_v4();
    target_email TEXT := 'alimkamcl@gmail.com';
BEGIN
    -- 1. Bersihkan Data Sebelumnya (agar tidak bentrok)
    DELETE FROM public.teachers WHERE email = target_email;
    DELETE FROM auth.identities WHERE identity_data->>'email' = target_email;
    DELETE FROM auth.users WHERE email = target_email;

    -- 2. Buat user auth untuk Super Admin
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        aud, role
    ) VALUES (
        superadmin_uid,
        '00000000-0000-0000-0000-000000000000',
        target_email,
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Super Admin"}',
        now(), now(), 
        'authenticated', 'authenticated'
    );

    -- 3. [PENTING] Buat identity agar Supabase mengizinkan login email
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, 
        last_sign_in_at, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(),
        superadmin_uid,
        jsonb_build_object('sub', superadmin_uid, 'email', target_email),
        'email',
        superadmin_uid::text, -- Provider ID harus diset menjadi UUID string
        now(), now(), now()
    );

    -- 4. Buat profil Super Admin di tabel aplikasi public.teachers
    -- Kolom relasi di schema Anda saat ini ternyata menggunakan "id", bukan "user_id".
    INSERT INTO public.teachers (id, email, full_name, role, level, is_active)
    VALUES (superadmin_uid, target_email, 'Super Admin Alimka', 'ADMIN', 'SMA', true);
    
    RAISE NOTICE 'Sukses: Super Admin % telah direset dengan kata sandi admin123', target_email;
END $$;
