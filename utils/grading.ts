
import { GradeData, CalculatedGrade, LearningObjective } from '../types';

/**
 * Mendapatkan Label Kualitatif berdasarkan Interval Nilai
 * 0-40: Perlu Bimbingan
 * 41-65: Cukup
 * 66-85: Baik
 * 86-100: Sangat Baik
 */
export const getQualitativeLabel = (score: number) => {
    if (score <= 40) return { label: 'Perlu Bimbingan', color: 'text-red-600 bg-red-50 border-red-100' };
    if (score <= 65) return { label: 'Cukup', color: 'text-orange-600 bg-orange-50 border-orange-100' };
    if (score <= 85) return { label: 'Baik', color: 'text-blue-600 bg-blue-50 border-blue-100' };
    return { label: 'Sangat Baik', color: 'text-green-600 bg-green-50 border-green-100' };
};

/**
 * FUNGSI PERHITUNGAN NILAI OTOMATIS (UPDATED)
 * Supports dynamic weights for Formative and Summative.
 */
export const calculateStudentGrade = (
  studentId: string,
  gradeData: GradeData,
  tps: LearningObjective[], 
  kktp: number,
  weights?: { formative: number, summative: number } // Optional Dynamic Weights
): CalculatedGrade => {
  const studentGrades = gradeData[studentId];
  
  if (!studentGrades) {
    return { avgFormative: 0, avgSummative: 0, finalScore: 0, isPassed: false };
  }

  // 1. Calculate Formative Average (Score based)
  let formativeSum = 0;
  let formativeCount = 0;
  
  const formativeData = studentGrades.formative || {};
  
  // Iterate filtered TPs to ensure we only count relevant ones
  tps.forEach(tp => {
      if (formativeData[tp.id] !== undefined && typeof formativeData[tp.id] === 'number') {
          formativeSum += formativeData[tp.id];
          formativeCount++;
      }
  });

  const avgFormative = formativeCount > 0 ? formativeSum / formativeCount : 0;

  // 2. Calculate Summative Average (Based on Lingkup Materi / Scope Scores)
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
  let finalScore = 0;

  if (weights) {
      // Dynamic Weights from Recap (e.g., 50% / 50%) - Attitude ignored/removed
      const wForm = weights.formative / 100;
      const wSum = weights.summative / 100;
      finalScore = (avgFormative * wForm) + (avgSummative * wSum);
  } else {
      // Default / Fallback Formula (Include Attitude 10%)
      // 40% Formative + 50% Summative + 10% Attitude
      finalScore = (avgFormative * 0.4) + (avgSummative * 0.5) + (attitude * 0.1);
  }

  return {
    avgFormative: Math.round(avgFormative),
    avgSummative: Math.round(avgSummative),
    finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimals
    isPassed: finalScore >= kktp
  };
};
