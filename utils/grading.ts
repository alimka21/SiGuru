
import { GradeData, CalculatedGrade } from '../types';

interface GradeWeights {
    formative: number; // Percentage (0-100)
    attitude: number; // Percentage (0-100)
    // Summative is implied as remainder or handled if we split TP vs Sumatif explicitly later. 
    // For this strict logic: Final = (Avg TP * Formative%) + (Attitude * Attitude%) + (Assumption: Remainder is not used or Logic is simplified as per user request previously).
    
    // User logic from prompt 1: (AVG(nilai_formatif) × 0.4) + (AVG(nilai_sumatif) × 0.5) + (nilai_sikap × 0.1)
    // Current Structure handles Criteria (Formatif) and Attitude. 
    // To fully support the formula, we assume `scores` are Formative.
    // Since we don't have a dedicated "Summative" column in the current Matrix UI (only Criteria columns), 
    // we will adjust the formula to be: (Avg Criteria * X%) + (Attitude * Y%) 
    // OR we treat the inputs as generic scores.
    
    // Let's make it flexible based on parameters passed.
}

/**
 * FUNGSI PERHITUNGAN NILAI
 */
export const calculateStudentGrade = (
  studentId: string,
  gradeData: GradeData,
  kktp: number,
  weights: { criteria: number, attitude: number } = { criteria: 90, attitude: 10 }
): CalculatedGrade => {
  const studentGrades = gradeData[studentId];
  
  if (!studentGrades) {
    return { avgScore: 0, finalScore: 0, isPassed: false };
  }

  // 1. Calculate Average of all Criteria Scores
  const scores = Object.values(studentGrades.scores).filter(v => v !== undefined && v !== null && !isNaN(v));
  const avgScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  // 2. Get Attitude Score (Default to 0 if missing)
  const attitude = studentGrades.attitude || 0;

  // 3. Apply Formula based on weights (converted to decimals)
  const criteriaWeight = weights.criteria / 100;
  const attitudeWeight = weights.attitude / 100;
  
  const finalScoreRaw = (avgScore * criteriaWeight) + (attitude * attitudeWeight);
  const finalScore = Math.round(finalScoreRaw * 100) / 100;

  return {
    avgScore,
    finalScore,
    isPassed: finalScore >= kktp
  };
};
