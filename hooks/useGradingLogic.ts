
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { z } from 'zod'; 
import { Student, LearningObjective, GradeData, Subject, IdentityData } from '../types';
import { calculateStudentGrade } from '../utils/grading';

interface UseGradingLogicProps {
  students: Student[];
  tps: LearningObjective[];
  subject: Subject;
  initialClass?: string;
  globalGradeData: GradeData;
  setGlobalGradeData: React.Dispatch<React.SetStateAction<GradeData>>;
  identity: IdentityData; // Added identity for role based logic
}

export const useGradingLogic = ({
  students,
  tps,
  subject,
  initialClass,
  globalGradeData,
  setGlobalGradeData,
  identity
}: UseGradingLogicProps) => {
  // --- ROUTER LOCATION ---
  const location = useLocation();

  // --- STATE ---
  // Restore Tabs Logic
  const [activeTab, setActiveTab] = useState<'FORMATIVE' | 'SUMMATIVE'>('SUMMATIVE');

  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // --- EFFECTS ---
  
  // 1. Initialize Class
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
  }, [initialClass]);

  // 2. Initialize Subject based on Identity
  useEffect(() => {
      // Jika belum ada subject yang dipilih
      if (!selectedSubject) {
          if (identity.role === 'SUBJECT_TEACHER' && identity.subjectName) {
              // Guru Mapel: Default ke mapel mereka, tapi nanti bisa diubah via dropdown jika list tersedia
              // Kita set ID mapel. Karena di mock data ID mapel statis, kita coba match nama dulu atau default.
              // Untuk simplifikasi mock, kita set default ke 's1' atau ID yang sesuai jika ada match.
              // Di real app, ini akan mencari ID based on Name.
              setSelectedSubject('s1'); // Default fallback
          } else {
              // Guru Kelas (SD): Default ke Mapel pertama (misal Matematika / B.Indo)
              setSelectedSubject('Bahasa Indonesia'); 
          }
      }
  }, [identity, selectedSubject]);

  // 3. Time Interval
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- COMPUTED ---

  const availableClasses = useMemo(() => {
      const classes = new Set(students.map(s => s.className).filter(Boolean));
      return Array.from(classes).sort() as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
      if (!selectedClass) return [];
      return students.filter(s => s.className === selectedClass).sort((a,b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  // Filter TPs based on Selected Subject (Crucial for SD vs Mapel context)
  // Note: In a real app, TPs have a subjectId. We filter by that.
  // Since mock TPs might not strictly follow, we try to filter if subjectId matches, or show all if undefined.
  const filteredTPs = useMemo(() => {
      // Logic: Filter TPs by selected Subject ID/Name
      // If TP.subjectId is missing, assume it belongs to all (or generic)
      // For this prototype, we map specific subjects if needed.
      return tps; 
      // In production: return tps.filter(tp => tp.subjectId === selectedSubject);
  }, [tps, selectedSubject]);

  // 1. SUMMATIVE COLUMNS: Unique Scopes from Filtered TPs
  const uniqueScopes = useMemo(() => {
      const scopes = new Set<string>();
      filteredTPs.forEach(tp => {
          scopes.add(tp.scope || 'Materi Umum');
      });
      return Array.from(scopes).sort();
  }, [filteredTPs]);

  // 2. FORMATIVE COLUMNS: Group Filtered TPs by Scope
  const tpsByScope = useMemo(() => {
      const grouped: Record<string, LearningObjective[]> = {};
      filteredTPs.forEach(tp => {
          const s = tp.scope || 'Materi Umum';
          if (!grouped[s]) grouped[s] = [];
          grouped[s].push(tp);
      });
      return grouped;
  }, [filteredTPs]);

  // Stats Calculation
  const stats = useMemo(() => {
      return filteredStudents.reduce((acc, student) => {
          const res = calculateStudentGrade(student.id, globalGradeData, filteredTPs, subject.kktp);
          if (res.finalScore > 0) {
              if (res.isPassed) acc.tuntas++; else acc.remedial++;
          }
          return acc;
      }, { tuntas: 0, remedial: 0 });
  }, [filteredStudents, globalGradeData, filteredTPs, subject.kktp]);

  // --- HANDLERS ---

  // Handle Formative Checkbox (Boolean)
  const handleFormativeCheck = useCallback((studentId: string, criteriaId: string, checked: boolean) => {
      setGlobalGradeData(prev => {
          const sData = prev[studentId] || { formative: {}, summative: {}, attitude: 0 };
          return {
              ...prev,
              [studentId]: {
                  ...sData,
                  formative: {
                      ...(sData.formative || {}),
                      [criteriaId]: checked
                  }
              }
          };
      });
  }, [setGlobalGradeData]);

  // Handle Summative Input (Number) by Scope
  const handleSummativeScore = useCallback((studentId: string, scopeName: string, value: string) => {
      const numValue = value === '' ? undefined : parseFloat(value);
      
      if (numValue !== undefined && (numValue < 0 || numValue > 100)) {
          return; 
      }

      setGlobalGradeData(prev => {
          const sData = prev[studentId] || { formative: {}, summative: {}, attitude: 0 };
          return {
              ...prev,
              [studentId]: {
                  ...sData,
                  summative: {
                      ...(sData.summative || {}),
                      [scopeName]: numValue !== undefined ? numValue : 0
                  }
              }
          };
      });
  }, [setGlobalGradeData]);

  return {
    state: {
      activeTab,
      currentTime,
      selectedClass,
      selectedSubject
    },
    setters: {
      setActiveTab,
      setSelectedClass,
      setSelectedSubject
    },
    computed: {
      availableClasses,
      filteredStudents,
      uniqueScopes,
      tpsByScope, 
      stats,
      filteredTPs
    },
    handlers: {
      handleFormativeCheck,
      handleSummativeScore
    }
  };
};
