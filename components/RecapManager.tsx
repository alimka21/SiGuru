
import React, { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { Student, Subject, IdentityData, AttendanceData } from '../types';

interface Props {
  students: Student[];
  subject: Subject;
  identity: IdentityData;
  mode: 'GRADES' | 'ATTENDANCE'; 
  globalAttendance: AttendanceData; // NEW PROP
}

const AVAILABLE_SUBJECTS = [
    { id: 's1', name: 'Matematika - Fase E' },
    { id: 's2', name: 'Fisika - Fase E' },
    { id: 's3', name: 'Kimia - Fase E' },
];

export const RecapManager: React.FC<Props> = ({ students, subject, identity, mode, globalAttendance }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(subject.id);

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
        // --- REAL ATTENDANCE CALCULATION ---
        // Iterate through all schedules and dates in globalAttendance to find records for this student
        let present = 0, permit = 0, sick = 0, absent = 0;
        let totalMeetings = 0;

        // Note: Ideally we filter by subject/class here. 
        // For simple demo, we iterate all schedules. In real app, filter schedules by SubjectID & ClassID first.
        
        Object.keys(globalAttendance).forEach(schId => {
            const datesObj = globalAttendance[schId];
            Object.keys(datesObj).forEach(date => {
                const record = datesObj[date][student.id];
                if (record) {
                    totalMeetings++;
                    if (record.status === 'H') present++;
                    else if (record.status === 'I') permit++;
                    else if (record.status === 'S') sick++;
                    else if (record.status === 'A') absent++;
                }
            });
        });

        const percentage = totalMeetings > 0 ? Math.round((present / totalMeetings) * 100) : 0;

        // --- MOCK GRADES (Still Mock as per previous step, focused on Attendance) ---
        const formative = Math.floor(Math.random() * (95 - 75) + 75);
        const summative = Math.floor(Math.random() * (90 - 70) + 70);
        const attitude = Math.floor(Math.random() * (100 - 80) + 80);
        const finalScore = Math.round((formative * 0.4) + (summative * 0.5) + (attitude * 0.1));
        const isPassed = finalScore >= subject.kktp;

        return {
            ...student,
            grades: { formative, summative, attitude, finalScore, isPassed },
            attendance: { present, permit, sick, absent, percentage, totalMeetings }
        };
    });
  }, [filteredStudents, subject.kktp, globalAttendance]);

  // --- EXCEL EXPORT LOGIC ---
  const handleExportExcel = async () => {
    if (reportData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(mode === 'GRADES' ? 'Rekap Nilai' : 'Rekap Presensi');

    // Add Header Info
    sheet.addRow([identity.schoolName]);
    sheet.addRow([`REKAPITULASI ${mode === 'GRADES' ? 'NILAI' : 'PRESENSI'} SISWA`]);
    sheet.addRow([`Kelas: ${selectedClass}`, `Mapel: ${AVAILABLE_SUBJECTS.find(s => s.id === selectedSubject)?.name || subject.name}`]);
    sheet.addRow([`Tahun Ajaran: ${identity.academicYear}`, `Semester: ${identity.semester}`]);
    sheet.addRow([]); // Spacer

    // Define Columns based on Tab
    if (mode === 'GRADES') {
        sheet.addRow(['No', 'NIS', 'Nama Siswa', 'Rata-rata Formatif', 'Rata-rata Sumatif', 'Nilai Sikap', 'Nilai Akhir', 'Status']);
        
        // Style Header Row
        const headerRow = sheet.getRow(6);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };

        reportData.forEach((d, i) => {
            const row = sheet.addRow([
                i + 1, d.nis, d.name, d.grades.formative, d.grades.summative, d.grades.attitude, d.grades.finalScore, d.grades.isPassed ? 'TUNTAS' : 'REMEDIAL'
            ]);
            // Conditional Formatting for Status
            const statusCell = row.getCell(8);
            statusCell.font = { color: { argb: d.grades.isPassed ? 'FF008000' : 'FFFF0000' }, bold: true };
        });
    } else {
        sheet.addRow(['No', 'NIS', 'Nama Siswa', 'Total Pertemuan', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alfa (A)', 'Persentase (%)']);
        
        // Style Header Row
        const headerRow = sheet.getRow(6);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };

        reportData.forEach((d, i) => {
            sheet.addRow([
                i + 1, d.nis, d.name, d.attendance.totalMeetings, d.attendance.present, d.attendance.permit, d.attendance.sick, d.attendance.absent, `${d.attendance.percentage}%`
            ]);
        });
    }

    // Auto fit columns (Simple approx)
    sheet.columns.forEach(column => {
        column.width = 15;
    });
    sheet.getColumn(3).width = 30; // Name column

    // Trigger Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Rekap_${mode}_${selectedClass}_${new Date().toISOString().slice(0,10)}.xlsx`;
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
              {mode === 'GRADES' ? 'Laporan nilai akhir semester.' : 'Laporan data kehadiran yang telah tersimpan (Klik Simpan di menu Presensi).'}
          </p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={handleExportExcel}
                disabled={!selectedClass}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <span className="material-symbols-outlined">table_view</span>
                Export Excel (.xlsx)
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-end">
         <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-16 text-center">No</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Identitas Siswa</th>
                            
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
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase text-center">Total Tatap Muka</th>
                                    <th className="px-6 py-4 text-xs font-bold text-green-600 uppercase text-center bg-green-50">Hadir</th>
                                    <th className="px-6 py-4 text-xs font-bold text-blue-600 uppercase text-center bg-blue-50">Izin</th>
                                    <th className="px-6 py-4 text-xs font-bold text-orange-600 uppercase text-center bg-orange-50">Sakit</th>
                                    <th className="px-6 py-4 text-xs font-bold text-red-600 uppercase text-center bg-red-50">Alfa</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase text-center">% Kehadiran</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData.map((d, i) => (
                            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-center text-sm text-slate-500">{i + 1}</td>
                                <td className="px-6 py-4">
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
                                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-500">{d.attendance.totalMeetings}</td>
                                        <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30">{d.attendance.present}</td>
                                        <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30">{d.attendance.permit}</td>
                                        <td className="px-6 py-4 text-center font-bold text-orange-600 bg-orange-50/30">{d.attendance.sick}</td>
                                        <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/30">{d.attendance.absent}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${d.attendance.percentage >= 80 ? 'bg-green-500' : d.attendance.percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{width: `${d.attendance.percentage}%`}}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{d.attendance.percentage}%</span>
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
