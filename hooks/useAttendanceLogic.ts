
import { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceData, AttendanceStatus, ScheduleItem, IdentityData } from '../types';

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
  identity?: IdentityData; // Added Identity for Role check
}

export const useAttendanceLogic = ({
  students,
  schedules,
  globalAttendance,
  setGlobalAttendance,
  initialClass,
  initialScheduleId,
  identity
}: UseAttendanceLogicProps) => {
  // --- STATE ---
  const [currentSessionData, setCurrentSessionData] = useState<{[studentId: string]: AttendanceStatus}>({});
  
  // Selection States
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // POINT 2: Check if Class Teacher (Daily Attendance Mode)
  const isClassTeacher = identity?.role === 'CLASS_TEACHER';

  // --- COMPUTED ---

  // 1. Get Unique Classes
  const availableClasses = useMemo(() => {
    // If Class Teacher, they might only see their assigned class if implemented, 
    // but here we just list all relevant classes from schedule or student list
    const classes = new Set(schedules.map(s => s.className));
    // Also include classes from student list if schedule is empty (for Class Teacher setup)
    if (isClassTeacher) {
        students.forEach(s => { if(s.className) classes.add(s.className) });
    }
    return Array.from(classes).sort();
  }, [schedules, students, isClassTeacher]);

  // 2. Filter Schedules (Only relevant for Subject Teacher)
  const availableSchedules = useMemo(() => {
    if (!selectedClass || isClassTeacher) return [];
    return schedules
        .filter(s => s.className === selectedClass)
        .sort((a, b) => a.day.localeCompare(b.day));
  }, [selectedClass, schedules, isClassTeacher]);

  // 3. Filter Students
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.className === selectedClass || !s.className);
  }, [selectedClass, students]);

  // 4. Generate Dates based on Schedule Routine OR Daily for Class Teacher
  const generatedDates = useMemo(() => {
      // IF CLASS TEACHER: Generate all weekdays for the last 60 days
      if (isClassTeacher) {
          const dates: string[] = [];
          const today = new Date();
          for (let i = 0; i < 60; i++) {
              const d = new Date();
              d.setDate(today.getDate() - i);
              const day = d.getDay();
              if (day !== 0) { // Exclude Sunday
                  dates.push(d.toISOString().split('T')[0]);
              }
          }
          return dates;
      }

      // IF SUBJECT TEACHER: Generate based on schedule day
      if (!selectedScheduleId) return [];
      
      const schedule = schedules.find(s => s.id === selectedScheduleId);
      if (!schedule) return [];

      const targetDay = DAY_MAP[schedule.day]; // e.g., Senin = 1
      const dates: string[] = [];
      const today = new Date();
      
      for (let i = 0; i < 60; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          if (d.getDay() === targetDay) {
              dates.push(d.toISOString().split('T')[0]);
          }
      }
      return dates;
  }, [selectedScheduleId, schedules, isClassTeacher]);

  // 5. Helper to check if date is saved
  // For Class Teacher, we use a virtual schedule ID prefix "daily-"
  const effectiveScheduleId = useMemo(() => {
      if (isClassTeacher && selectedClass) return `daily-${selectedClass}`;
      return selectedScheduleId;
  }, [isClassTeacher, selectedClass, selectedScheduleId]);

  const isSaved = (date: string) => {
      return !!globalAttendance[effectiveScheduleId]?.[date];
  };

  // --- EFFECTS ---

  // Initialization
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
    if (initialScheduleId && !isClassTeacher) setSelectedScheduleId(initialScheduleId);
  }, [initialClass, initialScheduleId, isClassTeacher]);

  // Auto-select "Today"
  useEffect(() => {
      if (generatedDates.length > 0 && !selectedDate) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (generatedDates.includes(todayStr)) {
              setSelectedDate(todayStr);
          }
      }
  }, [generatedDates, selectedDate]);

  // Load Data
  useEffect(() => {
      if (effectiveScheduleId && selectedDate) {
          const savedData = globalAttendance[effectiveScheduleId]?.[selectedDate];
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
  }, [effectiveScheduleId, selectedDate, globalAttendance]);

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
      if (!effectiveScheduleId || !selectedDate) return;

      Swal.fire({
          title: 'Simpan Presensi?',
          text: `Data kehadiran untuk tanggal ${selectedDate} akan disimpan.`,
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
                 [effectiveScheduleId]: {
                     ...(prev[effectiveScheduleId] || {}),
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
    computed: { availableClasses, availableSchedules, filteredStudents, generatedDates, isSaved, isClassTeacher },
    handlers: { handleStatusChange, markAll, handleSave }
  };
};
