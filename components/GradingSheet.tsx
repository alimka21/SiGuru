
import React from 'react';
import { Student, LearningObjective, GradeData, Subject } from '../types';
import { calculateStudentGrade } from '../utils/grading';
import { useGradingLogic } from '../hooks/useGradingLogic';

interface Props {
  students: Student[];
  tps: LearningObjective[];
  subject: Subject;
  initialClass?: string;
  globalGradeData: GradeData;
  setGlobalGradeData: React.Dispatch<React.SetStateAction<GradeData>>;
}

// Mock Subjects for the Dropdown (Simulating multiple subjects)
const AVAILABLE_SUBJECTS = [
    { id: 's1', name: 'Matematika - Fase E' },
    { id: 's2', name: 'Fisika - Fase E' },
    { id: 's3', name: 'Kimia - Fase E' },
];

export const GradingSheet: React.FC<Props> = (props) => {
  const { 
    state, 
    setters, 
    computed, 
    handlers 
  } = useGradingLogic(props);

  const { errorMap, currentTime, showConfig, tempWeights, selectedClass, selectedSubject } = state;
  const { availableClasses, filteredStudents, stats } = computed;

  return (
    <div className="max-w-[1440px] mx-auto pb-8 relative">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500">
        <a className="hover:text-primary cursor-pointer">Dashboard</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <a className="hover:text-primary cursor-pointer">Input Nilai</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-slate-900 font-bold">{props.subject.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 text-3xl font-extrabold tracking-tight">Input Nilai Siswa</h1>
          <p className="text-slate-500">Pilih Kelas dan Mata Pelajaran untuk mulai mengisi nilai.</p>
        </div>
      </div>

      {/* Toolbar / Filter Section */}
      <div className="bg-white border border-slate-200 rounded-t-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm z-20 relative">
        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
             
             {/* Class Filter Dropdown */}
             <div className="relative w-full md:w-56">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Kelas</label>
                <div className="relative">
                    <select 
                        value={selectedClass} 
                        onChange={(e) => setters.setSelectedClass(e.target.value)}
                        className="w-full appearance-none pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer transition-all"
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">school</span>
                    <span className="material-symbols-outlined absolute right-2 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
            </div>

            {/* Subject Filter Dropdown */}
            <div className="relative w-full md:w-64">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mata Pelajaran</label>
                <div className="relative">
                    <select 
                        value={selectedSubject} 
                        onChange={(e) => setters.setSelectedSubject(e.target.value)}
                        className="w-full appearance-none pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer transition-all"
                    >
                        {AVAILABLE_SUBJECTS.map(subj => (
                            <option key={subj.id} value={subj.id}>{subj.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">book</span>
                    <span className="material-symbols-outlined absolute right-2 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-slate-100 rounded border border-slate-200 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">KKTP</span>
                <span className="text-sm font-bold text-slate-900">{props.subject.kktp}</span>
             </div>
             <button 
                onClick={() => setters.setShowConfig(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors text-slate-700 shadow-sm"
             >
                <span className="material-symbols-outlined text-sm text-primary">settings</span>
                Parameter
             </button>
        </div>
      </div>

      {/* Main Matrix Table */}
      {selectedClass ? (
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl overflow-hidden shadow-sm flex flex-col animate-in fade-in slide-in-from-top-2">
            <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
                <thead>
                {/* Group Headers (TP) */}
                <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="sticky-col bg-slate-50 w-12 px-4 py-2 border-r border-slate-200"></th>
                    <th className="sticky-col-2 bg-slate-50 w-64 px-4 py-2 border-r border-slate-200"></th>
                    {props.tps.map(tp => (
                        <th 
                            key={tp.id} 
                            className="px-4 py-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200 relative group cursor-help bg-slate-50 hover:bg-slate-100 transition-colors" 
                            colSpan={tp.criteria.length || 1}
                        >
                            {tp.code.toUpperCase()}
                            {/* Tooltip for TP */}
                            <div className="absolute hidden group-hover:block bg-slate-800 text-white p-3 rounded-lg text-xs w-64 top-full mt-1 left-1/2 -translate-x-1/2 z-50 font-normal shadow-xl text-left leading-relaxed">
                                <div className="font-bold text-blue-200 mb-1">{tp.code.toUpperCase()}</div>
                                {tp.description}
                            </div>
                        </th>
                    ))}
                    <th className="w-24 px-4 py-2 border-r border-slate-200"></th>
                    <th className="px-4 py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest" colSpan={2}>Kalkulasi Akhir</th>
                </tr>
                {/* Column Headers (Criteria/KR) */}
                <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="sticky-col bg-slate-50 w-12 px-4 py-3 text-xs font-bold text-slate-600 border-r border-slate-200 text-center">No</th>
                    <th className="sticky-col-2 bg-slate-50 w-64 px-4 py-3 text-xs font-bold text-slate-600 border-r border-slate-200">Nama Siswa</th>
                    {props.tps.map(tp => (
                        tp.criteria.length > 0 ? (
                            tp.criteria.map(cr => (
                                <th 
                                    key={cr.id} 
                                    className="w-24 px-2 py-3 text-xs font-bold text-slate-600 text-center border-r border-slate-200 relative group cursor-help bg-slate-50 hover:bg-blue-50 transition-colors"
                                >
                                    {cr.code.toUpperCase()}
                                    {/* Tooltip for Criteria */}
                                    <div className="absolute hidden group-hover:block bg-slate-800 text-white p-2 rounded-lg text-xs w-48 bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 font-normal shadow-xl">
                                        <div className="font-bold text-green-200 mb-0.5 border-b border-white/20 pb-1">{cr.code.toUpperCase()}</div>
                                        {cr.description}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                                    </div>
                                </th>
                            ))
                        ) : (
                            <th key={`empty-${tp.id}`} className="w-24 px-2 py-3 text-xs font-bold text-red-300 text-center border-r border-slate-200 italic">No Criteria</th>
                        )
                    ))}
                    <th className="w-24 px-4 py-3 text-xs font-bold text-slate-600 text-center border-r border-slate-200">Sikap</th>
                    <th className="w-24 px-4 py-3 text-xs font-bold text-slate-600 text-center border-r border-slate-200">NA</th>
                    <th className="w-40 px-4 py-3 text-xs font-bold text-slate-600 text-center">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student, index) => {
                            const result = calculateStudentGrade(student.id, props.globalGradeData, props.tps, props.subject.kktp);
                            return (
                                <tr key={student.id} className="group hover:bg-primary/5 transition-colors">
                                    <td className="sticky-col bg-white group-hover:bg-[#f2f8fe] text-center text-xs text-slate-500 border-r border-slate-100 transition-colors">{index + 1}</td>
                                    <td className="sticky-col-2 bg-white group-hover:bg-[#f2f8fe] px-4 py-0 font-medium text-sm text-slate-700 border-r border-slate-100 transition-colors">
                                        {student.name}
                                        <div className="flex gap-2 items-center mt-0.5">
                                            <span className="text-[10px] text-slate-400 font-normal bg-slate-50 px-1 rounded">{student.nis}</span>
                                            {!selectedClass && <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1 rounded">{student.className}</span>}
                                        </div>
                                    </td>
                                    
                                    {/* Dynamic Criteria Inputs Nested by TP */}
                                    {props.tps.map(tp => (
                                        tp.criteria.length > 0 ? (
                                            tp.criteria.map(cr => {
                                                const err = errorMap[`${student.id}-criteria-${cr.id}`];
                                                return (
                                                    <td key={cr.id} className="p-0 border-r border-slate-100 relative">
                                                        <input 
                                                            type="number" 
                                                            className={`w-full h-10 border-none bg-transparent text-center text-sm focus:ring-0 focus:bg-white focus:shadow-inner ${err ? 'text-red-500 bg-red-50' : 'text-slate-800'}`}
                                                            value={props.globalGradeData[student.id]?.scores?.[cr.id] ?? ''}
                                                            onChange={(e) => handlers.handleScoreChange(student.id, 'criteria', cr.id, e.target.value)}
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                );
                                            })
                                        ) : (
                                            <td key={`empty-cell-${tp.id}`} className="p-0 border-r border-slate-100 bg-slate-50"></td>
                                        )
                                    ))}

                                    {/* Attitude */}
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="number"
                                            className="w-full h-10 border-none bg-transparent text-center text-sm focus:ring-0 focus:bg-white focus:shadow-inner text-slate-800"
                                            value={props.globalGradeData[student.id]?.attitude ?? ''}
                                            onChange={(e) => handlers.handleScoreChange(student.id, 'attitude', 'value', e.target.value)}
                                            placeholder="-"
                                        />
                                    </td>
                                    {/* Final & Status */}
                                    <td className="px-4 text-center font-bold text-sm bg-slate-50 border-r border-slate-200 text-primary">
                                        {result.finalScore || '-'}
                                    </td>
                                    <td className="px-4 text-center">
                                        {result.finalScore > 0 && (
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${result.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {result.isPassed ? 'Tuntas' : 'Remedial'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan={10} className="p-12 text-center text-slate-400 italic bg-slate-50/50">
                                Tidak ada siswa di kelas ini.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>

            {/* Footer Stats */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-xs font-semibold text-slate-500">
                <div className="flex gap-6">
                    <span>TOTAL SISWA: {filteredStudents.length}</span>
                    <span className="text-green-600">TUNTAS: {stats.tuntas}</span>
                    <span className="text-red-600">REMEDIAL: {stats.remedial}</span>
                </div>
            </div>
        </div>
      ) : (
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-12 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
             <div className="bg-slate-50 p-6 rounded-full mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">fact_check</span>
             </div>
             <p className="text-lg font-bold text-slate-600">Mulai Penilaian</p>
             <p className="text-sm">Silahkan pilih <strong className="text-slate-700">Kelas</strong> dan <strong className="text-slate-700">Mata Pelajaran</strong> terlebih dahulu untuk menampilkan lembar kerja.</p>
        </div>
      )}
      
      {/* System Status */}
      <div className="mt-4 flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
            System Ready
        </div>
        <div>
          Last Sync: {currentTime.toLocaleTimeString('id-ID', {timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit'})} WITA
        </div>
      </div>

       {/* Config Modal */}
       {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Parameter Penilaian</h3>
                    <button onClick={() => setters.setShowConfig(false)} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bobot Nilai Akademik (Formatif/Sumatif)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={tempWeights.criteria}
                                onChange={(e) => setters.setTempWeights(prev => ({...prev, criteria: Number(e.target.value)}))}
                                className="w-full border-slate-200 rounded-lg text-center font-bold text-slate-900" 
                            />
                            <span className="text-slate-500 font-bold">%</span>
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bobot Nilai Sikap</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                value={tempWeights.attitude}
                                onChange={(e) => setters.setTempWeights(prev => ({...prev, attitude: Number(e.target.value)}))}
                                className="w-full border-slate-200 rounded-lg text-center font-bold text-slate-900" 
                            />
                            <span className="text-slate-500 font-bold">%</span>
                        </div>
                     </div>
                     <div className={`text-xs font-bold text-center ${tempWeights.criteria + tempWeights.attitude === 100 ? 'text-green-600' : 'text-red-500'}`}>
                         Total: {tempWeights.criteria + tempWeights.attitude}%
                     </div>
                     <button 
                        onClick={handlers.handleSaveWeights}
                        className="w-full py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-blue-600"
                     >
                         Simpan Parameter
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
