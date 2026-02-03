
import React, { useState } from 'react';
import { IdentityData, TeacherRole, SchoolLevel } from '../types';

declare const Swal: any;

interface Props {
  data: IdentityData;
  onSave: (data: IdentityData) => void;
  onBack: () => void;
}

export const IdentityForm: React.FC<Props> = ({ data, onSave, onBack }) => {
  const [formData, setFormData] = useState<IdentityData>(data);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Activate the button functionality with feedback
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
                    <strong>Guru Mapel:</strong> Mengajar satu mata pelajaran untuk banyak tingkatan kelas (Sistem SMP/SMA).
                </p>
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
                                        <p className="text-xs text-slate-500">Saya mengajar satu mapel di berbagai kelas (SMP/SMA).</p>
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
                                    <input 
                                        type="text" 
                                        name={formData.role === 'CLASS_TEACHER' ? 'className' : 'subjectName'}
                                        value={formData.role === 'CLASS_TEACHER' ? formData.className : formData.subjectName} 
                                        onChange={handleChange}
                                        placeholder={formData.role === 'CLASS_TEACHER' ? "Contoh: Kelas 5-A" : "Contoh: Matematika"}
                                        className="flex-1 rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Sekolah */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Data Sekolah & Akademik</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Nama Sekolah</label>
                                <input 
                                    type="text" 
                                    name="schoolName"
                                    value={formData.schoolName} 
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900"
                                />
                            </div>
                            
                            {/* JENJANG SEKOLAH INPUT */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Jenjang Sekolah</label>
                                <select 
                                    name="level"
                                    value={formData.level} 
                                    onChange={handleChange}
                                    disabled={formData.role === 'CLASS_TEACHER'}
                                    className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                >
                                    <option value="SD">SD (Sekolah Dasar)</option>
                                    {formData.role !== 'CLASS_TEACHER' && (
                                        <>
                                            <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                                            <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                                            <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                                        </>
                                    )}
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
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Semester</label>
                                <div className="flex items-center gap-4">
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
