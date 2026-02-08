
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, LearningObjective, GradeData, Subject, IdentityData, SUBJECTS_DATA } from '../types';
import { calculateStudentGrade } from '../utils/grading';
import { supabase } from '../utils/supabase';

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
  
  const [activeTab, setActiveTab] = useState<'FORMATIVE' | 'SUMMATIVE'>('FORMATIVE');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1');
  const [currentKktp, setCurrentKktp] = useState<number>(75);

  // --- INITIALIZATION ---
  useEffect(() => { if (initialClass) setSelectedClass(initialClass); }, [initialClass]);
  useEffect(() => {
      const activeSem = identity.semester === 'Genap' || identity.semester === '2' ? '2' : '1';
      setSelectedSemester(activeSem);
  }, [identity.semester]);

  // --- FETCH DATA FROM SUPABASE (ADAPTER) ---
  useEffect(() => {
      if (!selectedClass || students.length === 0) return;

      const fetchGrades = async () => {
          // 1. Find Student IDs in this class
          const classStudentIds = students.filter(s => s.className === selectedClass).map(s => s.id);
          if (classStudentIds.length === 0) return;

          // 2. Fetch Formative Grades
          const { data: formGrades } = await supabase
              .from('grade_formative')
              .select('*')
              .in('student_id', classStudentIds);

          // 3. Fetch Summative Grades
          const { data: sumGrades } = await supabase
              .from('grade_summative')
              .select('*')
              .in('student_id', classStudentIds);

          // 4. Transform to UI GradeData Structure
          const newGradeData: GradeData = { ...globalGradeData };

          classStudentIds.forEach(sid => {
              if (!newGradeData[sid]) newGradeData[sid] = { formative: {}, summative: {}, attitude: 0 };
          });

          formGrades?.forEach((g: any) => {
              if (newGradeData[g.student_id]) {
                  newGradeData[g.student_id].formative[g.tp_id] = g.score;
              }
          });

          sumGrades?.forEach((g: any) => {
              if (newGradeData[g.student_id]) {
                  // Assuming scope_name is unique per subject
                  newGradeData[g.student_id].summative[g.scope_name] = g.score;
              }
          });

          setGlobalGradeData(newGradeData);
      };

      fetchGrades();
  }, [selectedClass, students]); // Re-fetch when class changes

  // --- COMPUTED ---
  const availableClasses = useMemo(() => {
      const classes = new Set(students.map(s => s.className).filter(Boolean));
      return Array.from(classes).sort() as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
      if (!selectedClass) return [];
      return students.filter(s => s.className === selectedClass).sort((a,b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  const filteredTPs = useMemo(() => {
      if (!selectedSubject) return [];
      return tps.filter(tp => 
          tp.subjectId === selectedSubject && 
          tp.semester.toString() === selectedSemester
      );
  }, [tps, selectedSubject, selectedSemester]);

  const uniqueScopes = useMemo(() => {
      const scopes = new Set<string>();
      filteredTPs.forEach(tp => scopes.add(tp.scope || 'Materi Umum'));
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

  const stats = useMemo(() => {
      return filteredStudents.reduce((acc, student) => {
          const res = calculateStudentGrade(student.id, globalGradeData, filteredTPs, currentKktp);
          if (res.finalScore > 0) {
              if (res.isPassed) acc.tuntas++; else acc.remedial++;
          }
          return acc;
      }, { tuntas: 0, remedial: 0 });
  }, [filteredStudents, globalGradeData, filteredTPs, currentKktp]);

  // --- HANDLERS (UPSERT TO DB) ---

  const handleFormativeScore = useCallback(async (studentId: string, tpId: string, value: string) => {
      const numValue = value === '' ? undefined : parseFloat(value);
      if (numValue !== undefined && (numValue < 0 || numValue > 100)) return;

      // 1. Optimistic Update
      setGlobalGradeData(prev => {
          const sData = prev[studentId] || { formative: {}, summative: {}, attitude: 0 };
          return {
              ...prev,
              [studentId]: {
                  ...sData,
                  formative: { ...(sData.formative || {}), [tpId]: numValue !== undefined ? numValue : 0 }
              }
          };
      });

      // 2. DB Update (Upsert)
      if (numValue !== undefined) {
          await supabase.from('grade_formative').upsert({
              student_id: studentId,
              tp_id: tpId,
              score: numValue,
              updated_at: new Date()
          }, { onConflict: 'student_id, tp_id' });
      } else {
          // If cleared, delete? Or set to 0? For now keep row with 0/null or delete
          // Deleting is cleaner for "empty" state
          await supabase.from('grade_formative').delete().match({ student_id: studentId, tp_id: tpId });
      }

  }, [setGlobalGradeData]);

  const handleSummativeScore = useCallback(async (studentId: string, scopeName: string, value: string) => {
      const numValue = value === '' ? undefined : parseFloat(value);
      if (numValue !== undefined && (numValue < 0 || numValue > 100)) return;

      setGlobalGradeData(prev => {
          const sData = prev[studentId] || { formative: {}, summative: {}, attitude: 0 };
          return {
              ...prev,
              [studentId]: {
                  ...sData,
                  summative: { ...(sData.summative || {}), [scopeName]: numValue !== undefined ? numValue : 0 }
              }
          };
      });

      // DB Update
      if (numValue !== undefined) {
          await supabase.from('grade_summative').upsert({
              student_id: studentId,
              subject_name: selectedSubject, // Need Subject Name here for constraint
              scope_name: scopeName,
              score: numValue,
              updated_at: new Date()
          }, { onConflict: 'student_id, subject_name, scope_name' });
      }
  }, [setGlobalGradeData, selectedSubject]);

  return {
    state: { activeTab, currentTime, selectedClass, selectedSubject, selectedSemester, currentKktp },
    setters: { setActiveTab, setSelectedClass, setSelectedSubject, setSelectedSemester, setCurrentKktp },
    computed: { availableClasses, filteredStudents, uniqueScopes, tpsByScope, stats, filteredTPs },
    handlers: { handleFormativeScore, handleSummativeScore }
  };
};
