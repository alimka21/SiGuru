
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Student, LearningObjective, GradeData, Subject, IdentityData, SUBJECTS_DATA } from '../types';
import { calculateStudentGrade } from '../utils/grading';

interface UseGradingLogicProps {
  students: Student[];
  tps: LearningObjective[];
  subject: Subject;
  initialClass?: string;
  globalGradeData: GradeData;
  setGlobalGradeData: React.Dispatch<React.SetStateAction<GradeData>>;
  identity: IdentityData; 
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
  const location = useLocation();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'FORMATIVE' | 'SUMMATIVE'>('FORMATIVE');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1'); // Default Semester
  
  // KKTP State (Dynamic Parameter)
  const [currentKktp, setCurrentKktp] = useState<number>(75);

  // --- EFFECTS ---
  
  // 1. Initialize Class
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
  }, [initialClass]);

  // 2. Initialize & Lock Subject based on Identity
  useEffect(() => {
      if (identity.role === 'SUBJECT_TEACHER' && identity.subjectName) {
          setSelectedSubject(identity.subjectName);
      } else if (!selectedSubject) {
          // Default fallback for Class Teacher
          if (identity.level === 'SD') {
              setSelectedSubject(SUBJECTS_DATA.SD.CLASS_TEACHER[0]);
          } else if (identity.level === 'SMP') {
              setSelectedSubject(SUBJECTS_DATA.SMP[0]);
          } else {
              setSelectedSubject(SUBJECTS_DATA.SMA_SMK[0]);
          }
      }
  }, [identity, selectedSubject]);

  // 3. Initialize Semester from Identity (Active Context)
  useEffect(() => {
      const activeSem = identity.semester === 'Genap' || identity.semester === '2' ? '2' : '1';
      setSelectedSemester(activeSem);
  }, [identity.semester]);

  // 4. Time Interval
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

  // Filter TPs based on Subject AND Semester
  const filteredTPs = useMemo(() => {
      if (!selectedSubject) return [];
      return tps.filter(tp => 
          tp.subjectId === selectedSubject && 
          tp.semester.toString() === selectedSemester
      );
  }, [tps, selectedSubject, selectedSemester]);

  const uniqueScopes = useMemo(() => {
      const scopes = new Set<string>();
      filteredTPs.forEach(tp => {
          scopes.add(tp.scope || 'Materi Umum');
      });
      return Array.from(scopes).sort();
  }, [filteredTPs]);

  const tpsByScope = useMemo(() => {
      const grouped: Record<string, LearningObjective[]> = {};
      filteredTPs.forEach(tp => {
          const s = tp.scope || 'Materi Umum';
          if (!grouped[s]) grouped[s] = [];
          grouped[s].push(tp);
      });
      return grouped;
  }, [filteredTPs]);

  // Stats Calculation uses dynamic currentKktp and correctly filtered TPs
  const stats = useMemo(() => {
      return filteredStudents.reduce((acc, student) => {
          const res = calculateStudentGrade(student.id, globalGradeData, filteredTPs, currentKktp);
          if (res.finalScore > 0) {
              if (res.isPassed) acc.tuntas++; else acc.remedial++;
          }
          return acc;
      }, { tuntas: 0, remedial: 0 });
  }, [filteredStudents, globalGradeData, filteredTPs, currentKktp]);

  // --- HANDLERS ---

  const handleFormativeScore = useCallback((studentId: string, tpId: string, value: string) => {
      const numValue = value === '' ? undefined : parseFloat(value);
      
      if (numValue !== undefined && (numValue < 0 || numValue > 100)) return;

      setGlobalGradeData(prev => {
          const sData = prev[studentId] || { formative: {}, summative: {}, attitude: 0 };
          return {
              ...prev,
              [studentId]: {
                  ...sData,
                  formative: {
                      ...(sData.formative || {}),
                      [tpId]: numValue !== undefined ? numValue : 0
                  }
              }
          };
      });
  }, [setGlobalGradeData]);

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
      selectedSubject,
      selectedSemester, // Exposed
      currentKktp
    },
    setters: {
      setActiveTab,
      setSelectedClass,
      setSelectedSubject,
      setSelectedSemester, // Exposed
      setCurrentKktp
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
      handleFormativeScore,
      handleSummativeScore
    }
  };
};
