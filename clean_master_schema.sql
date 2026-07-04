-- =======================================================
-- MASTER SCHEMA SIGURU PRO - FRESH DEPLOYMENT & OPTIMIZED
-- =======================================================

-- 1. Pastikan UUID extension berjalan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel User Profil (Teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SUBJECT_TEACHER', -- 'ADMIN', 'HOMEROOM_TEACHER', 'SUBJECT_TEACHER'
    level TEXT NOT NULL DEFAULT 'SMA', -- 'SD', 'SMP', 'SMA'
    is_active BOOLEAN NOT NULL DEFAULT false, -- Guru yang daftar default-nya belum aktif (menunggu admin)
    nip TEXT,
    active_semester TEXT DEFAULT '1',
    active_academic_year TEXT DEFAULT '2025/2026',
    school_id UUID,
    subscription_plan TEXT DEFAULT 'BASIC', -- 'BASIC', 'TRIWULAN', 'SEMESTER', 'PREMIUM', 'NONE'
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    password_plain TEXT, -- Tambahan untuk menyimpan kata sandi polos agar bisa ditampilkan ke Admin Sekolah
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tambahkan kolom baru ke tabel teachers jika tabel sudah ada sebelumnya di database Supabase Anda
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'SUBJECT_TEACHER';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'SMA';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'BASIC';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS password_plain TEXT;

-- Pastikan tipe data kolom adalah TEXT jika sebelumnya merupakan ENUM (untuk mencegah error casting)
DO $$
BEGIN
    -- 1. Konversi 'role' ke TEXT
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'teachers' 
          AND column_name = 'role' 
          AND data_type <> 'text'
    ) THEN
        ALTER TABLE public.teachers ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE public.teachers ALTER COLUMN role TYPE text USING role::text;
        ALTER TABLE public.teachers ALTER COLUMN role SET DEFAULT 'SUBJECT_TEACHER';
    END IF;

    -- 2. Konversi 'level' ke TEXT
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'teachers' 
          AND column_name = 'level' 
          AND data_type <> 'text'
    ) THEN
        ALTER TABLE public.teachers ALTER COLUMN level DROP DEFAULT;
        ALTER TABLE public.teachers ALTER COLUMN level TYPE text USING level::text;
        ALTER TABLE public.teachers ALTER COLUMN level SET DEFAULT 'SMA';
    END IF;

    -- 3. Konversi 'subscription_plan' ke TEXT
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'teachers' 
          AND column_name = 'subscription_plan' 
          AND data_type <> 'text'
    ) THEN
        ALTER TABLE public.teachers ALTER COLUMN subscription_plan DROP DEFAULT;
        ALTER TABLE public.teachers ALTER COLUMN subscription_plan TYPE text USING subscription_plan::text;
        ALTER TABLE public.teachers ALTER COLUMN subscription_plan SET DEFAULT 'BASIC';
    END IF;
END $$;

-- 3. SETUP TRIGGER OTOMATIS SAAT USER MENDAFTAR (SIGN UP)
-- Ini menjamin data pendaftar baru langsung tersimpan di tabel teachers publik,
-- bahkan jika ada pembatasan izin/RLS pada sisi aplikasi client.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.teachers (
        id, 
        email, 
        full_name, 
        role, 
        level, 
        is_active, 
        subscription_plan, 
        subscription_end_date, 
        password_plain
    ) VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'role', 'SUBJECT_TEACHER'),
        coalesce(new.raw_user_meta_data->>'level', 'SMA'),
        CASE 
            WHEN new.email IN ('admin@siguru.com', 'alimkamcl@gmail.com') THEN true
            ELSE false 
        END, -- Admin utama langsung diaktifkan, guru lain harus diverifikasi oleh admin
        coalesce(new.raw_user_meta_data->>'subscription_plan', 'BASIC'),
        timezone('utc'::text, now()) + CASE 
            WHEN (new.raw_user_meta_data->>'subscription_plan') = 'TRIWULAN' THEN interval '90 days'
            WHEN (new.raw_user_meta_data->>'subscription_plan') = 'SEMESTER' THEN interval '180 days'
            WHEN (new.raw_user_meta_data->>'subscription_plan') = 'PREMIUM' THEN interval '365 days'
            ELSE interval '30 days'
        END,
        new.raw_user_meta_data->>'password_plain'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        level = EXCLUDED.level,
        password_plain = EXCLUDED.password_plain;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Jalankan trigger setelah pengguna baru terbuat di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Setup Admin Default (Auth & Profile)
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
    INSERT INTO public.teachers (id, email, full_name, role, level, is_active, subscription_plan)
    VALUES (admin_uid, 'admin@siguru.com', 'System Admin', 'ADMIN', 'SMA', true, 'PREMIUM')
    ON CONFLICT (id) DO UPDATE SET
        role = 'ADMIN',
        full_name = 'System Admin',
        is_active = true,
        email = 'admin@siguru.com';
