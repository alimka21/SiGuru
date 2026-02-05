
import { GradeData, CalculatedGrade, LearningObjective } from '../types';

/**
 * FUNGSI PERHITUNGAN NILAI OTOMATIS (UPDATED)
 * Logic:
 * 1. Formative (Checkbox): Used for Description/Progress tracking only. Not in Final Score.
 * 2. Summative (Number): Input per Lingkup Materi. Averaged for Final Score.
 * 3. Attitude (Number): Weight added to final score.
 * 
 * Rumus Baru: (AVG(Sumatif per Lingkup Materi) * 90%) + (Sikap * 10%)
 * *Bobot bisa disesuaikan di UI, default hardcoded dulu sesuai request
 */
export const calculateStudentGrade = (
  studentId: string,
  gradeData: GradeData,
  tps: LearningObjective[], 
  kktp: number
): CalculatedGrade => {
  const studentGrades = gradeData[studentId];
  
  if (!studentGrades) {
    return { avgFormative: 0, avgSummative: 0, finalScore: 0, isPassed: false };
  }

  // 1. Calculate Formative Progress (Checkbox Count)
  // Just for statistical display, not final grade
  let formativeAchieved = 0;
  let formativeTotal = 0;
  
  const formativeData = studentGrades.formative || {};
  
  tps.forEach(tp => {
      tp.criteria.forEach(c => {
          formativeTotal++;
          if (formativeData[c.id]) {
              formativeAchieved++;
          }
      });
  });

  const avgFormative = formativeTotal > 0 ? Math.round((formativeAchieved / formativeTotal) * 100) : 0;

  // 2. Calculate Summative Average (Based on Lingkup Materi / Scope Scores)
  // Scopes are keys in summative object
  const summativeData = studentGrades.summative || {};
  const summativeScores = Object.values(summativeData);
  
  let summativeSum = 0;
  let summativeCount = 0;

  summativeScores.forEach(score => {
      if (typeof score === 'number' && !isNaN(score)) {
          summativeSum += score;
          summativeCount++;
      }
  });

  const avgSummative = summativeCount > 0 ? summativeSum / summativeCount : 0;
  const attitude = studentGrades.attitude || 0;

  // 3. Final Calculation
  // We assume Summative weight is high (e.g. 100% of academic score) mixed with attitude
  // Let's say Academic (Summative) 90% + Attitude 10%
  
  const finalScoreRaw = (avgSummative * 0.9) + (attitude * 0.1);
  const finalScore = Math.round(finalScoreRaw * 100) / 100;

  return {
    avgFormative, // Returns % of checkboxes checked
    avgSummative: Math.round(avgSummative),
    finalScore,
    isPassed: finalScore >= kktp
  };
};
