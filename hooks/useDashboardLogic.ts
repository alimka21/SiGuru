
import { useState, useEffect, useMemo } from 'react';
import { ScheduleItem, AttendanceData, GradeData, LearningObjective, Subject, AttendanceRecord } from '../types';
import { calculateStudentGrade } from '../utils/grading';

const DAYS_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface UseDashboardLogicProps {
  schedules: ScheduleItem[];
  attendanceData: AttendanceData;
  gradeData: GradeData;
  subject: Subject;
  tps: LearningObjective[];
}

export const useDashboardLogic = ({
  schedules,
  attendanceData,
  gradeData,
  subject,
  tps
}: UseDashboardLogicProps) => {
  // --- STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000); 
    
    return () => clearInterval(timer);
  }, []);

  // --- COMPUTED ---
  const currentDayName = DAYS_MAP[currentTime.getDay()];
  
  // Filter schedules for today
  const todaysSchedules = useMemo(() => {
      return schedules
        .filter(s => s.day === currentDayName)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, currentDayName]);

  const dateString = currentTime.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Makassar' 
  });

  const todayIsoDate = useMemo(() => {
      const d = new Date();
      // Simple ISO Date (YYYY-MM-DD) for local matching
      return d.toISOString().split('T')[0];
  }, []);

  // --- STATS CALCULATION ---

  // 1. Average Grade Calculation
  const averageGrade = useMemo(() => {
      const studentIds = Object.keys(gradeData);
      if (studentIds.length === 0) return 0;

      let totalScore = 0;
      let count = 0;

      studentIds.forEach(sid => {
          const result = calculateStudentGrade(sid, gradeData, tps, subject.kktp);
          if (result.finalScore > 0) {
              totalScore += result.finalScore;
              count++;
          }
      });

      return count > 0 ? (totalScore / count).toFixed(1) : 0;
  }, [gradeData, subject.kktp, tps]);

  // 2. Attendance Stats for TODAY
  const attendanceStats = useMemo(() => {
      let present = 0, izin = 0, sakit = 0, alpa = 0;
      
      // Look at attendance records for TODAY's schedules
      todaysSchedules.forEach(schedule => {
          const records = attendanceData[schedule.id]?.[todayIsoDate];
          if (records) {
              Object.values(records).forEach((record: AttendanceRecord) => {
                  if (record.status === 'H') present++;
                  else if (record.status === 'I') izin++;
                  else if (record.status === 'S') sakit++;
                  else if (record.status === 'A') alpa++;
              });
          }
      });

      const total = present + izin + sakit + alpa;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return { present, izin, sakit, alpa, total, percentage };
  }, [todaysSchedules, attendanceData, todayIsoDate]);

  return {
      state: { currentTime },
      computed: {
          currentDayName,
          todaysSchedules,
          dateString,
          averageGrade,
          attendanceStats
      }
  };
};
