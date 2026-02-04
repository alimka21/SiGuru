
import { GradeData, CalculatedGrade, LearningObjective } from '../types';

/**
 * FUNGSI PERHITUNGAN NILAI OTOMATIS
 * Rumus: (AVG(Formatif) * 40%) + (AVG(Sumatif) * 50%) + (Sikap * 10%)
 */
export const calculateStudentGrade = (
  studentId: string,
  gradeData: GradeData,
  tps: LearningObjective[], // Need TPs to know which criteria is Formative/Summative
  kktp: number
): CalculatedGrade => {
  const studentGrades = gradeData[studentId];
  
  if (!studentGrades) {
    return { avgFormative: 0, avgSummative: 0, finalScore: 0, isPassed: false };
  }

  let formativeSum = 0;
  let formativeCount = 0;
  let summativeSum = 0;
  let summativeCount = 0;

  // Iterate over all TPs and their Criteria to identify type and get score
  tps.forEach(tp => {
      tp.criteria.forEach(criteria => {
          const score = studentGrades.scores[criteria.id];
          if (score !== undefined && score !== null && !isNaN(score)) {
              if (criteria.type === 'SUMMATIVE') {
                  summativeSum += score;
                  summativeCount++;
              } else {
                  // Default to Formative
                  formativeSum += score;
                  formativeCount++;
              }
          }
      });
  });

  // Calculate Averages
  const avgFormative = formativeCount > 0 ? formativeSum / formativeCount : 0;
  const avgSummative = summativeCount > 0 ? summativeSum / summativeCount : 0;
  const attitude = studentGrades.attitude || 0;

  // Apply Formula: (Formatif * 0.4) + (Sumatif * 0.5) + (Sikap * 0.1)
  // Jika Summative kosong, beban bisa dialihkan ke Formative atau tetap 0 (tergantung kebijakan).
  // Di sini kita ikuti rumus ketat.
  
  const finalScoreRaw = (avgFormative * 0.4) + (avgSummative * 0.5) + (attitude * 0.1);
  
  // Jika belum ada nilai sumatif, rumus mungkin terlihat kecil hasilnya. 
  // Opsi: Normalisasi jika sumatif 0? Tidak, biarkan raw sesuai progress.
  
  const finalScore = Math.round(finalScoreRaw * 100) / 100;

  return {
    avgFormative: Math.round(avgFormative),
    avgSummative: Math.round(avgSummative),
    finalScore,
    isPassed: finalScore >= kktp
  };
};