END $$;

-- 5. OPTIMALISASI KEBIJAKAN KEAMANAN (ROW LEVEL SECURITY - RLS)
-- Mengaktifkan RLS agar aman dan terstruktur
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Buat fungsi helper SECURITY DEFINER untuk mengecek admin tanpa memicu RLS loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    -- Ambil role dari JWT user_metadata terlebih dahulu untuk menghindari rekursi RLS
    BEGIN
        jwt_role := current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role';
    EXCEPTION WHEN OTHERS THEN
        jwt_role := NULL;
    END;

    IF jwt_role = 'ADMIN' THEN
        RETURN TRUE;
    END IF;

    -- Jika tidak ada di JWT (misalnya saat trigger atau cron run), cek database dengan bypass RLS (karena SECURITY DEFINER)
    RETURN EXISTS (
        SELECT 1 FROM public.teachers 
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view own profile" ON public.teachers;
DROP POLICY IF EXISTS "Users can update own profile" ON public.teachers;
DROP POLICY IF EXISTS "Allow select for self or admin" ON public.teachers;
DROP POLICY IF EXISTS "Allow update for self or admin" ON public.teachers;
DROP POLICY IF EXISTS "Allow insert for self or admin" ON public.teachers;
DROP POLICY IF EXISTS "Allow delete for admin only" ON public.teachers;

-- Kebijakan SELECT (User bisa melihat profile-nya sendiri, atau ADMIN bisa melihat semua profile)
CREATE POLICY "Allow select for self or admin" 
ON public.teachers 
FOR SELECT 
USING (
    auth.uid() = id 
    OR public.is_admin()
);

-- Kebijakan UPDATE (User bisa mengupdate profile-nya sendiri, atau ADMIN bisa mengubah semuanya)
CREATE POLICY "Allow update for self or admin" 
ON public.teachers 
FOR UPDATE 
USING (
    auth.uid() = id 
    OR public.is_admin()
)
WITH CHECK (
    auth.uid() = id 
    OR public.is_admin()
);

-- Kebijakan INSERT (User diijinkan mendaftarkan dirinya sendiri, atau ADMIN membuat guru baru)
CREATE POLICY "Allow insert for self or admin" 
ON public.teachers 
FOR INSERT 
WITH CHECK (
    auth.uid() = id 
    OR public.is_admin()
);

-- Kebijakan DELETE (Hanya admin sekolah yang berhak menghapus akun)
CREATE POLICY "Allow delete for admin only" 
ON public.teachers 
FOR DELETE 
USING (
    public.is_admin()
);

-- ==========================================================
-- AUTOMATIC SYNC FROM auth.users TO public.teachers ON SIGNUP
-- ==========================================================

-- Trigger Function untuk otomatis menyinkronkan user baru dari auth.users ke public.teachers
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_role TEXT;
    v_level TEXT;
    v_sub_plan TEXT;
    v_pass_plain TEXT;
    v_end_date TIMESTAMPTZ;
BEGIN
    -- Ambil data dari metadata signup atau default-kan
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'SUBJECT_TEACHER');
    v_level := COALESCE(new.raw_user_meta_data->>'level', 'SMA');
    v_sub_plan := COALESCE(new.raw_user_meta_data->>'subscription_plan', new.raw_user_meta_data->>'subscriptionPlan', 'BASIC');
    v_pass_plain := COALESCE(new.raw_user_meta_data->>'password_plain', '');
    
    -- Hitung tanggal akhir langganan (default 30 hari untuk BASIC, atau setahun untuk PREMIUM)
    IF v_sub_plan = 'TRIWULAN' THEN
        v_end_date := now() + INTERVAL '90 days';
    ELSIF v_sub_plan = 'SEMESTER' THEN
        v_end_date := now() + INTERVAL '180 days';
    ELSIF v_sub_plan = 'PREMIUM' THEN
        v_end_date := now() + INTERVAL '365 days';
    ELSE
        v_end_date := now() + INTERVAL '30 days';
    END IF;

    -- Lakukan upsert ke tabel public.teachers
    INSERT INTO public.teachers (
        id, 
        email, 
        full_name, 
        role, 
        level, 
        is_active, 
        subscription_plan, 
        subscription_end_date,
        password_plain,
        created_at
    ) VALUES (
        new.id,
        new.email,
        v_full_name,
        v_role,
        v_level,
        CASE WHEN v_role = 'ADMIN' THEN true ELSE false END, -- Admin langsung aktif, guru lain pending approval
        v_sub_plan,
        v_end_date,
        v_pass_plain,
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        level = EXCLUDED.level,
        subscription_plan = EXCLUDED.subscription_plan,
        subscription_end_date = EXCLUDED.subscription_end_date,
        password_plain = EXCLUDED.password_plain;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat trigger-nya
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_sync();

