
-- =================================================================
-- FIX DELETE USER LOGIC (RPC)
-- Jalankan ini di SQL Editor Supabase
-- =================================================================

-- Fungsi ini menghapus user dari auth.users (yang akan men-trigger delete cascade ke public.teachers)
-- Dijalankan dengan SECURITY DEFINER agar bisa akses schema auth
CREATE OR REPLACE FUNCTION delete_user_complete(target_teacher_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    linked_user_id UUID;
    caller_role TEXT;
BEGIN
    -- 1. Cek Hak Akses: Hanya Admin yang boleh
    SELECT role INTO caller_role
    FROM public.teachers
    WHERE user_id = auth.uid();

    IF caller_role IS DISTINCT FROM 'ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized: Hanya Admin yang bisa menghapus user.';
    END IF;

    -- 2. Cari auth.users.id berdasarkan teacher_id yang dikirim
    SELECT user_id INTO linked_user_id
    FROM public.teachers
    WHERE id = target_teacher_id;

    -- 3. Eksekusi Hapus
    IF linked_user_id IS NOT NULL THEN
        -- Jika terhubung dengan Auth, hapus Auth-nya (Teachers akan ikut terhapus via CASCADE)
        DELETE FROM auth.users WHERE id = linked_user_id;
    ELSE
        -- Jika akun manual/rusak (tidak punya auth), hapus row teachers saja
        DELETE FROM public.teachers WHERE id = target_teacher_id;
    END IF;
END;
$$;
