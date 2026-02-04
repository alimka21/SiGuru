
import React from 'react';
import { Student, ClassInfo, IdentityData } from '../types';
import { useStudentLogic } from '../hooks/useStudentLogic';

interface Props {
  identity: IdentityData;
  students: Student[];
  classes: ClassInfo[];
  onUpdateStudents: (students: Student[]) => void;
  onUpdateClasses: (classes: ClassInfo[]) => void; 
  onBack: () => void;
}

export const StudentManager: React.FC<Props> = (props) => {
  // Call Hook
  const { 
    state, 
    setters, 
    computed, 
    handlers, 
    refs 
  } = useStudentLogic(props);

  const { isModalOpen, editingId, filterClass, searchQuery, formData } = state;
  const { filteredStudents } = computed;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={refs.fileInputRef}
          onChange={handlers.handleFileUpload}
          accept=".xlsx, .xls"
          className="hidden"
      />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={props.onBack} className="text-slate-500 text-sm font-medium hover:text-primary">Beranda</button>
        <span className="text-slate-400 text-sm font-medium">/</span>
        <span className="text-primary text-sm font-bold">Master Data Siswa</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Master Data Siswa</h2>
          <p className="text-slate-500 text-base font-normal">Kelola data induk siswa, mutasi, dan status akademik.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handlers.handleImportMenuClick}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors text-slate-700"
           >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Import Excel
          </button>
          <button 
            onClick={() => handlers.handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Summary Stats - 4 Required Banners */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col gap-1">
            <div className="flex justify-between items-start">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Siswa</span>
                <span className="material-symbols-outlined text-blue-500 bg-blue-50 p-1.5 rounded-lg text-lg">groups</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{props.students.length}</p>
        </div>
        
        {/* Siswa Aktif - Now Dynamic and not fading out */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col gap-1">
            <div className="flex justify-between items-start">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Siswa Aktif</span>
                <span className="material-symbols-outlined text-green-500 bg-green-50 p-1.5 rounded-lg text-lg">check_circle</span>
            </div>
            {/* Displaying length as active students, assuming all imported/added are active by default */}
            <p className="text-2xl font-bold text-slate-900">{props.students.length}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center bg-slate-50">
           <div className="flex gap-4 flex-1">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                    <input 
                        type="text" 
                        placeholder="Cari nama, NIS..." 
                        value={searchQuery}
                        onChange={(e) => setters.setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-64 focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400" 
                    />
                </div>
                
                {/* Select with Icon Dropdown */}
                <div className="relative">
                    <select 
                        value={filterClass}
                        onChange={(e) => setters.setFilterClass(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-primary cursor-pointer w-48"
                    >
                        <option value="">Semua Kelas</option>
                        {props.classes.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
           </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identitas Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? filteredStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-center text-sm text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                    <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">NIS: {student.nis}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{student.className || '-'}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border bg-green-50 text-green-600 border-green-100`}>
                      <span className="size-1.5 rounded-full bg-green-500"></span> 
                      Aktif
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handlers.handleOpenModal(student)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handlers.handleDeleteStudent(student.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                          <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                          <p>
                              {filterClass ? `Tidak ada siswa di kelas ${filterClass}.` : 'Belum ada data siswa.'}
                          </p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">Menampilkan {filteredStudents.length} siswa</p>
        </div>
      </div>

       {/* Add/Edit Student Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all scale-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
                      <button onClick={() => setters.setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <form onSubmit={handlers.handleSaveStudent} className="p-6 space-y-4">
                      
                      {/* Context Information (Auto-filled) */}
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
                          <span className="material-symbols-outlined text-blue-600">school</span>
                          <div>
                              <p className="text-[10px] font-bold text-blue-500 uppercase">Jenjang Sekolah (Otomatis)</p>
                              <p className="text-sm font-bold text-blue-900">{props.identity.schoolName} ({props.identity.level})</p>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              required
                              placeholder="Nama Siswa"
                              className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                              value={formData.name}
                              onChange={(e) => setters.setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">NIS <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                required
                                placeholder="Nomor Induk"
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.nis}
                                onChange={(e) => setters.setFormData({...formData, nis: e.target.value})}
                            />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Jenis Kelamin <span className="text-red-500">*</span></label>
                            <select 
                                required
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.gender}
                                onChange={(e) => setters.setFormData({...formData, gender: e.target.value})}
                            >
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Kelas <span className="text-red-500">*</span></label>
                            <select 
                                required
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.className}
                                onChange={(e) => setters.setFormData({...formData, className: e.target.value})}
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {props.classes.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setters.setIsModalOpen(false)}
                              className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                          >
                              Batal
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 shadow-md shadow-blue-200"
                          >
                              {editingId ? 'Update Siswa' : 'Simpan Siswa'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
