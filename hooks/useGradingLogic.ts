
import { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod'; 
import { Student, LearningObjective, GradeData, Subject } from '../types';
import { calculateStudentGrade } from '../utils/grading';

const scoreSchema = z.number().min(0, "Min 0").max(100, "Max 100").optional();

interface UseGradingLogicProps {
  students: Student[];
  tps: LearningObjective[];
  subject: Subject;
  initialClass?: string;
  globalGradeData: GradeData;
  setGlobalGradeData: React.Dispatch<React.SetStateAction<GradeData>>;
}

export const useGradingLogic = ({
  students,
  tps,
  subject,
  initialClass,
  globalGradeData,
  setGlobalGradeData
}: UseGradingLogicProps) => {
  // --- STATE ---
  const [errorMap, setErrorMap] = useState<{[key: string]: string}>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Weights State
  const [showConfig, setShowConfig] = useState(false);
  const [weights, setWeights] = useState({ criteria: 90, attitude: 10 });
  const [tempWeights, setTempWeights] = useState({ criteria: 90, attitude: 10 });

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(subject.id);

  // --- EFFECTS ---
  
  // Handle navigation from Dashboard
  useEffect(() => {
    if (initialClass) {
        setSelectedClass(initialClass);
    }
  }, [initialClass]);

  // Update time every minute
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
      return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  // Stats Calculation
  const stats = useMemo(() => {
      return filteredStudents.reduce((acc, student) => {
          const res = calculateStudentGrade(student.id, globalGradeData, tps, subject.kktp);
          if (res.finalScore > 0) {
              if (res.isPassed) acc.tuntas++; else acc.remedial++;
          }
          return acc;
      }, { tuntas: 0, remedial: 0 });
  }, [filteredStudents, globalGradeData, tps, subject.kktp]);

  // --- HANDLERS ---

  const handleScoreChange = useCallback((
    studentId: string, 
    type: 'criteria' | 'attitude', 
    id: string | 'value', 
    value: string
  ) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const result = scoreSchema.safeParse(numValue);
    const errorKey = `${studentId}-${type}-${id}`;

    if (!result.success && value !== '') {
        setErrorMap(prev => ({...prev, [errorKey]: result.error.issues[0].message}));
    } else {
        setErrorMap(prev => {
            const newMap = {...prev};
            delete newMap[errorKey];
            return newMap;
        });
    }
    
    setGlobalGradeData(prev => {
      const studentData = prev[studentId] || { scores: {}, attitude: 0 };
      if (type === 'criteria') {
        return { ...prev, [studentId]: { ...studentData, scores: { ...studentData.scores, [id]: numValue as number } } };
      } else {
        return { ...prev, [studentId]: { ...studentData, attitude: numValue || 0 } };
      }
    });
  }, [setGlobalGradeData]);

  const handleSaveWeights = () => {
      if (tempWeights.criteria + tempWeights.attitude !== 100) {
          alert("Total bobot harus 100%");
          return;
      }
      setWeights(tempWeights);
      setShowConfig(false);
  };

  return {
    state: {
      errorMap,
      currentTime,
      showConfig,
      weights,
      tempWeights,
      selectedClass,
      selectedSubject
    },
    setters: {
      setShowConfig,
      setTempWeights,
      setSelectedClass,
      setSelectedSubject
    },
    computed: {
      availableClasses,
      filteredStudents,
      stats
    },
    handlers: {
      handleScoreChange,
      handleSaveWeights
    }
  };
};
