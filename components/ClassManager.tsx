
import React, { useState, useMemo } from 'react';
import { ClassInfo, IdentityData, Student } from '../types';

declare const Swal: any;

interface Props {
  identity: IdentityData;
  classes: ClassInfo[];
  students: Student[]; // Added to calculate counts dynamically
  onUpdateClasses: (classes: ClassInfo[]) => void;
  onBack: () => void;
}

const ALL_PHASES = [
    { label: "Fase A (Kelas 1-2)", level: "SD" },
    { label: "Fase B (Kelas 3-4)", level: "SD" },
    { label: "Fase C (Kelas 5-6)", level: "SD" },
    { label: "Fase D (Kelas 7-9)", level: "SMP" },
    { label: "Fase E (Kelas 10)", level: "SMA" }, // Also SMK
    { label: "Fase F (Kelas 11-12)", level: "SMA" } // Also SMK
];

export const ClassManager: React.FC<Props> = ({ identity, classes, students, onUpdateClasses, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter Phases based on Identity Level
  const availablePhases = useMemo(() => {
      if (identity.level === 'SMK') {
          return ALL_PHASES.filter(p => p.level === 'SMA'); // SMK uses E and F too
      }
      return ALL_PHASES.filter(p => p.level === identity.level);
  }, [identity.level]);

  // Default value logic
  const defaultLevel = availablePhases.length > 0 ? availablePhases[0].label : '';

  const [formData, setFormData] = useState({
      name: '',
      level: defaultLevel,
  });

  const handleOpenModal = (cls?: ClassInfo) => {
      if (cls) {
          setEditingId(cls.id);
          setFormData({
              name: cls.name,
              level: cls.level,
          });
      } else {
          setEditingId(null);
          setFormData({ name: '', level: defaultLevel });
      }
      setIsModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (editingId) {
          // Update
          const updatedClasses = classes.map(c => c.id === editingId ? { 
              ...c, 
              ...formData,
          } : c);
          onUpdateClasses(updatedClasses);
      } else {
          // Add
          const newClass: ClassInfo = {
              id: Date.now().toString(),
              name: formData.name,
              level: formData.level,
              studentCount: 0, // Initial value, but display uses dynamic calc
          };
          onUpdateClasses([...classes, newClass]);
      }
      setIsModalOpen(false);
  };

  const handleDeleteClass = (id: string) => {
      Swal.fire({
          title: 'Hapus Kelas?',
          text: "Data siswa yang terhubung mungkin akan terpengaruh!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Ya, hapus!',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateClasses(classes.filter(c => c.id !== id));
              Swal.fire(
                  'Terhapus!',
                  'Data kelas berhasil dihapus.',
                  'success'
              )
          }
      });
  };

  // Calculate Total Students from passed prop
  const totalStudents = students.length;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-slate-500 text-sm font-medium hover:text-primary">Beranda</button>
        <span className="text-slate-400 text-sm font-medium">/</span>
        <span className="text-primary text-sm font-bold">Master Data Kelas</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Master Data Kelas</h2>
          <p className="text-slate-500 text-base font-normal">Kelola informasi kelas dan tingkat (Fase) untuk jenjang <strong>{identity.level}</strong>.</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors text-slate-700">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Data
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Tambah Kelas
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg"><span className="material-symbols-outlined">class</span></div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Kelas</p>
            <p className="text-2xl font-bold text-slate-900">{classes.length} Kelas</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-green-50 text-green-600 p-3 rounded-lg"><span className="material-symbols-outlined">groups</span></div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Siswa</p>
            <p className="text-2xl font-bold text-slate-900">{totalStudents} Siswa</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 text-orange-600 p-3 rounded-lg"><span className="material-symbols-outlined">calendar_today</span></div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tahun Ajaran</p>
            <p className="text-2xl font-bold text-slate-900">2025/2026</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
           <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
             <input type="text" placeholder="Cari nama kelas..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-64 focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400" />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tingkat / Fase</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Kelas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Jumlah Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.length > 0 ? classes.map((cls) => {
                // CALCULATE COUNT DYNAMICALLY
                const count = students.filter(s => s.className === cls.name).length;
                return (
                    <tr key={cls.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${cls.level.includes('Fase A') ? 'bg-red-100 text-red-700' : cls.level.includes('Fase E') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {cls.level}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{cls.name}</td>
                    <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                            {count}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(cls)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDeleteClass(cls.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        </div>
                    </td>
                    </tr>
                );
              }) : (
                  <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400">
                          <span className="material-symbols-outlined text-4xl mb-2">school</span>
                          <p>Belum ada data kelas.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">Menampilkan {classes.length} kelas</p>
        </div>
      </div>

      {/* Add/Edit Class Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <form onSubmit={handleSaveClass} className="p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Nama Kelas <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              required
                              placeholder="Contoh: 10-C"
                              className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Tingkat / Fase ({identity.level}) <span className="text-red-500">*</span></label>
                          <select 
                             className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white cursor-pointer"
                             value={formData.level}
                             onChange={(e) => setFormData({...formData, level: e.target.value})}
                          >
                              {availablePhases.map(phase => (
                                  <option key={phase.label} value={phase.label}>{phase.label}</option>
                              ))}
                          </select>
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
                              {editingId ? 'Update Kelas' : 'Simpan Kelas'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
