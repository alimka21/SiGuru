
-- =================================================================
-- LANGKAH 1: BERSIHKAN USER (KECUALI ADMIN)
-- =================================================================

-- Hapus dari auth.users (Cascade akan menghapus data di public.teachers juga)
DELETE FROM auth.users 
WHERE email <> 'admin@siguru.com';

-- Jaga-jaga jika ada data yatim piatu di public.teachers
DELETE FROM public.teachers 
WHERE email <> 'admin@siguru.com';


-- =================================================================
-- LANGKAH 2: MODIFIKASI TABEL UNTUK PASSWORD TEKS
-- =================================================================

-- Tambah kolom plain_password di tabel teachers
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- Set password default untuk Admin (karena kita tahu passwordnya)
UPDATE public.teachers 
SET plain_password = 'admin123' 
WHERE email = 'admin@siguru.com';


-- =================================================================
-- LANGKAH 3: UPDATE FUNGSI CREATE USER (RPC)
-- Agar saat admin add user, plain_password ikut tersimpan
-- =================================================================

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
    -- Cek Hak Akses
    SELECT t.role INTO caller_role
    FROM public.teachers t
    WHERE t.user_id = auth.uid();

    IF caller_role IS DISTINCT FROM 'ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized: Hanya Admin yang bisa menambah user.';
    END IF;

    -- Cek email
    IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = create_new_user.email) THEN
        RAISE EXCEPTION 'Email sudah terdaftar.';
    END IF;

    -- Generate ID & Encrypt Password
    new_user_id := uuid_generate_v4();
    encrypted_pw := crypt(password, gen_salt('bf'));

    -- Insert ke auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', email,
        encrypted_pw, now(), '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', full_name, 'role', role, 'level', level),
        now(), now()
    );

    -- Insert ke auth.identities
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', email),
        'email', new_user_id::text, now(), now(), now()
    );

    -- Insert ke public.teachers DENGAN PLAIN PASSWORD
    INSERT INTO public.teachers (
        user_id, email, full_name, role, level, is_active, school_id, plain_password
    ) VALUES (
        new_user_id, email, full_name, role::teacher_role_enum, level, TRUE,
        (SELECT school_id FROM teachers WHERE user_id = auth.uid() LIMIT 1),
        password -- SIMPAN PASSWORD TEKS DI SINI
    );

    RETURN json_build_object('id', new_user_id, 'email', email);
END;
$$;
