
-- =================================================================
-- LANGKAH 1: UPDATE STRUKTUR DATABASE
-- Jalankan script ini TERLEBIH DAHULU sebelum seed_admin.sql
-- =================================================================

-- Menambahkan value 'ADMIN' ke tipe data teacher_role_enum.
-- Perintah ini harus dijalankan dalam transaksi tersendiri (Auto-commit)
-- sebelum value 'ADMIN' bisa digunakan untuk insert data.

ALTER TYPE teacher_role_enum ADD VALUE IF NOT EXISTS 'ADMIN';
