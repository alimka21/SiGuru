
import React from 'react';
import { Student, Subject, IdentityData, AttendanceData, GradeData, LearningObjective } from '../types';
import { useRecapLogic } from '../hooks/useRecapLogic';

interface Props {
  students: Student[];
  subject: Subject;
  identity: IdentityData;
  mode: 'GRADES' | 'ATTENDANCE'; 
  globalAttendance: AttendanceData;
  gradeData: GradeData;
  tps: LearningObjective[];
}

export const RecapManager: React.FC<Props> = (props) => {
  const { 
    state, 
    setters, 
    computed, 
    handlers 
  } = useRecapLogic(props);

  const { selectedClass, selectedSubject, selectedMonth, monthNames, availableSubjects, weights } = state;
  const { availableClasses, reportData, ledgerData, isClassTeacher, daysInMonth } = computed;

  // Logic to lock subject if Subject Teacher
  const isSubjectLocked = props.identity.role === 'SUBJECT_TEACHER';

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500">
        <a className="hover:text-primary cursor-pointer">Dashboard</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-slate-900 font-bold">Rekapitulasi {props.mode === 'GRADES' ? 'Nilai' : 'Presensi'}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">
              {props.mode === 'GRADES' ? (isClassTeacher ? 'Leger Nilai Kelas' : 'Rekap Nilai Siswa') : 'Rekap Kehadiran Siswa'}
          </h2>
          <p className="text-slate-500">
              {props.mode === 'GRADES' 
                ? (isClassTeacher ? 'Rekapitulasi nilai akhir seluruh mata pelajaran (Leger).' : 'Laporan nilai akhir semester mapel Anda.') 
                : 'Pantau progres kehadiran bulanan dan akumulasi total.'}
          </p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={handlers.handleExportExcel}
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
             {/* Class Selector */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Kelas <span className="text-red-500">*</span></label>
                <select 
                    value={selectedClass} 
                    onChange={(e) => setters.setSelectedClass(e.target.value)}
                    className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary"
                >
                    <option value="">-- Pilih Kelas --</option>
                    {availableClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
             </div>

             {/* Subject Selector - Only for Subject Teacher OR Class Teacher wanting detail */}
             {props.mode === 'GRADES' && !isClassTeacher && (
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                    <select 
                        value={selectedSubject} 
                        onChange={(e) => setters.setSelectedSubject(e.target.value)}
                        disabled={isSubjectLocked}
                        className={`w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary
                            ${isSubjectLocked ? 'bg-slate-100 cursor-not-allowed opacity-80' : 'bg-white cursor-pointer'}
                        `}
                    >
                        {availableSubjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                 </div>
             )}

             {/* Month Filter (Only for Attendance) */}
             {props.mode === 'ATTENDANCE' && (
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Bulan Laporan</label>
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setters.setSelectedMonth(e.target.value)}
                        className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary"
                    >
                        {monthNames.map((m, i) => (
                            <option key={m} value={i}>{m}</option>
                        ))}
                    </select>
                 </div>
             )}

             {/* WEIGHT SETTINGS (Only Grades) */}
             {props.mode === 'GRADES' && (
                 <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-600 uppercase">Bobot Formatif (%)</label>
                        <input 
                            type="number" min="0" max="100"
                            value={weights.formative}
                            onChange={(e) => setters.setWeights({ formative: Number(e.target.value), summative: 100 - Number(e.target.value) })}
                            className="w-full rounded-md border-slate-200 text-sm font-bold text-slate-900 py-1.5 focus:ring-primary h-9"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-purple-600 uppercase">Bobot Sumatif (%)</label>
                        <input 
                            type="number" min="0" max="100"
                            value={weights.summative}
                            readOnly // Auto-calculated
                            className="w-full rounded-md border-slate-200 text-sm font-bold text-slate-500 bg-slate-100 py-1.5 h-9"
                        />
                     </div>
                 </div>
             )}
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
                            <th rowSpan={2} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase border-r border-slate-200 min-w-[200px] sticky left-0 bg-slate-50 z-10">Identitas Siswa</th>
                            
                            {props.mode === 'GRADES' ? (
                                isClassTeacher ? (
                                    // LEGER HEADER (Point 5)
                                    availableSubjects.map((subjectName) => (
                                        <th key={subjectName} className="px-4 py-4 text-xs font-bold text-slate-700 uppercase text-center border-r border-slate-200 min-w-[120px] whitespace-normal bg-white">
                                            {subjectName}
                                        </th>
                                    ))
                                ) : (
                                    // STANDARD SUBJECT HEADER
                                    <>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Formatif ({weights.formative}%)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Sumatif ({weights.summative}%)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center bg-blue-50/50 text-blue-700">Nilai Akhir</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                                    </>
                                )
                            ) : (
                                // ATTENDANCE HEADER LOGIC
                                isClassTeacher ? (
                                    <>
                                        {daysInMonth.map(day => (
                                            <th key={day} className="px-1 py-4 text-[10px] font-bold text-slate-500 text-center border-r border-slate-100 min-w-[28px]">
                                                {day}
                                            </th>
                                        ))}
                                        <th className="px-4 py-4 text-xs font-bold text-slate-700 text-center bg-slate-50 border-l border-slate-200">
                                            S / I / A
                                        </th>
                                        <th className="px-4 py-4 text-xs font-bold text-blue-700 text-center bg-blue-50">
                                            %
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        <th colSpan={4} className="px-6 py-3 text-xs font-extrabold text-slate-700 uppercase text-center bg-slate-100 border-r border-slate-200 border-b">
                                            Rincian Bulan {monthNames[parseInt(selectedMonth)]}
                                        </th>
                                        <th colSpan={2} className="px-6 py-3 text-xs font-extrabold text-blue-700 uppercase text-center bg-blue-50 border-b">
                                            Total Akumulasi
                                        </th>
                                    </>
                                )
                            )}
                        </tr>
                        {props.mode === 'ATTENDANCE' && !isClassTeacher && (
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
                        {/* RENDER LOGIC SWITCH */}
                        {(props.mode === 'GRADES' && isClassTeacher ? ledgerData : reportData).map((d: any, i) => (
                            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-center text-sm text-slate-500 border-r border-slate-100">{i + 1}</td>
                                <td className="px-6 py-4 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    <p className="font-bold text-slate-800 text-sm">{d.name}</p>
                                    <p className="text-[10px] text-slate-400">NIS: {d.nis}</p>
                                </td>

                                {props.mode === 'GRADES' ? (
                                    isClassTeacher ? (
                                        // LEGER CELLS
                                        availableSubjects.map(subName => {
                                            const score = d.subjectGrades[subName] || 0;
                                            return (
                                                <td key={subName} className="px-4 py-4 text-center border-r border-slate-100">
                                                    <span className={`text-sm font-bold ${score < 75 ? 'text-red-500' : 'text-slate-800'}`}>
                                                        {score || '-'}
                                                    </span>
                                                </td>
                                            );
                                        })
                                    ) : (
                                        // STANDARD CELLS
                                        <>
                                            <td className="px-6 py-4 text-center text-sm text-slate-600">{d.grades.formative}</td>
                                            <td className="px-6 py-4 text-center text-sm text-slate-600">{d.grades.summative}</td>
                                            <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30 text-base">{d.grades.finalScore}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${d.grades.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {d.grades.isPassed ? 'Tuntas' : 'Remedial'}
                                                </span>
                                            </td>
                                        </>
                                    )
                                ) : (
                                    // ATTENDANCE CELLS
                                    isClassTeacher ? (
                                        <>
                                            {daysInMonth.map(day => {
                                                const status = d.attendance.daily[day];
                                                let colorClass = 'text-slate-200';
                                                if(status === 'H') colorClass = 'text-green-600 font-bold bg-green-50';
                                                if(status === 'S') colorClass = 'text-orange-600 font-bold bg-orange-50';
                                                if(status === 'I') colorClass = 'text-blue-600 font-bold bg-blue-50';
                                                if(status === 'A') colorClass = 'text-red-600 font-bold bg-red-50';
                                                
                                                return (
                                                    <td key={day} className={`px-1 py-3 text-center text-[10px] border-r border-slate-100 ${colorClass}`}>
                                                        {status || '-'}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-4 text-center text-xs font-mono bg-slate-50 border-l border-slate-200">
                                                <span className="text-orange-600">{d.attendance.monthly.sick}</span>/
                                                <span className="text-blue-600">{d.attendance.monthly.permit}</span>/
                                                <span className="text-red-600">{d.attendance.monthly.absent}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-xs bg-blue-50 text-blue-700">
                                                {d.attendance.monthly.percentage}%
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
                                    )
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
