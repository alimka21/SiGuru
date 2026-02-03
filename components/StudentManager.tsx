
import React, { useState, useMemo } from 'react';
import { Student, ClassInfo } from '../types';

declare const Swal: any;

interface Props {
  students: Student[];
  classes: ClassInfo[];
  onUpdateStudents: (students: Student[]) => void;
  onBack: () => void;
}

// Helper for Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

export const StudentManager: React.FC<Props> = ({ students, classes, onUpdateStudents, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // FILTER STATE
  const [filterClass, setFilterClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Default Form Data
  const [formData, setFormData] = useState({
      name: '',
      nis: '',
      gender: 'L',
      className: '',
      status: 'Aktif'
  });

  // Filtered Students Calculation
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
        const matchesClass = filterClass ? student.className === filterClass : true;
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              student.nis.includes(searchQuery);
        return matchesClass && matchesSearch;
    });
  }, [students, filterClass, searchQuery]);

  const handleOpenModal = (student?: Student) => {
      if (student) {
          setEditingId(student.id);
          setFormData({
              name: student.name,
              nis: student.nis,
              gender: 'L', // Assuming L default if property missing in basic type
              className: student.className || '',
              status: 'Aktif'
          });
      } else {
          setEditingId(null);
          // Set default class if available
          const defaultClass = classes.length > 0 ? classes[0].name : '';
          setFormData({ name: '', nis: '', gender: 'L', className: defaultClass, status: 'Aktif' });
      }
      setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
      e.preventDefault();
      
      // VALIDATION: Check for empty fields
      if (!formData.name.trim() || !formData.nis.trim() || !formData.className || !formData.gender) {
          Swal.fire({
              title: 'Gagal Menyimpan',
              text: "Semua kolom (Nama, NIS, Jenis Kelamin, Kelas) wajib diisi!",
              icon: 'error',
              confirmButtonColor: '#d33',
              confirmButtonText: 'OK'
          });
          return;
      }

      // AUTO-CAPITALIZE NAME
      const formattedName = toTitleCase(formData.name);

      if (editingId) {
          // Update
          const updatedStudents = students.map(s => s.id === editingId ? { ...s, ...formData, name: formattedName } : s);
          onUpdateStudents(updatedStudents);
      } else {
          // Add
          const newStudent: Student = {
              id: Date.now().toString(),
              name: formattedName,
              nis: formData.nis,
              className: formData.className,
              // status and gender are managed in this form state but Student interface might need extension in real app
              // For now we map to existing simple Student interface
          };
          onUpdateStudents([newStudent, ...students]);
      }
      setIsModalOpen(false);
      
      // Success Feedback
      Swal.fire({
          title: 'Berhasil!',
          text: 'Data siswa telah disimpan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
      });
  };

  const handleDeleteStudent = (id: string) => {
      Swal.fire({
          title: 'Hapus Siswa?',
          text: "Data ini tidak dapat dikembalikan!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Ya, hapus!',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateStudents(students.filter(s => s.id !== id));
              Swal.fire(
                  'Terhapus!',
                  'Data siswa berhasil dihapus.',
                  'success'
              )
          }
      });
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-slate-500 text-sm font-medium hover:text-primary">Beranda</button>
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
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors text-slate-700">
            <span className="material-symbols-outlined text-sm">upload</span>
            Import Excel
          </button>
          <button 
            onClick={() => handleOpenModal()}
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
            <p className="text-2xl font-bold text-slate-900">{students.length}</p>
        </div>
        {/* Placeholder stats as we don't have full data model for gender/status in the root Student type yet */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col gap-1 opacity-60">
            <div className="flex justify-between items-start">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Siswa Aktif</span>
                <span className="material-symbols-outlined text-green-500 bg-green-50 p-1.5 rounded-lg text-lg">check_circle</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">-</p>
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-64 focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400" 
                    />
                </div>
                
                {/* Select with Icon Dropdown */}
                <div className="relative">
                    <select 
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-primary cursor-pointer w-48"
                    >
                        <option value="">Semua Kelas</option>
                        {classes.map(c => (
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
                      <button onClick={() => handleOpenModal(student)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDeleteStudent(student.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
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
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              required
                              placeholder="Nama Siswa"
                              className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                                onChange={(e) => setFormData({...formData, nis: e.target.value})}
                            />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Jenis Kelamin <span className="text-red-500">*</span></label>
                            <select 
                                required
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
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
                                onChange={(e) => setFormData({...formData, className: e.target.value})}
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
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
