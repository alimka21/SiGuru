
-- =================================================================
-- SIGURU - SUPABASE SCHEMA BLUEPRINT (UPDATED v3)
-- 
-- INSTRUKSI:
-- 1. Buka Dashboard Supabase > SQL Editor
-- 2. Copy isi file ini
-- 3. Paste dan klik Run
-- 
-- CATATAN: Script ini aman dijalankan berulang kali. 
-- Data tabel TIDAK akan hilang, hanya struktur dan policy yang diperbarui.
-- =================================================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMERATIONS (Tipe Data Khusus)
DO $$ BEGIN
    CREATE TYPE school_level_enum AS ENUM ('SD', 'SMP', 'SMA', 'SMK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE teacher_role_enum AS ENUM ('CLASS_TEACHER', 'SUBJECT_TEACHER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE semester_enum AS ENUM ('1', '2', 'Ganjil', 'Genap');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE day_enum AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status_enum AS ENUM ('H', 'I', 'S', 'A');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_type_enum AS ENUM ('FORMATIVE', 'SUMMATIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES STRUCTURE
-- Menggunakan IF NOT EXISTS agar data lama tidak hilang saat run ulang

-- A. ORGANISASI SEKOLAH
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    level school_level_enum NOT NULL DEFAULT 'SMA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. PENGGUNA (GURU)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(150) NOT NULL,
    nip VARCHAR(50),
    role teacher_role_enum DEFAULT 'SUBJECT_TEACHER',
    is_active BOOLEAN DEFAULT FALSE, -- Default PENDING untuk pendaftar baru
    active_academic_year VARCHAR(20) DEFAULT '2025/2026',
    active_semester semester_enum DEFAULT '1',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. MANAJEMEN KELAS & SISWA
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    name VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    nis VARCHAR(50) NOT NULL,
    gender VARCHAR(1) DEFAULT 'L',
    status VARCHAR(20) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. KURIKULUM & MAPEL
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    kktp_default INTEGER DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_objectives ( -- TP
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    semester semester_enum DEFAULT '1',
    scope_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_materials ( -- LM
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tp_id UUID REFERENCES learning_objectives(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_criteria ( -- Kriteria Penilaian
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tp_id UUID REFERENCES learning_objectives(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    type assessment_type_enum DEFAULT 'FORMATIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. JADWAL
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    day day_enum NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. TRANSAKSI PRESENSI
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(schedule_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status_enum DEFAULT 'H',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- G. TRANSAKSI NILAI
CREATE TABLE IF NOT EXISTS student_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES assessment_criteria(id) ON DELETE CASCADE,
    score NUMERIC(5,2),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, criteria_id)
);

CREATE TABLE IF NOT EXISTS student_attitudes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    score NUMERIC(5,2),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- H. JURNAL GURU
CREATE TABLE IF NOT EXISTS journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE, -- Wajib ada jadwal
    tp_id UUID REFERENCES learning_objectives(id) ON DELETE SET NULL,
    lm_id UUID REFERENCES learning_materials(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    subject_name VARCHAR(100), -- Denormalisasi untuk pelaporan mudah
    activity TEXT NOT NULL,
    reflection TEXT,
    follow_up TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for prototype: Authenticated users can do everything)
-- In production, you would restrict based on user_id = auth.uid()

DROP POLICY IF EXISTS "Allow authenticated access to schools" ON schools;
CREATE POLICY "Allow authenticated access to schools" ON schools FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to teachers" ON teachers;
CREATE POLICY "Allow authenticated access to teachers" ON teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to classes" ON classes;
CREATE POLICY "Allow authenticated access to classes" ON classes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to students" ON students;
CREATE POLICY "Allow authenticated access to students" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to subjects" ON subjects;
CREATE POLICY "Allow authenticated access to subjects" ON subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to learning_objectives" ON learning_objectives;
CREATE POLICY "Allow authenticated access to learning_objectives" ON learning_objectives FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to learning_materials" ON learning_materials;
CREATE POLICY "Allow authenticated access to learning_materials" ON learning_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to assessment_criteria" ON assessment_criteria;
CREATE POLICY "Allow authenticated access to assessment_criteria" ON assessment_criteria FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to schedules" ON schedules;
CREATE POLICY "Allow authenticated access to schedules" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to attendance_sessions" ON attendance_sessions;
CREATE POLICY "Allow authenticated access to attendance_sessions" ON attendance_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to attendance_records" ON attendance_records;
CREATE POLICY "Allow authenticated access to attendance_records" ON attendance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to student_grades" ON student_grades;
CREATE POLICY "Allow authenticated access to student_grades" ON student_grades FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to student_attitudes" ON student_attitudes;
CREATE POLICY "Allow authenticated access to student_attitudes" ON student_attitudes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to journals" ON journals;
CREATE POLICY "Allow authenticated access to journals" ON journals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. INSERT DUMMY DATA (Hanya jika belum ada sekolah)
INSERT INTO schools (name, level) 
SELECT 'SMA Negeri 1 Merdeka', 'SMA'
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE name = 'SMA Negeri 1 Merdeka');
