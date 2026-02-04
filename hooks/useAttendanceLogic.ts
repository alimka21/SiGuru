
import { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceData, AttendanceStatus, ScheduleItem } from '../types';

declare const Swal: any;

const DAY_MAP: { [key: string]: number } = {
    'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
};

interface UseAttendanceLogicProps {
  students: Student[];
  schedules: ScheduleItem[];
  globalAttendance: AttendanceData;
  setGlobalAttendance: React.Dispatch<React.SetStateAction<AttendanceData>>;
  initialClass?: string;
  initialScheduleId?: string;
}

export const useAttendanceLogic = ({
  students,
  schedules,
  globalAttendance,
  setGlobalAttendance,
  initialClass,
  initialScheduleId
}: UseAttendanceLogicProps) => {
  // --- STATE ---
  const [currentSessionData, setCurrentSessionData] = useState<{[studentId: string]: AttendanceStatus}>({});
  
  // Selection States
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // --- COMPUTED ---

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

  // 4. Generate Dates based on Schedule Routine
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
      return dates;
  }, [selectedScheduleId, schedules]);

  // 5. Helper to check if date is saved
  const isSaved = (date: string) => {
      return !!globalAttendance[selectedScheduleId]?.[date];
  };

  // --- EFFECTS ---

  // Initialization & Navigation Handling
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
    if (initialScheduleId) setSelectedScheduleId(initialScheduleId);
  }, [initialClass, initialScheduleId]);

  // Auto-select "Today" if it matches schedule
  useEffect(() => {
      if (generatedDates.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (generatedDates.includes(todayStr)) {
              setSelectedDate(todayStr);
          }
      }
  }, [generatedDates]);

  // Load Data when Date/Schedule Changes
  useEffect(() => {
      if (selectedScheduleId && selectedDate) {
          const savedData = globalAttendance[selectedScheduleId]?.[selectedDate];
          if (savedData) {
              const flatData: any = {};
              Object.keys(savedData).forEach(sid => {
                  flatData[sid] = savedData[sid].status;
              });
              setCurrentSessionData(flatData);
          } else {
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

  return {
    state: { currentSessionData, selectedClass, selectedScheduleId, selectedDate },
    setters: { setSelectedClass, setSelectedScheduleId, setSelectedDate },
    computed: { availableClasses, availableSchedules, filteredStudents, generatedDates, isSaved },
    handlers: { handleStatusChange, markAll, handleSave }
  };
};
