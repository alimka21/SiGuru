
import React, { useMemo } from 'react';
import { Student, LearningObjective, GradeData, Subject, IdentityData } from '../types';
import { calculateStudentGrade } from '../utils/grading';
import { useGradingLogic } from '../hooks/useGradingLogic';

interface Props {
  students: Student[];
  tps: LearningObjective[];
  subject: Subject;
  initialClass?: string;
  globalGradeData: GradeData;
  setGlobalGradeData: React.Dispatch<React.SetStateAction<GradeData>>;
  // Identity diperlukan untuk menentukan opsi mata pelajaran (SD vs SMP/SMA)
  identity?: IdentityData; 
}

// Daftar Mapel SD (Guru Kelas)
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

// Daftar Mapel SMP/SMA (Guru Mapel)
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
];

export const GradingSheet: React.FC<Props> = (props) => {
  // Default Identity Fallback
  const safeIdentity = props.identity || { role: 'SUBJECT_TEACHER', level: 'SMA', schoolName: '', teacherName: '', nip: '', subjectName: '', semester: '', academicYear: '', className: '', studentCount: 0 };

  const { 
    state, 
    setters, 
    computed, 
    handlers 
  } = useGradingLogic({ ...props, identity: safeIdentity });

  const { selectedClass, selectedSubject, activeTab } = state;
  const { availableClasses, filteredStudents, uniqueScopes, tpsByScope, stats, filteredTPs } = computed;

  // Determine Subject Options based on Level/Role
  const subjectOptions = useMemo(() => {
      if (safeIdentity.level === 'SD' || safeIdentity.role === 'CLASS_TEACHER') {
          return SD_SUBJECTS;
      }
      return SECONDARY_SUBJECTS;
  }, [safeIdentity.level, safeIdentity.role]);

  return (
    <div className="max-w-[1600px] mx-auto pb-10 relative">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-4">
          {/* Breadcrumbs */}
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
                    ? 'Ceklis observasi ketercapaian tujuan pembelajaran (Proses).'
                    : 'Input nilai angka per lingkup materi (Hasil).'
                  }
              </p>
            </div>
            
            {/* Class & Subject Selector Toolbar */}
            <div className={`flex flex-wrap gap-3 p-2 rounded-xl border shadow-sm transition-colors duration-300 ${activeTab === 'FORMATIVE' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
                 {/* Class Selector */}
                 <div className="relative min-w-[200px]">
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

                {/* Subject Selector */}
                <div className="relative min-w-[220px]">
                    <select 
                        value={selectedSubject} 
                        onChange={(e) => setters.setSelectedSubject(e.target.value)}
                        className="w-full appearance-none pl-10 pr-8 py-2.5 border-transparent rounded-lg text-sm font-bold text-slate-900 bg-white hover:bg-white/80 focus:ring-2 focus:ring-primary transition-all cursor-pointer shadow-sm"
                    >
                        {subjectOptions.map(subj => (
                            <option key={subj.id} value={subj.id}>{subj.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">book</span>
                    <span className="material-symbols-outlined absolute right-2 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
            </div>
          </div>
      </div>

      {/* Tabs Switcher - ALWAYS VISIBLE */}
      <div className="flex gap-2 mb-0 border-b border-slate-200">
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

      {/* Main Table Area */}
      {selectedClass ? (
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl rounded-tr-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
            
            {/* ======================= FORMATIVE TAB ======================= */}
            {activeTab === 'FORMATIVE' && (
                <div className="flex-1 overflow-x-auto custom-scrollbar bg-white animate-in fade-in slide-in-from-left-4 duration-300">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <th rowSpan={3} className="sticky-col bg-slate-50 w-12 px-2 py-3 text-xs font-bold text-center border-r border-slate-200 z-30">No</th>
                                <th rowSpan={3} className="sticky-col-2 bg-slate-50 w-64 px-4 py-3 text-xs font-bold border-r border-slate-200 z-30 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                    <div className="flex flex-col gap-1">
                                        <span>Nama Siswa</span>
                                    </div>
                                </th>
                                
                                {/* 1. Scope Header (Top Level) */}
                                {Object.entries(tpsByScope).map(([scope, scopeTps]) => {
                                    const totalCriteria = scopeTps.reduce((acc, tp) => acc + tp.criteria.length, 0);
                                    if(totalCriteria === 0) return null;

                                    return (
                                        <th key={scope} colSpan={totalCriteria} className="px-4 py-2 text-center text-xs font-extrabold text-blue-700 bg-blue-50/50 border-r border-slate-200 border-b uppercase tracking-wider">
                                            {scope}
                                        </th>
                                    );
                                })}
                            </tr>
                            
                            {/* 2. TP Header (Mid Level) */}
                            <tr className="bg-slate-50 border-b border-slate-200">
                                {Object.values(tpsByScope).map(scopeTps => (
                                    scopeTps.map(tp => (
                                        tp.criteria.length > 0 && (
                                            <th key={tp.id} colSpan={tp.criteria.length} className="px-3 py-2 text-left text-[10px] font-bold text-slate-600 border-r border-slate-200 align-top bg-white min-w-[150px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] text-blue-500 font-mono bg-blue-50 w-fit px-1 rounded">{tp.code}</span>
                                                    <span className="line-clamp-2 leading-tight" title={tp.description}>{tp.description}</span>
                                                </div>
                                            </th>
                                        )
                                    ))
                                ))}
                            </tr>

                            {/* 3. Criteria Header (Bottom Level) */}
                            <tr className="bg-slate-50 border-b border-slate-200">
                                {Object.values(tpsByScope).map(scopeTps => (
                                    scopeTps.map(tp => (
                                        tp.criteria.map((cr, idx) => (
                                            <th key={cr.id} className="px-1 py-2 text-center w-16 border-r border-slate-200 bg-slate-50/30">
                                                <div className="flex flex-col items-center group relative cursor-help">
                                                    <span className="text-[10px] font-bold text-slate-500">K.{idx + 1}</span>
                                                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-50 text-left">
                                                        {cr.description}
                                                    </div>
                                                </div>
                                            </th>
                                        ))
                                    ))
                                ))}
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
                                    
                                    {Object.values(tpsByScope).map(scopeTps => (
                                        scopeTps.map(tp => (
                                            tp.criteria.map(cr => {
                                                const isChecked = props.globalGradeData[student.id]?.formative?.[cr.id] || false;
                                                return (
                                                    <td key={cr.id} className="p-0 border-r border-slate-100 text-center relative">
                                                        <label className="flex items-center justify-center w-full h-full min-h-[44px] cursor-pointer hover:bg-blue-100/50 transition-colors">
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden peer"
                                                                checked={isChecked}
                                                                onChange={(e) => handlers.handleFormativeCheck(student.id, cr.id, e.target.checked)}
                                                            />
                                                            <div className={`
                                                                size-5 rounded border flex items-center justify-center transition-all duration-200
                                                                ${isChecked 
                                                                    ? 'bg-blue-500 border-blue-500 text-white scale-110 shadow-sm' 
                                                                    : 'bg-white border-slate-300 text-transparent'
                                                                }
                                                            `}>
                                                                <span className="material-symbols-outlined text-sm font-bold">check</span>
                                                            </div>
                                                        </label>
                                                    </td>
                                                );
                                            })
                                        ))
                                    ))}
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
                                
                                {/* Dynamic Scope Columns */}
                                {uniqueScopes.length > 0 ? uniqueScopes.map(scope => (
                                    <th key={scope} className="w-40 px-4 py-3 text-xs font-bold text-slate-700 text-center border-r border-slate-200 uppercase bg-purple-50/30">
                                        <div className="line-clamp-2" title={scope}>{scope}</div>
                                    </th>
                                )) : (
                                    <th className="w-64 px-4 py-3 text-xs font-bold text-red-400 text-center border-r border-slate-200 italic">
                                        Belum ada TP / Lingkup Materi
                                    </th>
                                )}
                                
                                {/* Fixed Columns */}
                                <th className="w-32 px-4 py-3 text-xs font-black text-purple-700 text-center border-r border-slate-200 bg-purple-50">
                                    Nilai Akhir
                                </th>
                                <th className="w-40 px-4 py-3 text-xs font-bold text-slate-600 text-center">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student, index) => {
                                // Calculate grade using Filtered TPs (matching the selected subject)
                                const result = calculateStudentGrade(student.id, props.globalGradeData, filteredTPs, props.subject.kktp);
                                return (
                                    <tr key={student.id} className="group hover:bg-purple-50/20 transition-colors">
                                        <td className="sticky-col bg-white group-hover:bg-[#faf8fe] text-center text-xs text-slate-500 border-r border-slate-100 font-medium">{index + 1}</td>
                                        <td className="sticky-col-2 bg-white group-hover:bg-[#faf8fe] px-4 py-3 border-r border-slate-100 z-20 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                                            <p className="font-bold text-sm text-slate-800 truncate">{student.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{student.nis}</p>
                                        </td>
                                        
                                        {/* Score Inputs by Scope */}
                                        {uniqueScopes.length > 0 ? uniqueScopes.map(scope => {
                                            const score = props.globalGradeData[student.id]?.summative?.[scope] ?? '';
                                            return (
                                                <td key={scope} className="p-0 border-r border-slate-100 relative">
                                                    <div className="relative w-full h-full">
                                                        <input 
                                                            type="number" 
                                                            min="0" max="100"
                                                            className="w-full h-12 border-none bg-transparent text-center text-sm font-bold focus:ring-0 focus:bg-purple-100 focus:text-purple-700 text-slate-800 placeholder-slate-200 transition-colors"
                                                            value={score}
                                                            onChange={(e) => handlers.handleSummativeScore(student.id, scope, e.target.value)}
                                                            placeholder="0"
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                        {score === '' && (
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100">
                                                                <span className="material-symbols-outlined text-slate-200 text-lg">edit</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        }) : (
                                            <td className="bg-slate-50"></td>
                                        )}

                                        {/* Final Result */}
                                        <td className="px-4 text-center bg-purple-50 border-r border-slate-200">
                                            <span className={`text-lg font-black ${result.finalScore >= props.subject.kktp ? 'text-green-600' : 'text-red-500'}`}>
                                                {result.finalScore || '-'}
                                            </span>
                                        </td>

                                        {/* Status Column (Restored) */}
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

            {/* Footer Stats & Info */}
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
                                        (filteredStudents.reduce((acc, s) => acc + calculateStudentGrade(s.id, props.globalGradeData, filteredTPs, props.subject.kktp).finalScore, 0) / filteredStudents.length).toFixed(1) 
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
                    <span>Nilai Akhir adalah rata-rata dari seluruh lingkup materi.</span>
                </div>
            </div>
        </div>
      ) : (
        // Empty State (Updated with Tab Context)
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
      
      {/* System Status Footer */}
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
