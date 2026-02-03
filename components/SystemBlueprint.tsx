
import React from 'react';

const SUPABASE_SCHEMA = `
-- =================================================================
-- SIGURU - SUPABASE SCHEMA BLUEPRINT
-- Based on Application Logic & Types
-- =================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMERATIONS (Tipe Data Khusus)
CREATE TYPE school_level_enum AS ENUM ('SD', 'SMP', 'SMA', 'SMK');
CREATE TYPE teacher_role_enum AS ENUM ('CLASS_TEACHER', 'SUBJECT_TEACHER');
CREATE TYPE semester_enum AS ENUM ('1', '2'); -- 1 = Ganjil, 2 = Genap
CREATE TYPE day_enum AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
CREATE TYPE attendance_status_enum AS ENUM ('H', 'I', 'S', 'A');

-- 3. TABLES STRUCTURE

-- A. ORGANISASI SEKOLAH
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    level school_level_enum NOT NULL DEFAULT 'SMA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL, -- e.g. "2025/2026"
    semester_active semester_enum DEFAULT '1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. PENGGUNA (GURU)
-- Note: In Supabase, this links to auth.users usually. 
-- Here we create a public profile table.
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- user_id UUID REFERENCES auth.users(id), -- Uncomment for real auth linkage
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    nip VARCHAR(50),
    role teacher_role_enum DEFAULT 'SUBJECT_TEACHER',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. MANAJEMEN KELAS & SISWA
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id), -- Wali Kelas
    name VARCHAR(50) NOT NULL, -- e.g. "10-A"
    phase_level VARCHAR(50) NOT NULL, -- e.g. "Fase E"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    nis VARCHAR(50) NOT NULL,
    gender VARCHAR(1), -- 'L' or 'P'
    status VARCHAR(20) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. KURIKULUM & MAPEL
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Matematika"
    kktp_default INTEGER DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_objectives ( -- TP (Tujuan Pembelajaran)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL, -- e.g. "TP.1"
    description TEXT NOT NULL,
    semester semester_enum DEFAULT '1',
    scope_id VARCHAR(50), -- e.g. "lvl-10" or "math" (Context ID)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_materials ( -- LM (Lingkup Materi)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tp_id UUID REFERENCES learning_objectives(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_criteria ( -- Kriteria Penilaian (Columns in Matrix)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tp_id UUID REFERENCES learning_objectives(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL, -- e.g. "KR.1"
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. JADWAL
CREATE TABLE schedules (
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
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(schedule_id, date) -- Prevent duplicate sessions per schedule per day
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status_enum DEFAULT 'H',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- G. TRANSAKSI NILAI
CREATE TABLE student_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES assessment_criteria(id) ON DELETE CASCADE,
    score NUMERIC(5,2), -- Nilai 0-100
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, criteria_id) -- One score per student per criteria
);

CREATE TABLE student_attitudes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    score NUMERIC(5,2), -- Nilai Sikap
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- 4. ROW LEVEL SECURITY (RLS) - Basic Setup
-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;

-- 5. INDEXES (For Performance)
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_tp_subject ON learning_objectives(subject_id);
CREATE INDEX idx_grades_student ON student_grades(student_id);
CREATE INDEX idx_attendance_session ON attendance_records(session_id);

`;

export const SystemBlueprint: React.FC = () => {
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([SUPABASE_SCHEMA], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "siguru_supabase_schema.sql";
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(SUPABASE_SCHEMA);
      alert("SQL Copied to Clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">SQL Editor & Schema</h2>
          <p className="text-slate-500 text-base font-normal">Blueprint database PostgreSQL yang teroptimasi untuk Supabase.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                Copy SQL
            </button>
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
            >
                <span className="material-symbols-outlined">download</span>
                Download .SQL
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left: Instructions */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">terminal</span>
                    Integrasi Supabase
                </h3>
                <ol className="list-decimal list-outside ml-4 space-y-4 text-sm text-slate-600">
                    <li>
                        <strong>Buat Project Baru</strong>
                        <p className="text-xs text-slate-400 mt-1">Buat project di <a href="https://supabase.com" target="_blank" className="text-primary hover:underline">database.new</a>.</p>
                    </li>
                    <li>
                        <strong>Buka SQL Editor</strong>
                        <p className="text-xs text-slate-400 mt-1">Navigasi ke menu SQL Editor di dashboard sebelah kiri.</p>
                    </li>
                    <li>
                        <strong>Jalankan Query</strong>
                        <p className="text-xs text-slate-400 mt-1">Paste kode SQL di samping dan klik tombol "Run".</p>
                    </li>
                    <li>
                        <strong>Selesai!</strong>
                        <p className="text-xs text-slate-400 mt-1">Seluruh tabel relasional dan Enum akan otomatis dibuat.</p>
                    </li>
                </ol>
            </div>

            <div className="bg-slate-800 text-white rounded-xl p-6 shadow-lg">
                 <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">lightbulb</span>
                    Struktur Data
                 </h3>
                 <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[14px] mt-0.5 text-blue-400">table_view</span>
                        <span><strong>12 Tabel Ternormalisasi:</strong> Schools, Teachers, Students, Classes, Subjects, TPs, Schedules, Attendance, Grades, dll.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[14px] mt-0.5 text-purple-400">category</span>
                        <span><strong>5 Enum Types:</strong> Menjaga konsistensi data (Role, Level, Semester, Hari, Status Presensi).</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[14px] mt-0.5 text-green-400">key</span>
                        <span><strong>UUID Primary Keys:</strong> Standar modern untuk skalabilitas dan keamanan ID.</span>
                    </li>
                 </ul>
            </div>
        </div>

        {/* Right: Code Preview */}
        <div className="lg:col-span-8 h-full">
            <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-slate-800 h-full flex flex-col">
                <div className="bg-[#252526] px-4 py-3 flex items-center justify-between border-b border-black/40">
                    <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-red-500"></span>
                        <span className="size-3 rounded-full bg-yellow-500"></span>
                        <span className="size-3 rounded-full bg-green-500"></span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">database</span>
                        siguru_schema.sql
                    </span>
                </div>
                <div className="p-0 overflow-hidden flex-1 relative group">
                    <textarea 
                        className="w-full h-full bg-[#1e1e1e] text-blue-300 font-mono text-xs p-4 leading-relaxed outline-none resize-none custom-scrollbar border-none focus:ring-0"
                        value={SUPABASE_SCHEMA}
                        readOnly
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
