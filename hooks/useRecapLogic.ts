
import { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { Student, Subject, IdentityData, AttendanceData, GradeData, LearningObjective } from '../types';
import { calculateStudentGrade } from '../utils/grading';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const AVAILABLE_SUBJECTS = [
    { id: 's1', name: 'Matematika - Fase E' },
    { id: 's2', name: 'Fisika - Fase E' },
    { id: 's3', name: 'Kimia - Fase E' },
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
  // --- STATE ---
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(subject.id);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());

  // --- COMPUTED ---
  const availableClasses = useMemo(() => {
    const classes = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(classes).sort() as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  // AGGREGATE REAL DATA
  const reportData = useMemo(() => {
    return filteredStudents.map(student => {
        // --- ATTENDANCE CALCULATION ---
        let totalStats = { present: 0, permit: 0, sick: 0, absent: 0, meetings: 0 };
        let monthlyStats = { present: 0, permit: 0, sick: 0, absent: 0, meetings: 0 };

        // Iterate through all schedules and dates
        Object.keys(globalAttendance).forEach(schId => {
            const datesObj = globalAttendance[schId];
            Object.keys(datesObj).forEach(dateStr => {
                const record = datesObj[dateStr][student.id];
                
                if (record) {
                    // 1. Total Accumulation
                    totalStats.meetings++;
                    if (record.status === 'H') totalStats.present++;
                    else if (record.status === 'I') totalStats.permit++;
                    else if (record.status === 'S') totalStats.sick++;
                    else if (record.status === 'A') totalStats.absent++;

                    // 2. Monthly Accumulation (Check Month Index)
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

        const totalPercentage = totalStats.meetings > 0 
            ? Math.round((totalStats.present / totalStats.meetings) * 100) 
            : 0;
        
        const monthlyPercentage = monthlyStats.meetings > 0
            ? Math.round((monthlyStats.present / monthlyStats.meetings) * 100)
            : 0;

        // --- REAL GRADES CALCULATION ---
        const gradeResult = calculateStudentGrade(student.id, gradeData, tps, subject.kktp);
        const attitudeScore = gradeData[student.id]?.attitude || 0;

        return {
            ...student,
            grades: { 
                formative: gradeResult.avgFormative, 
                summative: gradeResult.avgSummative, 
                attitude: attitudeScore, 
                finalScore: gradeResult.finalScore, 
                isPassed: gradeResult.isPassed 
            },
            attendance: { 
                total: { ...totalStats, percentage: totalPercentage },
                monthly: { ...monthlyStats, percentage: monthlyPercentage }
            }
        };
    });
  }, [filteredStudents, subject.kktp, globalAttendance, selectedMonth, gradeData, tps]);

  // --- HANDLERS ---
  const handleExportExcel = async () => {
    if (reportData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(mode === 'GRADES' ? 'Rekap Nilai' : 'Rekap Presensi');
    const monthName = MONTH_NAMES[parseInt(selectedMonth)];

    // 1. Header Information
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = identity.schoolName;
    sheet.getCell('A1').font = { size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `REKAPITULASI ${mode === 'GRADES' ? 'NILAI AKHIR' : 'KEHADIRAN SISWA'}`;
    sheet.getCell('A2').font = { size: 12, bold: true };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([`Kelas: ${selectedClass}`, '', '', '', `Mapel: ${AVAILABLE_SUBJECTS.find(s => s.id === selectedSubject)?.name || subject.name}`]);
    sheet.addRow([`Tahun Ajaran: ${identity.academicYear}`, '', '', '', `Semester: ${identity.semester}`]);
    if (mode === 'ATTENDANCE') {
        sheet.addRow([`Bulan Laporan: ${monthName}`, '', '', '', '']);
    }
    sheet.addRow([]); // Spacer

    // 2. Table Headers
    let headerRowIndex = 0;

    if (mode === 'GRADES') {
        const headerRow = sheet.addRow(['No', 'NIS', 'Nama Siswa', 'Rata-rata Formatif (40%)', 'Rata-rata Sumatif (50%)', 'Nilai Sikap (10%)', 'Nilai Akhir', 'Status', 'Keterangan']);
        headerRowIndex = headerRow.number;
    } else {
        // Attendance Headers (Double Row)
        const row1 = sheet.addRow(['No', 'NIS', 'Nama Siswa', `Rincian Bulan ${monthName}`, '', '', '', 'Total Akumulasi', '']);
        const row2 = sheet.addRow(['', '', '', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alfa (A)', 'Total Tatap Muka', 'Persentase (%)']);
        
        headerRowIndex = row1.number;
        
        // Merging Header Cells
        sheet.mergeCells(`A${headerRowIndex}:A${headerRowIndex+1}`); // No
        sheet.mergeCells(`B${headerRowIndex}:B${headerRowIndex+1}`); // NIS
        sheet.mergeCells(`C${headerRowIndex}:C${headerRowIndex+1}`); // Nama
        sheet.mergeCells(`D${headerRowIndex}:G${headerRowIndex}`);   // Month Group
        sheet.mergeCells(`H${headerRowIndex}:I${headerRowIndex}`);   // Total Group
    }

    // 3. Styling Headers
    const headerRow = sheet.getRow(headerRowIndex);
    const subHeaderRow = mode === 'ATTENDANCE' ? sheet.getRow(headerRowIndex + 1) : null;
    
    [headerRow, subHeaderRow].forEach(row => {
        if(!row) return;
        row.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } }; // Primary Blue
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
    });

    // 4. Data Rows
    reportData.forEach((d, i) => {
        let rowValues = [];
        if (mode === 'GRADES') {
            rowValues = [
                i + 1, d.nis, d.name, 
                d.grades.formative, d.grades.summative, d.grades.attitude, 
                d.grades.finalScore, 
                d.grades.isPassed ? 'TUNTAS' : 'REMEDIAL',
                d.grades.isPassed ? 'Lulus KKTP' : 'Perlu Bimbingan'
            ];
        } else {
            rowValues = [
                i + 1, d.nis, d.name, 
                d.attendance.monthly.present, d.attendance.monthly.permit, d.attendance.monthly.sick, d.attendance.monthly.absent,
                d.attendance.total.meetings, `${d.attendance.total.percentage}%`
            ];
        }
        
        const row = sheet.addRow(rowValues);
        
        // Data Borders & Alignment
        row.eachCell((cell, colNumber) => {
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            if (colNumber === 1 || colNumber > 3) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        // Conditional Formatting for Status
        if (mode === 'GRADES') {
            const statusCell = row.getCell(8);
            statusCell.font = { bold: true, color: { argb: d.grades.isPassed ? 'FF008000' : 'FFFF0000' } };
        }
        // Conditional Formatting for Percentage
        if (mode === 'ATTENDANCE') {
            const percentCell = row.getCell(9);
             if (d.attendance.total.percentage < 50) {
                 percentCell.font = { color: { argb: 'FFFF0000' }, bold: true }; // Red text for low attendance
             }
        }
    });

    // 5. Column Widths
    sheet.columns.forEach((col, index) => {
        if (index === 2) col.width = 35; // Name
        else col.width = 15;
    });

    // 6. Download Trigger
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Rekap_${mode}_${selectedClass}_${monthName}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return {
      state: { selectedClass, selectedSubject, selectedMonth, monthNames: MONTH_NAMES, availableSubjects: AVAILABLE_SUBJECTS },
      setters: { setSelectedClass, setSelectedSubject, setSelectedMonth },
      computed: { availableClasses, filteredStudents, reportData },
      handlers: { handleExportExcel }
  };
};
