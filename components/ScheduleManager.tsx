
import React, { useState } from 'react';
import { ScheduleItem, ClassInfo } from '../types';

declare const Swal: any;

interface Props {
  schedules: ScheduleItem[];
  classes: ClassInfo[]; // Recieve classes for dropdown
  onUpdateSchedules: (schedules: ScheduleItem[]) => void;
  onBack: () => void;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Helper for Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

export const ScheduleManager: React.FC<Props> = ({ schedules, classes, onUpdateSchedules, onBack }) => {
  const [activeDay, setActiveDay] = useState<string>('Senin');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<ScheduleItem, 'id'>>({
    day: 'Senin',
    startTime: '07:30',
    endTime: '09:00',
    className: '',
    subject: '',
    room: ''
  });

  const filteredSchedules = schedules
    .filter(s => {
        const matchesDay = s.day === activeDay;
        const query = searchQuery.toLowerCase();
        const matchesSearch = s.subject.toLowerCase().includes(query) || 
                              s.className.toLowerCase().includes(query) ||
                              s.room.toLowerCase().includes(query);
        return matchesDay && matchesSearch;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleOpenModal = (schedule?: ScheduleItem) => {
    // VALIDATION: Prevent adding schedule if no classes exist
    if (!schedule && classes.length === 0) {
        Swal.fire({
            title: 'Data Kelas Kosong',
            text: 'Anda belum memiliki data Kelas. Silahkan buat Kelas terlebih dahulu di menu "Master Kelas" sebelum membuat jadwal.',
            icon: 'warning',
            confirmButtonText: 'Oke, Mengerti',
            confirmButtonColor: '#137fec'
        });
        return;
    }

    if (schedule) {
        setEditingId(schedule.id);
        setFormData({
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            className: schedule.className,
            subject: schedule.subject,
            room: schedule.room
        });
    } else {
        setEditingId(null);
        // Default to first class if available
        const defaultClass = classes.length > 0 ? classes[0].name : '';
        setFormData({
            day: activeDay,
            startTime: '07:30',
            endTime: '09:00',
            className: defaultClass,
            subject: '',
            room: ''
        });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. VALIDATION: Check for empty fields
    if (!formData.day || !formData.startTime || !formData.endTime || !formData.className || !formData.subject.trim() || !formData.room.trim()) {
         Swal.fire({
              title: 'Gagal Menyimpan',
              text: "Semua kolom (Hari, Jam, Kelas, Mapel, Ruangan) wajib diisi!",
              icon: 'error',
              confirmButtonColor: '#d33',
              confirmButtonText: 'OK'
          });
          return;
    }

    // 2. AUTO-CAPITALIZE FIELDS
    const formattedData = {
        ...formData,
        className: formData.className, // Already selected from dropdown (exact value)
        subject: toTitleCase(formData.subject),
        room: toTitleCase(formData.room)
    };

    if (editingId) {
        // Update
        const updated = schedules.map(s => s.id === editingId ? { ...formattedData, id: editingId } : s);
        onUpdateSchedules(updated);
    } else {
        // Add
        const newItem: ScheduleItem = {
            id: Date.now().toString(),
            ...formattedData
        };
        onUpdateSchedules([...schedules, newItem]);
    }
    setIsModalOpen(false);
    
    Swal.fire({
          title: 'Berhasil!',
          text: 'Jadwal telah disimpan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
    });
  };

  const handleDelete = (id: string) => {
      Swal.fire({
          title: 'Hapus Jadwal?',
          text: "Jadwal yang dihapus tidak dapat dikembalikan!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Ya, hapus!',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateSchedules(schedules.filter(s => s.id !== id));
              Swal.fire(
                  'Terhapus!',
                  'Jadwal berhasil dihapus.',
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
        <span className="text-primary text-sm font-bold">Master Jadwal Pelajaran</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Master Jadwal Mengajar</h2>
          <p className="text-slate-500 text-base font-normal">Atur jadwal pertemuan tatap muka per kelas dan hari.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
        >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Tambah Jadwal
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DAYS.map(day => (
            <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    activeDay === day 
                    ? 'bg-primary text-white shadow-md ring-2 ring-primary/20' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
            >
                {day}
            </button>
        ))}
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        
        {/* Toolbar - Consistent with other managers */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
           <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
             <input 
                type="text" 
                placeholder="Cari mapel, kelas, ruang..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-72 focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400 bg-white" 
             />
           </div>
           <div className="flex gap-2">
             <button className="p-2 text-slate-500 hover:text-primary hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"><span className="material-symbols-outlined">filter_list</span></button>
           </div>
        </div>

        {filteredSchedules.length > 0 ? (
            <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Jam Mulai</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Jam Selesai</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ruangan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-600">{item.startTime}</td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-400">{item.endTime}</td>
                    <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                            {item.className}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{item.subject}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-slate-400">meeting_room</span>
                        {item.room}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                <p className="text-sm text-slate-500">Menampilkan {filteredSchedules.length} jadwal hari {activeDay}</p>
                <div className="flex gap-2">
                    <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button className="px-3 py-1 bg-primary text-white rounded-lg text-sm font-bold">1</button>
                    <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">event_busy</span>
                <p>Tidak ada jadwal untuk hari {activeDay} {searchQuery && 'yang cocok'}</p>
                {!searchQuery && (
                    <button onClick={() => handleOpenModal()} className="mt-4 text-primary text-sm font-bold hover:underline">Tambah Jadwal Hari Ini</button>
                )}
            </div>
        )}
      </div>

       {/* Modal Form */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <form onSubmit={handleSave} className="p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Hari <span className="text-red-500">*</span></label>
                          <select 
                             required
                             className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                             value={formData.day}
                             onChange={(e) => setFormData({...formData, day: e.target.value})}
                          >
                              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Jam Mulai <span className="text-red-500">*</span></label>
                            <input 
                                type="time" 
                                required
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.startTime}
                                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Jam Selesai <span className="text-red-500">*</span></label>
                            <input 
                                type="time" 
                                required
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.endTime}
                                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                            />
                        </div>
                      </div>
                      
                      {/* Class Dropdown Selection */}
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Kelas <span className="text-red-500">*</span></label>
                          <select 
                              required
                              className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white cursor-pointer"
                              value={formData.className}
                              onChange={(e) => setFormData({...formData, className: e.target.value})}
                          >
                              <option value="">-- Pilih Kelas --</option>
                              {classes.map(cls => (
                                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                              ))}
                          </select>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Mata Pelajaran <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              required
                              placeholder="Nama Mapel"
                              className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                              value={formData.subject}
                              onChange={(e) => setFormData({...formData, subject: e.target.value})}
                          />
                      </div>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Ruangan <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              required
                              placeholder="Contoh: Lab Komputer"
                              className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                              value={formData.room}
                              onChange={(e) => setFormData({...formData, room: e.target.value})}
                          />
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
                              Simpan
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
