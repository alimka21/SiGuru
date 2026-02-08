
import { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Student, Subject, IdentityData, AttendanceData, GradeData, LearningObjective, SUBJECTS_DATA } from '../types';
import { calculateStudentGrade } from '../utils/grading';

declare const Swal: any;

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface UseRecapLogicProps {
  students: Student[];
  subject: Subject;
  identity: IdentityData;
  mode: 'GRADES' | 'ATTENDANCE'; 
  globalAttendance: AttendanceData;
  gradeData: GradeData;
  tps: LearningObjective[];
}

export const useRecapLogic = ({
  students,
  subject,
  identity,
  mode,
  globalAttendance,
  gradeData,
  tps
}: UseRecapLogicProps) => {
  
  const isClassTeacher = identity.role === 'CLASS_TEACHER';

  const availableSubjects = useMemo(() => {
      if (identity.level === 'SD') {
          return identity.role === 'CLASS_TEACHER' ? SUBJECTS_DATA.SD.CLASS_TEACHER : SUBJECTS_DATA.SD.SUBJECT_TEACHER;
      } else if (identity.level === 'SMP') {
          return SUBJECTS_DATA.SMP;
      } else {
          return SUBJECTS_DATA.SMA_SMK;
      }
  }, [identity.level, identity.role]);

  // Lock Subject for Subject Teacher
  const defaultSubjectId = useMemo(() => {
      if (identity.role === 'SUBJECT_TEACHER' && identity.subjectName) {
          return identity.subjectName; 
      }
      return availableSubjects[0];
  }, [identity, availableSubjects]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubjectId);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  
  // Point 3: Weights State
  const [weights, setWeights] = useState({ formative: 40, summative: 60 });

  useEffect(() => {
      if (defaultSubjectId) {
          setSelectedSubject(defaultSubjectId);
      }
  }, [defaultSubjectId]);

  const availableClasses = useMemo(() => {
    const classes = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(classes).sort() as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.className === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  // Generate days in month for matrix
  const daysInMonth = useMemo(() => {
      const year = new Date().getFullYear(); 
      const month = parseInt(selectedMonth);
      const days = new Date(year, month + 1, 0).getDate();
      return Array.from({length: days}, (_, i) => i + 1);
  }, [selectedMonth]);

  // Point 5: Ledger Data Logic (Only for Class Teacher Mode)
  const ledgerData = useMemo(() => {
      if (!isClassTeacher || mode !== 'GRADES') return [];

      return filteredStudents.map(student => {
          const subjectGrades: Record<string, number> = {};
          
          availableSubjects.forEach(subName => {
              // Filter TPs for this specific subject
              const subjectTPs = tps.filter(tp => tp.subjectId === subName);
              // Calculate grade using current dynamic weights
              const res = calculateStudentGrade(student.id, gradeData, subjectTPs, subject.kktp, weights);
              subjectGrades[subName] = res.finalScore;
          });

          return {
              ...student,
              subjectGrades
          };
      });
  }, [isClassTeacher, mode, filteredStudents, availableSubjects, tps, gradeData, subject.kktp, weights]);


  const reportData = useMemo(() => {
    return filteredStudents.map(student => {
        let totalStats = { present: 0, permit: 0, sick: 0, absent: 0, meetings: 0 };
        let monthlyStats = { present: 0, permit: 0, sick: 0, absent: 0, meetings: 0 };
        const dailyStatus: Record<number, string> = {};

        // ATTENDANCE LOGIC
        if (mode === 'ATTENDANCE') {
            if (isClassTeacher) {
                // Look up 'daily-{selectedClass}'
                const scheduleId = `daily-${selectedClass}`;
                const datesObj = globalAttendance[scheduleId] || {};
                
                Object.keys(datesObj).forEach(dateStr => {
                    const recordDate = new Date(dateStr);
                    const record = datesObj[dateStr][student.id];
                    
                    if (record) {
                        totalStats.meetings++;
                        if (record.status === 'H') totalStats.present++;
                        else if (record.status === 'I') totalStats.permit++;
                        else if (record.status === 'S') totalStats.sick++;
                        else if (record.status === 'A') totalStats.absent++;

                        if (recordDate.getMonth() === parseInt(selectedMonth)) {
                            monthlyStats.meetings++;
                            const day = recordDate.getDate();
                            dailyStatus[day] = record.status; // Fill Matrix
                            
                            if (record.status === 'H') monthlyStats.present++;
                            else if (record.status === 'I') monthlyStats.permit++;
                            else if (record.status === 'S') monthlyStats.sick++;
                            else if (record.status === 'A') monthlyStats.absent++;
                        }
                    }
                });
            } else {
                // Subject Teacher Logic
                Object.keys(globalAttendance).forEach(schId => {
                    const datesObj = globalAttendance[schId];
                    Object.keys(datesObj).forEach(dateStr => {
                        const record = datesObj[dateStr][student.id];
                        if (record) {
                            totalStats.meetings++;
                            if (record.status === 'H') totalStats.present++;
                            else if (record.status === 'I') totalStats.permit++;
                            else if (record.status === 'S') totalStats.sick++;
                            else if (record.status === 'A') totalStats.absent++;

                            const recordDate = new Date(dateStr);
                            if (recordDate.getMonth() === parseInt(selectedMonth)) {
                                monthlyStats.meetings++;
                                if (record.status === 'H') monthlyStats.present++;
                                else if (record.status === 'I') monthlyStats.permit++;
                                else if (record.status === 'S') monthlyStats.sick++;
                                else if (record.status === 'A') monthlyStats.absent++;
                            }
                        }
                    });
                });
            }
        }

        const totalPercentage = totalStats.meetings > 0 
            ? Math.round((totalStats.present / totalStats.meetings) * 100) 
            : 0;
        
        const monthlyPercentage = monthlyStats.meetings > 0
            ? Math.round((monthlyStats.present / monthlyStats.meetings) * 100)
            : 0;

        // GRADES LOGIC (Single Subject View)
        // If Class Teacher is viewing this "standard" reportData, it relies on selectedSubject.
        // But for Class Teacher we usually use `ledgerData` above for the main view.
        // We keep this for Subject Teachers OR if Class Teacher wants detailed breakdown of 1 subject.
        
        // Filter TPs based on Selected Subject
        const subjectTPs = tps.filter(tp => tp.subjectId === selectedSubject);
        
        // Pass weights
        const gradeResult = calculateStudentGrade(student.id, gradeData, subjectTPs, subject.kktp, weights); 
        
        return {
            ...student,
            grades: { 
                formative: gradeResult.avgFormative, 
                summative: gradeResult.avgSummative, 
                finalScore: gradeResult.finalScore, 
                isPassed: gradeResult.isPassed 
            },
            attendance: { 
                total: { ...totalStats, percentage: totalPercentage },
                monthly: { ...monthlyStats, percentage: monthlyPercentage },
                daily: dailyStatus
            }
        };
    });
  }, [filteredStudents, subject.kktp, globalAttendance, selectedMonth, gradeData, tps, selectedSubject, mode, isClassTeacher, selectedClass, weights]);

  const handleExportExcel = async () => {
    if (filteredStudents.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(mode === 'GRADES' ? 'Rekap Nilai' : 'Rekap Presensi');
    const monthName = MONTH_NAMES[parseInt(selectedMonth)];
    const subjectName = selectedSubject || 'Mata Pelajaran';

    // Header
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = identity.schoolName;
    sheet.getCell('A1').font = { size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `REKAPITULASI ${mode === 'GRADES' ? 'NILAI AKHIR' : 'KEHADIRAN SISWA'}`;
    sheet.getCell('A2').font = { size: 12, bold: true };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([`Kelas: ${selectedClass}`, '', '', '', `Mapel: ${isClassTeacher && mode === 'GRADES' ? 'SEMUA (LEGER)' : subjectName}`]);
    sheet.addRow([`Tahun Ajaran: ${identity.academicYear}`, '', '', '', `Semester: ${identity.semester}`]);
    if (mode === 'ATTENDANCE') {
        sheet.addRow([`Bulan Laporan: ${monthName}`, '', '', '', '']);
    }
    sheet.addRow([]);

    let headerRowIndex = 0;

    if (mode === 'GRADES') {
        if (isClassTeacher) {
            // LEGER HEADER
            const headerRow = sheet.addRow(['No', 'NIS', 'Nama Siswa', ...availableSubjects, '']);
            headerRowIndex = headerRow.number;
        } else {
            // SUBJECT HEADER
            const headerRow = sheet.addRow(['No', 'NIS', 'Nama Siswa', `Rata-rata Formatif (${weights.formative}%)`, `Rata-rata Sumatif (${weights.summative}%)`, 'Nilai Akhir', 'Status']);
            headerRowIndex = headerRow.number;
        }
    } else {
        // Attendance Header Logic
        if (isClassTeacher) {
            // Matrix Header
            const daysHeader = daysInMonth.map(d => d.toString());
            const headerRow = sheet.addRow(['No', 'NIS', 'Nama Siswa', ...daysHeader, 'Total (S/I/A)', '% Kehadiran']);
            headerRowIndex = headerRow.number;
        } else {
            // Summary Header
            const row1 = sheet.addRow(['No', 'NIS', 'Nama Siswa', `Rincian Bulan ${monthName}`, '', '', '', 'Total Akumulasi', '']);
            const row2 = sheet.addRow(['', '', '', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alfa (A)', 'Total Tatap Muka', 'Persentase (%)']);
            headerRowIndex = row1.number;
            sheet.mergeCells(`A${headerRowIndex}:A${headerRowIndex+1}`);
            sheet.mergeCells(`B${headerRowIndex}:B${headerRowIndex+1}`);
            sheet.mergeCells(`C${headerRowIndex}:C${headerRowIndex+1}`);
            sheet.mergeCells(`D${headerRowIndex}:G${headerRowIndex}`);
            sheet.mergeCells(`H${headerRowIndex}:I${headerRowIndex}`);
        }
    }

    const headerRow = sheet.getRow(headerRowIndex);
    headerRow.font = { bold: true };

    if (mode === 'GRADES' && isClassTeacher) {
        // LEGER ROWS
        ledgerData.forEach((d, i) => {
            const subjectScores = availableSubjects.map(sub => d.subjectGrades[sub] || 0);
            sheet.addRow([i + 1, d.nis, d.name, ...subjectScores]);
        });
    } else {
        // STANDARD ROWS
        reportData.forEach((d, i) => {
            let rowValues = [];
            if (mode === 'GRADES') {
                rowValues = [
                    i + 1, d.nis, d.name, 
                    d.grades.formative, d.grades.summative, 
                    d.grades.finalScore, 
                    d.grades.isPassed ? 'TUNTAS' : 'REMEDIAL'
                ];
            } else {
                if (isClassTeacher) {
                    const dailyCells = daysInMonth.map(day => d.attendance.daily[day] || '-');
                    const summary = `${d.attendance.monthly.sick}/${d.attendance.monthly.permit}/${d.attendance.monthly.absent}`;
                    rowValues = [i + 1, d.nis, d.name, ...dailyCells, summary, `${d.attendance.monthly.percentage}%`];
                } else {
                    rowValues = [
                        i + 1, d.nis, d.name, 
                        d.attendance.monthly.present, d.attendance.monthly.permit, d.attendance.monthly.sick, d.attendance.monthly.absent,
                        d.attendance.total.meetings, `${d.attendance.total.percentage}%`
                    ];
                }
            }
            sheet.addRow(rowValues);
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Rekap_${mode}_${selectedClass}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    Swal.fire('Export Berhasil', 'File Excel telah diunduh.', 'success');
  };

  return {
      state: { selectedClass, selectedSubject, selectedMonth, monthNames: MONTH_NAMES, availableSubjects, weights },
      setters: { setSelectedClass, setSelectedSubject, setSelectedMonth, setWeights },
      computed: { availableClasses, filteredStudents, reportData, ledgerData, isClassTeacher, daysInMonth },
      handlers: { handleExportExcel }
  };
};
