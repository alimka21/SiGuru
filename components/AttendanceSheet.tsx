
import React, { useState, useMemo, useEffect } from 'react';
import { Student, Subject, AttendanceData, AttendanceStatus, ScheduleItem } from '../types';

declare const Swal: any;

interface Props {
  students: Student[];
  subject: Subject;
  schedules: ScheduleItem[];
  initialClass?: string;
  initialScheduleId?: string;
  globalAttendance: AttendanceData;
  setGlobalAttendance: React.Dispatch<React.SetStateAction<AttendanceData>>;
}

const DAY_MAP: { [key: string]: number } = {
    'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
};

export const AttendanceSheet: React.FC<Props> = ({ 
    students, subject, schedules, initialClass, initialScheduleId, globalAttendance, setGlobalAttendance 
}) => {
  // Local state for editing before saving
  const [currentSessionData, setCurrentSessionData] = useState<{[studentId: string]: AttendanceStatus}>({});
  
  // Selection States
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 1. Get Unique Classes
  const availableClasses = useMemo(() => {
    const classes = new Set(schedules.map(s => s.className));
    return Array.from(classes).sort();
  }, [schedules]);

  // 2. Filter Schedules
  const availableSchedules = useMemo(() => {
    if (!selectedClass) return [];
    return schedules
        .filter(s => s.className === selectedClass)
        .sort((a, b) => a.day.localeCompare(b.day));
  }, [selectedClass, schedules]);

  // 3. Filter Students
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.className === selectedClass || !s.className);
  }, [selectedClass, students]);

  // --- LOGIC: GENERATE DATES BASED ON SCHEDULE ROUTINE ---
  const generatedDates = useMemo(() => {
      if (!selectedScheduleId) return [];
      
      const schedule = schedules.find(s => s.id === selectedScheduleId);
      if (!schedule) return [];

      const targetDay = DAY_MAP[schedule.day]; // e.g., Senin = 1
      const dates: string[] = [];
      const today = new Date();
      
      // Look back 8 weeks (approx 2 months of routine)
      for (let i = 0; i < 60; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          if (d.getDay() === targetDay) {
              dates.push(d.toISOString().split('T')[0]);
          }
      }
      return dates; // ["2024-02-05", "2024-01-29", ...]
  }, [selectedScheduleId, schedules]);

  // --- INITIALIZATION & NAVIGATION HANDLING ---
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
    if (initialScheduleId) setSelectedScheduleId(initialScheduleId);
  }, [initialClass, initialScheduleId]);

  // Auto-select "Today" if it matches schedule
  useEffect(() => {
      if (generatedDates.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          // If today is in the generated list (meaning today is the correct day of week), select it
          if (generatedDates.includes(todayStr)) {
              setSelectedDate(todayStr);
          } else {
              // If not today, default to empty to force selection, OR select latest
              // setSelectedDate(generatedDates[0]); // Optional: Select latest past date
          }
      }
  }, [generatedDates]);

  // --- LOAD DATA WHEN DATE/SCHEDULE CHANGES ---
  useEffect(() => {
      if (selectedScheduleId && selectedDate) {
          const savedData = globalAttendance[selectedScheduleId]?.[selectedDate];
          if (savedData) {
              // Flatten for local state
              const flatData: any = {};
              Object.keys(savedData).forEach(sid => {
                  flatData[sid] = savedData[sid].status;
              });
              setCurrentSessionData(flatData);
          } else {
              // Reset to empty/default if new date
              setCurrentSessionData({});
          }
      }
  }, [selectedScheduleId, selectedDate, globalAttendance]);

  // --- HANDLERS ---
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentSessionData(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
      const updates: any = {};
      filteredStudents.forEach(s => updates[s.id] = status);
      setCurrentSessionData(updates);
  }

  const handleSave = () => {
      if (!selectedScheduleId || !selectedDate) return;

      Swal.fire({
          title: 'Simpan Presensi?',
          text: `Data kehadiran untuk tanggal ${selectedDate} akan disimpan ke database.`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ya, Simpan',
          confirmButtonColor: '#137fec'
      }).then((result: any) => {
          if (result.isConfirmed) {
             const recordsToSave: any = {};
             // Default 'H' if not selected but user clicks save (Implicit Hadir) OR validate? 
             // Let's validate: User must ensure data is correct. Empty means "H" usually in default systems, 
             // but here we just save what is in state. If undefined, we might assume H or skip. 
             // Let's assume explicit H for missing keys if we save.
             filteredStudents.forEach(s => {
                 recordsToSave[s.id] = { 
                     status: currentSessionData[s.id] || 'H',
                     notes: ''
                 };
             });

             setGlobalAttendance(prev => ({
                 ...prev,
                 [selectedScheduleId]: {
                     ...(prev[selectedScheduleId] || {}),
                     [selectedDate]: recordsToSave
                 }
             }));

             Swal.fire('Tersimpan!', 'Data presensi berhasil diperbarui.', 'success');
          }
      });
  };

  const isSaved = (date: string) => {
      return !!globalAttendance[selectedScheduleId]?.[date];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
       {/* Header */}
       <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Presensi Kelas</h2>
          <p className="text-slate-500 text-base font-normal">Catat kehadiran rutin berdasarkan jadwal.</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* Class Selector */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Pilih Kelas</label>
                <div className="relative">
                    <select 
                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        value={selectedClass}
                        onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setSelectedScheduleId('');
                            setSelectedDate('');
                        }}
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3 text-slate-400 pointer-events-none">expand_more</span>
                </div>
            </div>

            {/* Schedule Selector */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Pilih Jadwal Mata Pelajaran</label>
                <div className="relative">
                     <select 
                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                        value={selectedScheduleId}
                        onChange={(e) => {
                            setSelectedScheduleId(e.target.value);
                            setSelectedDate('');
                        }}
                        disabled={!selectedClass}
                    >
                        <option value="">-- Pilih Jadwal --</option>
                        {availableSchedules.map(sch => (
                            <option key={sch.id} value={sch.id}>
                                {sch.day} {sch.startTime} - {sch.subject} ({sch.room})
                            </option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3 text-slate-400 pointer-events-none">expand_more</span>
                </div>
            </div>

            {/* Routine Date Selector */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex justify-between">
                    <span>Tanggal Pertemuan</span>
                    {selectedDate && (
                         <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isSaved(selectedDate) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                             {isSaved(selectedDate) ? 'Tersimpan' : 'Draft / Baru'}
                         </span>
                    )}
                </label>
                 <div className="relative">
                     <select 
                        className={`w-full appearance-none rounded-lg border py-3 px-4 text-sm font-bold focus:ring-2 cursor-pointer disabled:opacity-50
                            ${isSaved(selectedDate) 
                                ? 'bg-green-50 border-green-200 text-green-900 focus:border-green-500 focus:ring-green-200' 
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/20'
                            }
                        `}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        disabled={!selectedScheduleId}
                    >
                        <option value="">-- Pilih Tanggal Rutinitas --</option>
                        {generatedDates.map(date => {
                            const saved = isSaved(date);
                            const label = new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
                            return (
                                <option key={date} value={date}>
                                    {saved ? '✅ ' : '⚪ '} {label} {saved ? '(Tersimpan)' : ''}
                                </option>
                            );
                        })}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3 text-slate-400 pointer-events-none">event</span>
                 </div>
            </div>
        </div>
      </div>

      {/* Student List */}
      {selectedClass && selectedScheduleId && selectedDate ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
            {/* Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex gap-2">
                    <button onClick={() => markAll('H')} className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-green-50 text-green-700 transition-colors shadow-sm">Set Semua Hadir</button>
                    <button onClick={() => markAll('A')} className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-red-50 text-red-700 transition-colors shadow-sm">Set Semua Alfa</button>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase">Pertemuan Tanggal</p>
                        <p className="text-sm font-bold text-slate-900">
                            {new Date(selectedDate).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                        </p>
                    </div>
                 </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-3 w-16 text-center">No</th>
                            <th className="px-6 py-3">Nama Siswa</th>
                            <th className="px-6 py-3 text-center w-1/3">Status Kehadiran</th>
                            <th className="px-6 py-3">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((student, index) => {
                            const status = currentSessionData[student.id] || 'H'; // Default visual 'H' for editing
                            return (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-center text-sm text-slate-500">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                        <p className="text-xs text-slate-400">{student.nis}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1">
                                            {[
                                                { id: 'H', label: 'Hadir', color: 'green' },
                                                { id: 'I', label: 'Izin', color: 'blue' },
                                                { id: 'S', label: 'Sakit', color: 'orange' },
                                                { id: 'A', label: 'Alfa', color: 'red' }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => handleStatusChange(student.id, type.id as AttendanceStatus)}
                                                    className={`
                                                        w-10 h-10 rounded-lg text-xs font-bold transition-all border
                                                        ${status === type.id 
                                                            ? `bg-${type.color}-600 text-white border-${type.color}-600 shadow-md transform scale-105` 
                                                            : `bg-white text-slate-400 border-slate-200 hover:border-${type.color}-300 hover:text-${type.color}-500`
                                                        }
                                                    `}
                                                >
                                                    {type.id}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text" 
                                            placeholder="Catatan..." 
                                            className="w-full border-b border-slate-200 focus:border-primary border-t-0 border-x-0 bg-transparent text-sm focus:ring-0 px-0 font-medium text-slate-900"
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                    Tidak ada siswa ditemukan di kelas ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Footer Action */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-primary text-primary rounded-lg font-bold shadow-lg shadow-blue-100 hover:bg-blue-50 transition-all"
                >
                    <span className="material-symbols-outlined">save</span>
                    {isSaved(selectedDate) ? 'Update Presensi' : 'Simpan Presensi Baru'}
                </button>
            </div>
          </div>
      ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
               <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">calendar_clock</span>
               <p className="font-medium text-lg">Pilih Jadwal & Tanggal</p>
               <p className="text-sm text-center max-w-md mt-2">
                   Sistem otomatis mendeteksi tanggal pertemuan berdasarkan hari jadwal.<br/>
                   Pilih tanggal berwarna <strong>Hijau (✅)</strong> untuk melihat atau mengedit data yang tersimpan.
               </p>
          </div>
      )}
    </div>
  );
};
