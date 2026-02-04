
import React, { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { Student, Subject, IdentityData, AttendanceData, GradeData, LearningObjective } from '../types';
import { calculateStudentGrade } from '../utils/grading';

interface Props {
  students: Student[];
  subject: Subject;
  identity: IdentityData;
  mode: 'GRADES' | 'ATTENDANCE'; 
  globalAttendance: AttendanceData;
  // Added props for Real Grading
  gradeData: GradeData;
  tps: LearningObjective[];
}

const AVAILABLE_SUBJECTS = [
    { id: 's1', name: 'Matematika - Fase E' },
    { id: 's2', name: 'Fisika - Fase E' },
    { id: 's3', name: 'Kimia - Fase E' },
];

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const RecapManager: React.FC<Props> = ({ students, subject, identity, mode, globalAttendance, gradeData, tps }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(subject.id);
  
  // Default to current month
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());

  // Derive unique classes
  const availableClasses = useMemo(() => {
    const classes = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(classes).sort() as string[];
  }, [students]);

  // Filter students
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
                
                // Check if this record belongs to the student
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
        // Menggunakan fungsi utilitas yang sama dengan Dashboard dan GradingSheet
        const gradeResult = calculateStudentGrade(student.id, gradeData, tps, subject.kktp);
        
        // Ambil nilai sikap dari data raw
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

  // --- EXCEL EXPORT LOGIC ---
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

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500">
        <a className="hover:text-primary cursor-pointer">Dashboard</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-slate-900 font-bold">Rekapitulasi {mode === 'GRADES' ? 'Nilai' : 'Presensi'}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">
              {mode === 'GRADES' ? 'Rekap Nilai Siswa' : 'Rekap Kehadiran Siswa'}
          </h2>
          <p className="text-slate-500">
              {mode === 'GRADES' ? 'Laporan nilai akhir semester (Real-time).' : 'Pantau progres kehadiran bulanan dan akumulasi total.'}
          </p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={handleExportExcel}
                disabled={!selectedClass}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <span className="material-symbols-outlined">table_view</span>
                Export Excel
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-end">
         <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Subject Selector */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                <select 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary"
                >
                    {AVAILABLE_SUBJECTS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
             </div>
             
             {/* Class Selector */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Kelas <span className="text-red-500">*</span></label>
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary"
                >
                    <option value="">-- Pilih Kelas --</option>
                    {availableClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
             </div>

             {/* Month Filter (Only for Attendance) */}
             {mode === 'ATTENDANCE' && (
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Bulan Laporan</label>
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary"
                    >
                        {MONTH_NAMES.map((m, i) => (
                            <option key={m} value={i}>{m}</option>
                        ))}
                    </select>
                 </div>
             )}

             {/* Semester Filter (Visual Only) */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Semester</label>
                <select disabled className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-500 bg-slate-50 cursor-not-allowed">
                    <option>{identity.semester} {identity.academicYear}</option>
                </select>
             </div>
         </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
         {selectedClass ? (
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th rowSpan={2} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-16 text-center border-r border-slate-200">No</th>
                            <th rowSpan={2} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase border-r border-slate-200 min-w-[200px]">Identitas Siswa</th>
                            
                            {mode === 'GRADES' ? (
                                <>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Formatif (40%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Sumatif (50%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Sikap (10%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center bg-blue-50/50 text-blue-700">Nilai Akhir</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                                </>
                            ) : (
                                <>
                                    <th colSpan={4} className="px-6 py-3 text-xs font-extrabold text-slate-700 uppercase text-center bg-slate-100 border-r border-slate-200 border-b">
                                        Rincian Bulan {MONTH_NAMES[parseInt(selectedMonth)]}
                                    </th>
                                    <th colSpan={2} className="px-6 py-3 text-xs font-extrabold text-blue-700 uppercase text-center bg-blue-50 border-b">
                                        Total Akumulasi
                                    </th>
                                </>
                            )}
                        </tr>
                        {mode === 'ATTENDANCE' && (
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-2 text-[10px] font-bold text-green-600 uppercase text-center border-r border-slate-200">Hadir</th>
                                <th className="px-4 py-2 text-[10px] font-bold text-blue-600 uppercase text-center border-r border-slate-200">Izin</th>
                                <th className="px-4 py-2 text-[10px] font-bold text-orange-600 uppercase text-center border-r border-slate-200">Sakit</th>
                                <th className="px-4 py-2 text-[10px] font-bold text-red-600 uppercase text-center border-r border-slate-200">Alfa</th>
                                <th className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase text-center bg-blue-50/30 border-r border-blue-100">Total Pertemuan</th>
                                <th className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase text-center bg-blue-50/30">Persentase</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData.map((d, i) => (
                            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-center text-sm text-slate-500 border-r border-slate-100">{i + 1}</td>
                                <td className="px-6 py-4 border-r border-slate-100">
                                    <p className="font-bold text-slate-800 text-sm">{d.name}</p>
                                    <p className="text-[10px] text-slate-400">NIS: {d.nis}</p>
                                </td>

                                {mode === 'GRADES' ? (
                                    <>
                                        <td className="px-6 py-4 text-center text-sm text-slate-600">{d.grades.formative}</td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-600">{d.grades.summative}</td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-600">{d.grades.attitude}</td>
                                        <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30 text-base">{d.grades.finalScore}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${d.grades.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {d.grades.isPassed ? 'Tuntas' : 'Remedial'}
                                            </span>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-4 text-center text-sm font-bold text-green-600 bg-slate-50/30 border-r border-slate-100">{d.attendance.monthly.present}</td>
                                        <td className="px-4 py-4 text-center text-sm font-bold text-blue-600 bg-slate-50/30 border-r border-slate-100">{d.attendance.monthly.permit}</td>
                                        <td className="px-4 py-4 text-center text-sm font-bold text-orange-600 bg-slate-50/30 border-r border-slate-100">{d.attendance.monthly.sick}</td>
                                        <td className="px-4 py-4 text-center text-sm font-bold text-red-600 bg-slate-50/30 border-r border-slate-100">{d.attendance.monthly.absent}</td>
                                        
                                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-700 bg-blue-50/20 border-r border-blue-50">{d.attendance.total.meetings}</td>
                                        <td className="px-4 py-4 text-center bg-blue-50/20">
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${d.attendance.total.percentage >= 80 ? 'bg-green-500' : d.attendance.total.percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{width: `${d.attendance.total.percentage}%`}}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{d.attendance.total.percentage}%</span>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
         ) : (
             <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-3 text-slate-300">filter_alt_off</span>
                <p className="font-bold text-slate-600">Pilih Kelas Terlebih Dahulu</p>
                <p className="text-sm">Silahkan gunakan filter di atas untuk menampilkan data rekap.</p>
             </div>
         )}
      </div>
    </div>
  );
};
