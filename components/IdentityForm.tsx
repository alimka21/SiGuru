
import React, { useState, useMemo, useEffect } from 'react';
import { IdentityData, TeacherRole, SchoolLevel, SUBJECTS_DATA } from '../types';

declare const Swal: any;

// Helper to Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

interface Props {
  data: IdentityData;
  onSave: (data: IdentityData) => void;
  onBack: () => void;
  onResetSemester: () => void;
  onResetYear: () => void;
}

export const IdentityForm: React.FC<Props> = ({ data, onSave, onBack, onResetSemester, onResetYear }) => {
  const [formData, setFormData] = useState<IdentityData>(data);
  const [isOtherSubject, setIsOtherSubject] = useState(false);

  // Determine available subjects based on level
  const availableSubjects = useMemo(() => {
      if (formData.level === 'SD') {
          return SUBJECTS_DATA.SD.SUBJECT_TEACHER;
      } else if (formData.level === 'SMP') {
          return SUBJECTS_DATA.SMP;
      } else {
          return SUBJECTS_DATA.SMA_SMK;
      }
  }, [formData.level]);

  // Init custom subject state logic
  useEffect(() => {
      if (formData.role === 'SUBJECT_TEACHER') {
          const isStandard = availableSubjects.includes(formData.subjectName);
          if (formData.subjectName && !isStandard) {
              setIsOtherSubject(true);
          }
      }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Special handler for Role to enforce SD Level rule
  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newRole = e.target.value as TeacherRole;
      setFormData(prev => ({
          ...prev,
          role: newRole,
          level: newRole === 'CLASS_TEACHER' ? 'SD' : prev.level
      }));
  }

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'Lainnya') {
          setIsOtherSubject(true);
          setFormData(prev => ({ ...prev, subjectName: '' }));
      } else {
          setIsOtherSubject(false);
          setFormData(prev => ({ ...prev, subjectName: val }));
      }
  };

  const handleCustomSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Auto Title Case
      const val = toTitleCase(e.target.value);
      setFormData(prev => ({ ...prev, subjectName: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    Swal.fire({
      title: 'Simpan Perubahan?',
      text: "Pastikan data profil dan peran guru sudah benar.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#137fec',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal'
    }).then((result: any) => {
      if (result.isConfirmed) {
        onSave(formData);
        Swal.fire(
          'Tersimpan!',
          'Pengaturan akun dan sekolah berhasil diperbarui.',
          'success'
        );
      }
    });
  };

  const handleResetAction = (type: 'SEMESTER' | 'YEAR') => {
      const title = type === 'SEMESTER' ? 'Reset Data Semester?' : 'Reset Tahun Ajaran Baru?';
      const text = type === 'SEMESTER' 
        ? "Ini akan menghapus Jurnal, Nilai, dan Presensi. Data Siswa dan Kelas TETAP ADA."
        : "PERINGATAN KERAS: Ini akan menghapus SEMUA DATA (Siswa, Kelas, Nilai, dll) kecuali Profil Guru.";
      
      Swal.fire({
          title: title,
          text: text,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Ya, Hapus Data',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              if (type === 'SEMESTER') onResetSemester();
              else onResetYear();
          }
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500">
        <a onClick={onBack} className="hover:text-primary cursor-pointer">Dashboard</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-slate-900 font-bold">Pengaturan</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Pengaturan Akun & Peran</h2>
          <p className="text-slate-500 text-base font-normal">Kelola identitas profil, peran guru, dan data sekolah.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
                <div className="relative mb-4 group">
                    <div className="size-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                         <span className="text-4xl font-bold text-slate-300">
                             {formData.teacherName.charAt(0)}
                         </span>
                         {/* Placeholder for real image */}
                         <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-white">camera_alt</span>
                         </div>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{formData.teacherName}</h3>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-sm text-slate-500">{formData.schoolName}</p>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                        Jenjang: {formData.level}
                    </span>
                </div>
                <div className="mt-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${formData.role === 'CLASS_TEACHER' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                         {formData.role === 'CLASS_TEACHER' ? 'Guru Kelas (SD)' : 'Guru Mapel'}
                     </span>
                </div>
            </div>

             <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Informasi Sistem
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed mb-2">
                    <strong>Guru Kelas:</strong> Mengajar banyak mata pelajaran untuk satu kelas (Sistem SD).
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Guru Mapel:</strong> Mengajar satu mata pelajaran untuk banyak tingkatan kelas (SD/SMP/SMA).
                </p>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Reset Data Sistem
                </h4>
                <div className="space-y-3">
                    <button 
                        type="button" 
                        onClick={() => handleResetAction('SEMESTER')}
                        className="w-full py-2 bg-white border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                    >
                        Reset Semester (Hapus Nilai/Jurnal)
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleResetAction('YEAR')}
                        className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reset Tahun Ajaran (Hapus Semua)
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column: Form Inputs */}
        <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Detail Informasi</h3>
                </div>
                
                <div className="p-8 space-y-8">
                    {/* Section: Peran Guru (Penting) */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Peran & Tanggung Jawab</h4>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Tipe Guru</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-all ${formData.role === 'CLASS_TEACHER' ? 'border-primary bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-800">Guru Kelas</span>
                                            <input 
                                                type="radio" 
                                                name="role" 
                                                value="CLASS_TEACHER" 
                                                checked={formData.role === 'CLASS_TEACHER'} 
                                                onChange={handleRoleChange}
                                                className="text-primary focus:ring-primary"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">Saya mengajar tematik/banyak mapel di satu kelas (SD).</p>
                                    </label>

                                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-all ${formData.role === 'SUBJECT_TEACHER' ? 'border-primary bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-800">Guru Mapel</span>
                                            <input 
                                                type="radio" 
                                                name="role" 
                                                value="SUBJECT_TEACHER" 
                                                checked={formData.role === 'SUBJECT_TEACHER'} 
                                                onChange={handleRoleChange}
                                                className="text-primary focus:ring-primary"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">Saya mengajar satu mapel di berbagai kelas (SD/SMP/SMA).</p>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Profil Guru */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Profil Guru</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    name="teacherName"
                                    value={formData.teacherName} 
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">NIP / NUPTK</label>
                                <input 
                                    type="text" 
                                    name="nip"
                                    value={formData.nip} 
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-slate-50"
                                />
                            </div>
                             
                             {/* Dynamic Input based on Role */}
                             <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    {formData.role === 'CLASS_TEACHER' ? 'Nama Kelas Ampuan (Wali Kelas)' : 'Mata Pelajaran Utama'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400">
                                        {formData.role === 'CLASS_TEACHER' ? 'meeting_room' : 'menu_book'}
                                    </span>
                                    
                                    {formData.role === 'CLASS_TEACHER' ? (
                                        <input 
                                            type="text" 
                                            name="className"
                                            value={formData.className} 
                                            onChange={handleChange}
                                            placeholder="Contoh: Kelas 5-A"
                                            className="flex-1 rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900"
                                        />
                                    ) : (
                                        // SUBJECT SELECTOR WITH "LAINNYA"
                                        <div className="flex-1 flex gap-2">
                                            {!isOtherSubject ? (
                                                <select 
                                                    className="flex-1 rounded-lg border-slate-200 focus:ring-2 focus:ring-primary text-sm font-bold text-slate-900 cursor-pointer"
                                                    value={formData.subjectName}
                                                    onChange={handleSubjectChange}
                                                >
                                                    <option value="">-- Pilih Mata Pelajaran --</option>
                                                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                                    {formData.level === 'SMK' || formData.level === 'SMA' ? <option value="Lainnya">Lainnya (Ketik Manual)</option> : null}
                                                </select>
                                            ) : (
                                                <div className="flex-1 relative">
                                                    <input 
                                                        type="text" 
                                                        value={formData.subjectName}
                                                        onChange={handleCustomSubjectChange}
                                                        placeholder="Ketik nama mata pelajaran..."
                                                        className="w-full rounded-lg border-blue-300 focus:ring-2 focus:ring-primary text-sm font-bold text-slate-900 bg-blue-50 pl-4 pr-8"
                                                        autoFocus
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setIsOtherSubject(false)}
                                                        className="absolute right-2 top-2.5 text-slate-400 hover:text-red-500"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Sekolah */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Data Sekolah & Akademik</h4>
                        <div className="grid grid-cols-1 gap-6">
                             <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nama Sekolah</label>
                                <input 
                                    type="text" 
                                    name="schoolName"
                                    value={formData.schoolName} 
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900"
                                />
                            </div>
                            
                            {/* ROW 1: JENJANG - TAHUN AJARAN */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Jenjang Sekolah</label>
                                    <select 
                                        name="level"
                                        value={formData.level} 
                                        onChange={handleChange}
                                        disabled={formData.role === 'CLASS_TEACHER'}
                                        className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    >
                                        <option value="SD">SD/MI Sederajat</option>
                                        <option value="SMP">SMP/MTs Sederajat</option>
                                        <option value="SMA">SMA/MA Sederajat</option>
                                        <option value="SMK">SMK Sederajat</option>
                                    </select>
                                    {formData.role === 'CLASS_TEACHER' && (
                                        <p className="text-[10px] text-orange-500 mt-1">*Guru Kelas otomatis diset jenjang SD</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Tahun Ajaran</label>
                                    <select 
                                        name="academicYear"
                                        value={formData.academicYear} 
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 cursor-pointer"
                                    >
                                        <option value="2023/2024">2023/2024</option>
                                        <option value="2024/2025">2024/2025</option>
                                        <option value="2025/2026">2025/2026</option>
                                    </select>
                                </div>
                            </div>

                            {/* ROW 2: KEPSEK - NIP */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Nama Kepala Sekolah</label>
                                    <input 
                                        type="text" 
                                        name="principalName"
                                        value={formData.principalName || ''} 
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">NIP Kepala Sekolah</label>
                                    <input 
                                        type="text" 
                                        name="principalNip"
                                        value={formData.principalNip || ''} 
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900"
                                    />
                                </div>
                            </div>

                            {/* ROW 3: SEMESTER */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Semester</label>
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="semester" 
                                            value="Ganjil" 
                                            checked={formData.semester === 'Ganjil'} 
                                            onChange={handleChange}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-900">Ganjil</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="semester" 
                                            value="Genap" 
                                            checked={formData.semester === 'Genap'} 
                                            onChange={handleChange}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-900">Genap</span>
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onBack}
                        className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-white transition-all"
                    >
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-blue-600 transition-all shadow-sm shadow-blue-200 hover:shadow-md"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
};
