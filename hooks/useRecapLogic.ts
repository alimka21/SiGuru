
import { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Student, Subject, IdentityData, AttendanceData, GradeData, LearningObjective } from '../types';
import { calculateStudentGrade } from '../utils/grading';

declare const Swal: any;

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// ... (Subject Definitions remain same) ...
// Daftar Mapel SD (Guru Kelas) - ID menggunakan Nama
const SD_SUBJECTS = [
    { id: 'Bahasa Indonesia', name: 'Bahasa Indonesia' },
    { id: 'Matematika', name: 'Matematika' },
    { id: 'IPAS', name: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
    { id: 'Pendidikan Pancasila', name: 'Pendidikan Pancasila' },
    { id: 'Seni Budaya', name: 'Seni Budaya' },
    { id: 'PJOK', name: 'PJOK' },
    { id: 'Bahasa Inggris', name: 'Bahasa Inggris' },
    { id: 'Muatan Lokal', name: 'Muatan Lokal' }
];

// Daftar Mapel SMP/SMA (Guru Mapel) - ID menggunakan s1, s2, dst (Sesuai GradingSheet)
const SECONDARY_SUBJECTS = [
    { id: 's1', name: 'Matematika' },
    { id: 's2', name: 'Fisika' },
    { id: 's3', name: 'Kimia' },
    { id: 's4', name: 'Biologi' },
    { id: 's5', name: 'Bahasa Indonesia' },
    { id: 's6', name: 'Bahasa Inggris' },
    { id: 's7', name: 'Sejarah' },
    { id: 's8', name: 'Geografi' },
    { id: 's9', name: 'Sosiologi' },
    { id: 's10', name: 'Ekonomi' },
    { id: 's11', name: 'Pendidikan Pancasila' },
    { id: 's12', name: 'Informatika' },
    { id: 's13', name: 'PJOK' },
    { id: 's14', name: 'Seni Budaya' },
    { id: 's15', name: 'PAI' },
    { id: 's16', name: 'PAK' },
    { id: 's17', name: 'BK' },
    { id: 's18', name: 'IPA' },
    { id: 's19', name: 'IPS' },
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
  
  const availableSubjects = useMemo(() => {
      if (identity.level === 'SD' || identity.role === 'CLASS_TEACHER') {
          return SD_SUBJECTS;
      }
      return SECONDARY_SUBJECTS;
  }, [identity.level, identity.role]);

  const defaultSubjectId = useMemo(() => {
      if (identity.role === 'SUBJECT_TEACHER' && identity.subjectName) {
          const found = availableSubjects.find(s => s.name.toLowerCase() === identity.subjectName.toLowerCase());
          return found ? found.id : availableSubjects[0]?.id;
      }
      return availableSubjects[0]?.id;
  }, [identity, availableSubjects]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubjectId);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());

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
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const reportData = useMemo(() => {
    return filteredStudents.map(student => {
        let totalStats = { present: 0, permit: 0, sick: 0, absent: 0, meetings: 0 };
        let monthlyStats = { present: 0, permit: 0, sick: 0, absent: 0, meetings: 0 };

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

        const totalPercentage = totalStats.meetings > 0 
            ? Math.round((totalStats.present / totalStats.meetings) * 100) 
            : 0;
        
        const monthlyPercentage = monthlyStats.meetings > 0
            ? Math.round((monthlyStats.present / monthlyStats.meetings) * 100)
            : 0;

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
  }, [filteredStudents, subject.kktp, globalAttendance, selectedMonth, gradeData, tps, selectedSubject]);

  const handleExportExcel = async () => {
    if (reportData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(mode === 'GRADES' ? 'Rekap Nilai' : 'Rekap Presensi');
    const monthName = MONTH_NAMES[parseInt(selectedMonth)];
    
    const subjectName = availableSubjects.find(s => s.id === selectedSubject)?.name || 'Mata Pelajaran';

    // Header Construction
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = identity.schoolName;
    sheet.getCell('A1').font = { size: 14, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `REKAPITULASI ${mode === 'GRADES' ? 'NILAI AKHIR' : 'KEHADIRAN SISWA'}`;
    sheet.getCell('A2').font = { size: 12, bold: true };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([`Kelas: ${selectedClass}`, '', '', '', `Mapel: ${subjectName}`]);
    sheet.addRow([`Tahun Ajaran: ${identity.academicYear}`, '', '', '', `Semester: ${identity.semester}`]);
    if (mode === 'ATTENDANCE') {
        sheet.addRow([`Bulan Laporan: ${monthName}`, '', '', '', '']);
    }
    sheet.addRow([]);

    let headerRowIndex = 0;

    if (mode === 'GRADES') {
        const headerRow = sheet.addRow(['No', 'NIS', 'Nama Siswa', 'Rata-rata Formatif (40%)', 'Rata-rata Sumatif (50%)', 'Nilai Sikap (10%)', 'Nilai Akhir', 'Status', 'Keterangan']);
        headerRowIndex = headerRow.number;
    } else {
        const row1 = sheet.addRow(['No', 'NIS', 'Nama Siswa', `Rincian Bulan ${monthName}`, '', '', '', 'Total Akumulasi', '']);
        const row2 = sheet.addRow(['', '', '', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alfa (A)', 'Total Tatap Muka', 'Persentase (%)']);
        headerRowIndex = row1.number;
        sheet.mergeCells(`A${headerRowIndex}:A${headerRowIndex+1}`);
        sheet.mergeCells(`B${headerRowIndex}:B${headerRowIndex+1}`);
        sheet.mergeCells(`C${headerRowIndex}:C${headerRowIndex+1}`);
        sheet.mergeCells(`D${headerRowIndex}:G${headerRowIndex}`);
        sheet.mergeCells(`H${headerRowIndex}:I${headerRowIndex}`);
    }

    const headerRow = sheet.getRow(headerRowIndex);
    const subHeaderRow = mode === 'ATTENDANCE' ? sheet.getRow(headerRowIndex + 1) : null;
    
    [headerRow, subHeaderRow].forEach(row => {
        if(!row) return;
        row.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
    });

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
        row.eachCell((cell, colNumber) => {
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            if (colNumber === 1 || colNumber > 3) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        if (mode === 'GRADES') {
            const statusCell = row.getCell(8);
            statusCell.font = { bold: true, color: { argb: d.grades.isPassed ? 'FF008000' : 'FFFF0000' } };
        }
        if (mode === 'ATTENDANCE') {
            const percentCell = row.getCell(9);
             if (d.attendance.total.percentage < 50) {
                 percentCell.font = { color: { argb: 'FFFF0000' }, bold: true };
             }
        }
    });

    sheet.columns.forEach((col, index) => {
        if (index === 2) col.width = 35;
        else col.width = 15;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Rekap_${mode}_${selectedClass}_${monthName}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    // SWAL ALERT ADDED HERE
    Swal.fire({
        title: 'Export Berhasil!',
        text: 'File Excel telah berhasil diunduh.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
  };

  return {
      state: { selectedClass, selectedSubject, selectedMonth, monthNames: MONTH_NAMES, availableSubjects },
      setters: { setSelectedClass, setSelectedSubject, setSelectedMonth },
      computed: { availableClasses, filteredStudents, reportData },
      handlers: { handleExportExcel }
  };
};
