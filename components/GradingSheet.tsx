
import React, { useMemo } from 'react';
import { Student, LearningObjective, GradeData, Subject, IdentityData, SUBJECTS_DATA } from '../types';
import { calculateStudentGrade, getQualitativeLabel } from '../utils/grading';
import { useGradingLogic } from '../hooks/useGradingLogic';

declare const Swal: any;

interface Props {
  students: Student[];
  tps: LearningObjective[];
  subject: Subject;
  initialClass?: string;
  globalGradeData: GradeData;
  setGlobalGradeData: React.Dispatch<React.SetStateAction<GradeData>>;
  identity?: IdentityData; 
}

export const GradingSheet: React.FC<Props> = (props) => {
  const safeIdentity = props.identity || { role: 'SUBJECT_TEACHER', level: 'SMA', schoolName: '', teacherName: '', nip: '', subjectName: '', semester: '', academicYear: '', className: '', studentCount: 0 };

  const { 
    state, 
    setters, 
    computed, 
    handlers 
  } = useGradingLogic({ ...props, identity: safeIdentity });

  const { selectedClass, selectedSubject, selectedSemester, activeTab, currentKktp } = state;
  const { availableClasses, filteredStudents, uniqueScopes, tpsByScope, stats, filteredTPs } = computed;

  // Determine Subject Options
  const subjectOptions = useMemo(() => {
      if (safeIdentity.level === 'SD') {
          return safeIdentity.role === 'CLASS_TEACHER' ? SUBJECTS_DATA.SD.CLASS_TEACHER : SUBJECTS_DATA.SD.SUBJECT_TEACHER;
      } else if (safeIdentity.level === 'SMP') {
          return SUBJECTS_DATA.SMP;
      } else {
          return SUBJECTS_DATA.SMA_SMK;
      }
  }, [safeIdentity.level, safeIdentity.role]);

  // Lock Subject Dropdown if Subject Teacher
  const isSubjectLocked = safeIdentity.role === 'SUBJECT_TEACHER';

  // Check History Mode (Editing past semester)
  const currentSystemSemester = safeIdentity.semester === 'Genap' || safeIdentity.semester === '2' ? '2' : '1';
  const isHistoryMode = selectedSemester !== currentSystemSemester;

  const handleScoreInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (isHistoryMode) {
          Swal.fire({
              title: 'Peringatan Semester',
              text: `Anda sedang mengubah nilai Semester ${selectedSemester}, padahal sistem aktif di Semester ${currentSystemSemester}. Lanjutkan?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Ubah',
              cancelButtonText: 'Batal'
          }).then((result: any) => {
              if (!result.isConfirmed) {
                  e.target.blur();
              }
          });
      }
      e.target.select();
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10 relative">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="material-symbols-outlined text-sm">home</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span>Akademik</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className={`font-bold ${activeTab === 'FORMATIVE' ? 'text-blue-600' : 'text-purple-600'}`}>
                Asesmen / Nilai
            </span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className={`material-symbols-outlined text-3xl ${activeTab === 'FORMATIVE' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {activeTab === 'FORMATIVE' ? 'checklist' : 'equalizer'}
                  </span>
                  {activeTab === 'FORMATIVE' ? 'Asesmen Formatif' : 'Asesmen Sumatif'}
              </h1>
              <p className="text-slate-500 mt-1">
                  {activeTab === 'FORMATIVE' 
                    ? 'Penilaian tujuan pembelajaran (TP) berdasarkan kriteria yang ditetapkan.'
                    : 'Input nilai angka per lingkup materi (Hasil).'
                  }
              </p>
            </div>
            
            <div className={`flex flex-wrap gap-3 p-2 rounded-xl border shadow-sm transition-colors duration-300 ${activeTab === 'FORMATIVE' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
                 {/* PARAMETER KKTP */}
                 <div className="relative min-w-[100px] flex items-center bg-white rounded-lg border border-transparent shadow-sm px-3 gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">KKTP:</span>
                    <input 
                        type="number"
                        min="0" max="100"
                        value={currentKktp}
                        onChange={(e) => setters.setCurrentKktp(Number(e.target.value))}
                        className="w-14 text-sm font-bold text-slate-900 border-none focus:ring-0 p-0 text-right"
                    />
                 </div>

                 {/* Semester Selector (NEW) */}
                 <div className="relative min-w-[140px]">
                    <select 
                        value={selectedSemester} 
                        onChange={(e) => setters.setSelectedSemester(e.target.value)}
                        className={`w-full appearance-none pl-9 pr-8 py-2.5 border-transparent rounded-lg text-sm font-bold shadow-sm cursor-pointer
                            ${isHistoryMode ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-300' : 'bg-white text-slate-900 hover:bg-white/80'}
                        `}
                    >
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                    </select>
                    <span className={`material-symbols-outlined absolute left-3 top-2.5 text-lg pointer-events-none ${isHistoryMode ? 'text-orange-600' : 'text-slate-500'}`}>
                        date_range
                    </span>
                    <span className="material-symbols-outlined absolute right-2 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>

                 {/* Class Selector */}
                 <div className="relative min-w-[180px]">
                    <select 
                        value={selectedClass} 
                        onChange={(e) => setters.setSelectedClass(e.target.value)}
                        className="w-full appearance-none pl-10 pr-8 py-2.5 border-transparent rounded-lg text-sm font-bold text-slate-900 bg-white hover:bg-white/80 focus:ring-2 focus:ring-primary transition-all cursor-pointer shadow-sm"
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">school</span>
                    <span className="material-symbols-outlined absolute right-2 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>

                {/* Subject Selector (Locked if Subject Teacher) */}
                <div className="relative min-w-[200px]">
                    <select 
                        value={selectedSubject} 
                        onChange={(e) => setters.setSelectedSubject(e.target.value)}
                        disabled={isSubjectLocked}
                        className={`w-full appearance-none pl-10 pr-8 py-2.5 border-transparent rounded-lg text-sm font-bold text-slate-900 bg-white shadow-sm transition-all
                            ${isSubjectLocked ? 'opacity-80 cursor-not-allowed bg-slate-100' : 'hover:bg-white/80 cursor-pointer focus:ring-2 focus:ring-primary'}
                        `}
                    >
                        {subjectOptions.map(subj => (
                            <option key={subj} value={subj}>{subj}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">book</span>
                    {!isSubjectLocked && <span className="material-symbols-outlined absolute right-2 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>}
                    {isSubjectLocked && <span className="material-symbols-outlined absolute right-2 top-3 text-slate-400 pointer-events-none text-sm">lock</span>}
                </div>
            </div>
          </div>
      </div>

      {/* Warning Banner for History Mode */}
      {isHistoryMode && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl mb-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined">history</span>
              <p className="text-sm font-medium">
                  <strong>Mode Arsip:</strong> Anda sedang melihat data Semester {selectedSemester}. Sistem saat ini berjalan di Semester {currentSystemSemester}.
              </p>
          </div>
      )}

      {/* Tabs Switcher - ALWAYS VISIBLE */}
      <div className="flex gap-2 mb-0 border-b border-slate-200 justify-between items-center">
          <div className="flex gap-2">
            <button 
                onClick={() => setters.setActiveTab('SUMMATIVE')}
                className={`relative px-6 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x
                    ${activeTab === 'SUMMATIVE' 
                        ? 'bg-white text-purple-600 border-slate-200 border-b-white translate-y-[1px] shadow-[0_-2px_5px_rgba(0,0,0,0.02)]' 
                        : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                    }`}
            >
                <span className={`material-symbols-outlined ${activeTab === 'SUMMATIVE' ? 'filled' : ''}`}>equalizer</span>
                Nilai Sumatif
            </button>
            <button 
                onClick={() => setters.setActiveTab('FORMATIVE')}
                className={`relative px-6 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x
                    ${activeTab === 'FORMATIVE' 
                        ? 'bg-white text-blue-600 border-slate-200 border-b-white translate-y-[1px] shadow-[0_-2px_5px_rgba(0,0,0,0.02)]' 
                        : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                    }`}
            >
                <span className={`material-symbols-outlined ${activeTab === 'FORMATIVE' ? 'filled' : ''}`}>checklist</span>
                Ceklis Formatif
            </button>
          </div>

          {/* Global Legend (Fix 2: Only show on Formative) - RESIZED BIGGER */}
          {activeTab === 'FORMATIVE' && (
              <div className="flex gap-2 text-sm font-medium mr-4">
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100">0-40: Perlu</span>
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">41-65: Cukup</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">66-85: Baik</span>
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg border border-green-100">86+: S.Baik</span>
              </div>
          )}
      </div>

      {/* Main Table Area */}
      {selectedClass ? (
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl rounded-tr-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
            
            {/* ======================= FORMATIVE TAB ======================= */}
            {activeTab === 'FORMATIVE' && (
                <div className="flex-1 overflow-x-auto custom-scrollbar bg-white animate-in fade-in slide-in-from-left-4 duration-300">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <th className="sticky-col bg-slate-50 w-12 px-2 py-3 text-xs font-bold text-center border-r border-slate-200 z-30">No</th>
                                <th className="sticky-col-2 bg-slate-50 w-64 px-4 py-3 text-xs font-bold border-r border-slate-200 z-30 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                    <div className="flex flex-col gap-1">
                                        <span>Nama Siswa</span>
                                    </div>
                                </th>
                                
                                {/* Fix 1 & 2: Iterate directly through filtered TPs, no Scope row */}
                                {filteredTPs.map(tp => (
                                    <th key={tp.id} className="w-40 px-2 py-3 border-r border-slate-200 text-center bg-blue-50/20 group relative cursor-help align-middle">
                                        {/* Fix 4: Show only Code */}
                                        <div className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 shadow-sm">
                                            {tp.code}
                                        </div>

                                        {/* Fix 4: Rich Tooltip on Hover */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-72 bg-slate-800 text-white p-4 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left pointer-events-none mt-2">
                                            <div className="mb-2 border-b border-slate-600 pb-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tujuan Pembelajaran:</p>
                                                <p className="text-xs font-bold leading-snug">{tp.description}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kriteria (KKTP):</p>
                                                <ul className="space-y-1.5">
                                                    {tp.criteria.map(cr => (
                                                        <li key={cr.id} className="text-[10px] leading-tight flex gap-2">
                                                            <span className="font-mono text-blue-300 shrink-0">{cr.code}:</span>
                                                            <span className="text-slate-300">{cr.description}</span>
                                                        </li>
                                                    ))}
                                                    {tp.criteria.length === 0 && <li className="text-[10px] italic text-slate-500">Belum ada kriteria</li>}
                                                </ul>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800"></div>
                                        </div>
                                    </th>
                                ))}
                                {filteredTPs.length === 0 && (
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 italic bg-slate-50">
                                        Tidak ada TP untuk semester {selectedSemester} di mapel ini.
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student, index) => (
                                <tr key={student.id} className="group hover:bg-blue-50/30 transition-colors">
                                    <td className="sticky-col bg-white group-hover:bg-[#f3f7fc] text-center text-xs text-slate-500 border-r border-slate-100 font-medium">{index + 1}</td>
                                    <td className="sticky-col-2 bg-white group-hover:bg-[#f3f7fc] px-4 py-3 border-r border-slate-100 z-20 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                        <p className="font-bold text-sm text-slate-800 truncate">{student.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{student.nis}</p>
                                    </td>
                                    
                                    {/* Score Cells per TP */}
                                    {filteredTPs.map(tp => {
                                        const score = props.globalGradeData[student.id]?.formative?.[tp.id] ?? '';
                                        const numericScore = typeof score === 'number' ? score : 0;
                                        const { label, color } = getQualitativeLabel(numericScore);
                                        const hasScore = score !== '';

                                        return (
                                            <td key={tp.id} className="p-3 border-r border-slate-100 align-middle">
                                                <div className="flex flex-col gap-2 items-center">
                                                    {/* Numeric Input */}
                                                    <input 
                                                        type="number"
                                                        min="0" max="100"
                                                        className="w-16 h-9 border border-slate-200 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 shadow-sm"
                                                        placeholder="0"
                                                        value={score}
                                                        onChange={(e) => handlers.handleFormativeScore(student.id, tp.id, e.target.value)}
                                                        onFocus={handleScoreInputFocus}
                                                    />
                                                    {/* Qualitative Label (Small) */}
                                                    {hasScore && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
                                                            {label}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    {filteredTPs.length === 0 && <td></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ======================= SUMMATIVE TAB ======================= */}
            {activeTab === 'SUMMATIVE' && (
                <div className="flex-1 overflow-x-auto custom-scrollbar bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="sticky-col bg-slate-50 w-12 px-2 py-3 text-xs font-bold text-center border-r border-slate-200 text-slate-600">No</th>
                                <th className="sticky-col-2 bg-slate-50 w-64 px-4 py-3 text-xs font-bold border-r border-slate-200 text-slate-600 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                    Identitas Siswa
                                </th>
                                
                                {/* New Column: Rerata Formatif */}
                                <th className="w-32 px-4 py-3 text-xs font-bold text-blue-700 text-center border-r border-slate-200 bg-blue-50">
                                    Rata-rata Formatif
                                </th>

                                {uniqueScopes.length > 0 ? uniqueScopes.map((scope, index) => {
                                    // Cari TP yang terkait dengan Scope ini
                                    const relatedTPs = tpsByScope[scope] || [];
                                    const shortCode = `LM ${index + 1}`; // Kode Singkat

                                    return (
                                        <th key={scope} className="w-32 px-4 py-3 text-center border-r border-slate-200 bg-purple-50/30 group relative cursor-help align-top">
                                            {/* Header Content (Short Code) */}
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs font-bold text-purple-700 bg-white px-2 py-1 rounded border border-purple-200 shadow-sm">{shortCode}</span>
                                                <span className="text-[10px] text-slate-500 font-mono mt-1">{relatedTPs.length} TP</span>
                                            </div>

                                            {/* Fix 5: Tooltip Visibility & Content */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-72 bg-slate-800 text-white p-4 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left pointer-events-none mt-2">
                                                <div className="mb-2 border-b border-slate-600 pb-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Lingkup Materi:</p>
                                                    <p className="text-sm font-bold leading-tight text-white">{scope}</p>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">TP Terkait:</p>
                                                <ul className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                                    {relatedTPs.map(tp => (
                                                        <li key={tp.id} className="text-[10px] leading-snug flex gap-2">
                                                            <span className="font-mono text-purple-300 shrink-0">{tp.code}:</span>
                                                            <span className="text-slate-300">{tp.description}</span>
                                                        </li>
                                                    ))}
                                                    {relatedTPs.length === 0 && <li className="text-[10px] italic text-slate-500">Tidak ada TP</li>}
                                                </ul>
                                                {/* Arrow */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800"></div>
                                            </div>
                                        </th>
                                    );
                                }) : (
                                    <th className="w-64 px-4 py-3 text-xs font-bold text-red-400 text-center border-r border-slate-200 italic">
                                        Belum ada TP / Lingkup Materi
                                    </th>
                                )}
                                
                                {/* New Column: Rerata Sumatif */}
                                <th className="w-32 px-4 py-3 text-xs font-bold text-purple-700 text-center border-r border-slate-200 bg-purple-50">
                                    Rata-rata Sumatif
                                </th>

                                <th className="w-32 px-4 py-3 text-xs font-black text-slate-800 text-center border-r border-slate-200 bg-slate-100">
                                    Nilai Akhir
                                </th>
                                <th className="w-40 px-4 py-3 text-xs font-bold text-slate-600 text-center">
                                    Status (KKTP {currentKktp})
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student, index) => {
                                const result = calculateStudentGrade(student.id, props.globalGradeData, filteredTPs, currentKktp);
                                return (
                                    <tr key={student.id} className="group hover:bg-purple-50/20 transition-colors">
                                        <td className="sticky-col bg-white group-hover:bg-[#faf8fe] text-center text-xs text-slate-500 border-r border-slate-100 font-medium">{index + 1}</td>
                                        <td className="sticky-col-2 bg-white group-hover:bg-[#faf8fe] px-4 py-3 border-r border-slate-100 z-20 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                            <p className="font-bold text-sm text-slate-800 truncate">{student.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{student.nis}</p>
                                        </td>
                                        
                                        {/* Display Avg Formative */}
                                        <td className="px-4 text-center border-r border-slate-100 bg-blue-50/20">
                                            <span className="text-sm font-bold text-blue-700">{result.avgFormative || 0}</span>
                                        </td>

                                        {uniqueScopes.length > 0 ? uniqueScopes.map(scope => {
                                            const score = props.globalGradeData[student.id]?.summative?.[scope] ?? '';
                                            return (
                                                <td key={scope} className="p-0 border-r border-slate-100 relative">
                                                    <div className="relative w-full h-full p-2">
                                                        <input 
                                                            type="number" 
                                                            min="0" max="100"
                                                            className="w-full h-10 border border-slate-200 rounded-lg bg-transparent text-center text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-800 placeholder-slate-200 transition-colors"
                                                            value={score}
                                                            onChange={(e) => handlers.handleSummativeScore(student.id, scope, e.target.value)}
                                                            placeholder="0"
                                                            onFocus={handleScoreInputFocus}
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        }) : (
                                            <td className="bg-slate-50"></td>
                                        )}

                                        {/* Display Avg Summative */}
                                        <td className="px-4 text-center border-r border-slate-100 bg-purple-50/20">
                                            <span className="text-sm font-bold text-purple-700">{result.avgSummative || 0}</span>
                                        </td>

                                        <td className="px-4 text-center bg-slate-100 border-r border-slate-200">
                                            <span className={`text-lg font-black ${result.finalScore >= currentKktp ? 'text-green-600' : 'text-red-500'}`}>
                                                {result.finalScore || '-'}
                                            </span>
                                        </td>

                                        <td className="px-4 text-center">
                                            {result.finalScore > 0 && (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                                    ${result.isPassed 
                                                        ? 'bg-green-100 text-green-700 border-green-200' 
                                                        : 'bg-red-100 text-red-700 border-red-200'
                                                    }
                                                `}>
                                                    <span className="material-symbols-outlined text-sm">{result.isPassed ? 'check_circle' : 'warning'}</span>
                                                    {result.isPassed ? 'Tuntas' : 'Remedial'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center text-xs font-medium text-slate-500 gap-4">
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">TOTAL</span>
                        <span className="text-slate-700 font-bold text-sm">{filteredStudents.length} Siswa</span>
                    </div>
                    {activeTab === 'SUMMATIVE' && (
                        <>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold">RATA-RATA</span>
                                <span className="text-purple-700 font-bold text-sm">
                                    {filteredStudents.length > 0 ? 
                                        (filteredStudents.reduce((acc, s) => acc + calculateStudentGrade(s.id, props.globalGradeData, filteredTPs, currentKktp).finalScore, 0) / filteredStudents.length).toFixed(1) 
                                        : '0'
                                    }
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">TUNTAS</span>
                                <span className="text-green-700 font-bold text-sm">{stats.tuntas}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">REMEDIAL</span>
                                <span className="text-red-700 font-bold text-sm">{stats.remedial}</span>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm">
                    <span className="material-symbols-outlined text-blue-500 text-sm">info</span>
                    <span>Nilai Akhir = (Rata-rata Formatif * 40%) + (Rata-rata Sumatif * 50%) + (Sikap * 10%)</span>
                </div>
            </div>
        </div>
      ) : (
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl rounded-tr-xl p-12 flex flex-col items-center justify-center text-slate-400 min-h-[400px] shadow-sm animate-in fade-in slide-in-from-bottom-4">
             <div className={`p-6 rounded-full mb-4 ring-8 ring-opacity-50 text-4xl ${activeTab === 'FORMATIVE' ? 'bg-blue-50 text-blue-400 ring-blue-50' : 'bg-purple-50 text-purple-400 ring-purple-50'}`}>
                <span className="material-symbols-outlined text-5xl">{activeTab === 'FORMATIVE' ? 'checklist' : 'equalizer'}</span>
             </div>
             <h3 className="text-xl font-bold text-slate-700 mb-2">
                 Mulai {activeTab === 'FORMATIVE' ? 'Ceklis Formatif' : 'Input Nilai Sumatif'}
             </h3>
             <p className="text-sm max-w-md text-center">
                 Silahkan pilih <strong className="text-primary">Kelas</strong> dan <strong className="text-primary">Mata Pelajaran</strong> pada toolbar di atas untuk menampilkan lembar {activeTab === 'FORMATIVE' ? 'observasi' : 'penilaian'}.
             </p>
        </div>
      )}
      
      <div className="mt-6 flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-400 font-bold">
        <div className="flex items-center gap-2">
            <div className="relative">
                <span className="size-2 rounded-full bg-green-500 absolute animate-ping opacity-75"></span>
                <span className="size-2 rounded-full bg-green-500 relative block"></span>
            </div>
            Auto-Save Active
        </div>
        <div>
          Last Sync: {state.currentTime.toLocaleTimeString('id-ID', {timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit'})} WITA
        </div>
      </div>
    </div>
  );
};
