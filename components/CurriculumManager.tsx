
import React, { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { LearningMaterial, LearningObjective, Subject, AssessmentCriteria, IdentityData } from '../types';

declare const Swal: any;

interface Props {
  identity: IdentityData;
  subject: Subject;
  tps: LearningObjective[];
  onUpdateSubject: (kktp: number) => void;
  onUpdateTPs: (tps: LearningObjective[]) => void;
  onBack: () => void;
}

// Mock Data for Scopes
const SD_SUBJECTS = [
    { id: 'math', name: 'Matematika' },
    { id: 'indo', name: 'B. Indonesia' },
    { id: 'ipas', name: 'IPAS' },
    { id: 'ppkn', name: 'PPKn' },
    { id: 'sbura', name: 'Seni Budaya' },
];

const SMP_LEVELS = [
    { id: 'lvl-7', name: 'Kelas 7 (Fase D)' },
    { id: 'lvl-8', name: 'Kelas 8 (Fase D)' },
    { id: 'lvl-9', name: 'Kelas 9 (Fase D)' },
];

const SMA_LEVELS = [
    { id: 'lvl-10', name: 'Kelas 10 (Fase E)' },
    { id: 'lvl-11', name: 'Kelas 11 (Fase F)' },
    { id: 'lvl-12', name: 'Kelas 12 (Fase F)' },
];

export const CurriculumManager: React.FC<Props> = ({ 
  identity, subject, tps, onUpdateSubject, onUpdateTPs, onBack 
}) => {
  const [expandedTpId, setExpandedTpId] = useState<string | null>(null);
  
  // DETERMINE CONTEXT (Scope)
  const scopes = useMemo(() => {
      if (identity.level === 'SD') return SD_SUBJECTS;
      else if (identity.level === 'SMP') return SMP_LEVELS;
      else return SMA_LEVELS;
  }, [identity.level]);

  const [activeScopeId, setActiveScopeId] = useState<string>(scopes[0].id);

  useEffect(() => {
      const exists = scopes.find(s => s.id === activeScopeId);
      if (!exists) setActiveScopeId(scopes[0].id);
  }, [scopes, activeScopeId]);

  // Filter TPs based on Active Scope
  const filteredTPs = useMemo(() => {
      return tps.filter(tp => tp.scopeId === activeScopeId);
  }, [tps, activeScopeId]);

  // TP Form State
  const [isAddingTp, setIsAddingTp] = useState(false);
  const [newTpForm, setNewTpForm] = useState({ code: '', description: '', semester: '1' });

  // Sub-item Form State (LM & Criteria)
  const [newItemForm, setNewItemForm] = useState<{
      type: 'LM' | 'CRITERIA' | null, 
      parentId: string | null,
      val1: string, // Code
      val2: string // Title/Description
  }>({ type: null, parentId: null, val1: '', val2: '' });

  // --- EXPORT FUNCTION ---
  const handleExportCurriculum = async () => {
    if (filteredTPs.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kurikulum');
    
    // Headers
    const headerRow = sheet.addRow([
        'No', 
        'Semester', 
        'Mata Pelajaran', 
        'Lingkup Materi (Scope/Fase)', 
        'Kelas', 
        'Tujuan Pembelajaran (TP)', 
        'Lingkup Materi (LM) Detail'
    ]);

    // Style Headers
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    const activeScopeName = scopes.find(s => s.id === activeScopeId)?.name || activeScopeId;
    const mapelName = identity.level === 'SD' ? activeScopeName : identity.subjectName; // Logic: di SD scope adalah Mapel, di SMA scope adalah Fase/Kelas

    let rowIndex = 1;

    filteredTPs.forEach((tp) => {
        // Jika ada LM, buat baris untuk setiap LM. Jika tidak, buat 1 baris untuk TP saja.
        if (tp.lms.length > 0) {
            tp.lms.forEach(lm => {
                const row = sheet.addRow([
                    rowIndex,
                    `Semester ${tp.semester}`,
                    mapelName,
                    activeScopeName, // Scope/Phase context
                    identity.level,
                    `${tp.code} - ${tp.description}`,
                    `${lm.code} - ${lm.title}`
                ]);
                // Styling per cell
                row.eachCell((cell) => {
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    cell.alignment = { vertical: 'top', wrapText: true };
                });
            });
        } else {
             const row = sheet.addRow([
                    rowIndex,
                    `Semester ${tp.semester}`,
                    mapelName,
                    activeScopeName,
                    identity.level,
                    `${tp.code} - ${tp.description}`,
                    '-'
            ]);
            row.eachCell((cell) => {
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.alignment = { vertical: 'top', wrapText: true };
            });
        }
        rowIndex++;
    });

    // Column Widths
    sheet.getColumn(6).width = 50; // TP Description
    sheet.getColumn(7).width = 40; // LM Detail
    sheet.getColumn(3).width = 20; // Mapel
    sheet.getColumn(4).width = 25; // Scope

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Kurikulum_${activeScopeName.replace(/\s/g, '_')}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  // --- TP CRUD ---
  const handleAddTP = () => {
    if(!newTpForm.code || !newTpForm.description) return;
    const newTp: LearningObjective = {
        id: Date.now().toString(),
        code: newTpForm.code.toUpperCase(), 
        description: newTpForm.description,
        semester: Number(newTpForm.semester) as 1 | 2,
        scopeId: activeScopeId, 
        lms: [],
        criteria: []
    };
    onUpdateTPs([...tps, newTp]);
    setIsAddingTp(false);
    setNewTpForm({ code: '', description: '', semester: '1' });
  };

  const handleDeleteTP = (id: string) => {
      Swal.fire({
          title: 'Hapus Tujuan Pembelajaran?',
          text: "Seluruh Lingkup Materi (LM) dan Kriteria yang ada di dalamnya akan ikut terhapus!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Ya, hapus!',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateTPs(tps.filter(t => t.id !== id));
              Swal.fire('Terhapus!', 'TP berhasil dihapus.', 'success')
          }
      });
  };

  // --- NESTED ITEMS CRUD ---
  const handleAddItem = () => {
      if(!newItemForm.val1 || !newItemForm.val2 || !newItemForm.parentId || !newItemForm.type) return;

      const updatedTPs = tps.map(tp => {
          if(tp.id === newItemForm.parentId) {
              if(newItemForm.type === 'LM') {
                  return {
                      ...tp,
                      lms: [...tp.lms, { 
                          id: Date.now().toString(), 
                          code: newItemForm.val1.toUpperCase(), 
                          title: newItemForm.val2 
                      }]
                  };
              } else {
                  return {
                      ...tp,
                      criteria: [...tp.criteria, { 
                          id: Date.now().toString(), 
                          code: newItemForm.val1.toUpperCase(), 
                          description: newItemForm.val2 
                      }]
                  };
              }
          }
          return tp;
      });

      onUpdateTPs(updatedTPs);
      setNewItemForm({ type: null, parentId: null, val1: '', val2: '' });
  };

  const handleDeleteSubItem = (tpId: string, itemId: string, type: 'LM' | 'CRITERIA') => {
      Swal.fire({
          title: 'Hapus Item?',
          text: "Item ini akan dihapus permanen.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              const updatedTPs = tps.map(tp => {
                  if(tp.id === tpId) {
                      if(type === 'LM') {
                          return { ...tp, lms: tp.lms.filter(l => l.id !== itemId) };
                      } else {
                          return { ...tp, criteria: tp.criteria.filter(c => c.id !== itemId) };
                      }
                  }
                  return tp;
              });
              onUpdateTPs(updatedTPs);
          }
      });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Title */}
        <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Manajemen Kurikulum & Asesmen</h2>
                <p className="text-sm text-gray-500">
                    {identity.level === 'SD' 
                        ? 'Pengaturan TP per Mata Pelajaran (Jenjang SD)' 
                        : 'Pengaturan TP per Tingkat Kelas (Jenjang SMP/SMA/SMK)'}
                </p>
            </div>
             <button onClick={onBack} className="text-gray-500 hover:text-gray-700 font-medium">
                &larr; Kembali
            </button>
        </div>

        {/* Top Control Bar (Dropdown & KKTP) */}
        <div className="px-6 py-4 bg-white border-b flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
            <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
                
                {/* Scope/Class Selector */}
                <div className="w-full md:w-64">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        {identity.level === 'SD' ? 'Mata Pelajaran' : 'Pilih Tingkat Kelas'}
                    </label>
                    <div className="relative">
                        <select 
                            value={activeScopeId} 
                            onChange={(e) => setActiveScopeId(e.target.value)}
                            className="w-full appearance-none pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer bg-white"
                        >
                            {scopes.map(scope => (
                                <option key={scope.id} value={scope.id}>{scope.name}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">
                            {identity.level === 'SD' ? 'menu_book' : 'school'}
                        </span>
                        <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-400 pointer-events-none text-sm">expand_more</span>
                    </div>
                </div>

                {/* KKTP Input */}
                <div className="w-full md:w-32">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">KKTP</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={subject.kktp} 
                            onChange={(e) => onUpdateSubject(Number(e.target.value))}
                            className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">Poin</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                 <button 
                    onClick={handleExportCurriculum}
                    disabled={filteredTPs.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-sm">table_view</span>
                    Export Excel
                </button>
                <button 
                    onClick={() => setIsAddingTp(!isAddingTp)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm">{isAddingTp ? 'remove' : 'add'}</span>
                    Tambah TP
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            
            {/* Add TP Form */}
            {isAddingTp && (
                <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold text-blue-800 mb-3 text-sm">
                        Tambah TP Baru di {scopes.find(s => s.id === activeScopeId)?.name}
                    </h4>
                    <div className="flex gap-3 items-start">
                        <div className="w-24">
                            <input 
                                type="text" placeholder="Kode" 
                                value={newTpForm.code} onChange={e => setNewTpForm({...newTpForm, code: e.target.value.toUpperCase()})}
                                className="w-full p-2 text-sm border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="w-24">
                            <select 
                                value={newTpForm.semester} onChange={e => setNewTpForm({...newTpForm, semester: e.target.value})}
                                className="w-full p-2 text-sm border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-900"
                            >
                                <option value="1">Smt 1</option>
                                <option value="2">Smt 2</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <input 
                                type="text" placeholder="Deskripsi Tujuan Pembelajaran..." 
                                value={newTpForm.description} onChange={e => setNewTpForm({...newTpForm, description: e.target.value})}
                                className="w-full p-2 text-sm border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-900"
                            />
                        </div>
                        <button onClick={handleAddTP} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700">Simpan</button>
                    </div>
                </div>
            )}

            {/* TP List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {filteredTPs.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">library_books</span>
                        <p>Belum ada Tujuan Pembelajaran untuk {scopes.find(s => s.id === activeScopeId)?.name}.</p>
                    </div>
                )}

                {filteredTPs.map((tp) => {
                    const isExpanded = expandedTpId === tp.id;
                    return (
                        <div key={tp.id} className={`border rounded-xl transition-all ${isExpanded ? 'border-primary shadow-md bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            {/* TP Header */}
                            <div 
                                onClick={() => setExpandedTpId(isExpanded ? null : tp.id)}
                                className="p-4 flex items-center gap-4 cursor-pointer"
                            >
                                <div className={`size-10 rounded-lg flex items-center justify-center font-bold text-sm ${isExpanded ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {tp.code.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${isExpanded ? 'text-primary' : 'text-slate-800'}`}>{tp.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Semester {tp.semester}</span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">topic</span> {tp.lms.length} LM
                                        </span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">fact_check</span> {tp.criteria.length} Kriteria
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTP(tp.id); }}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <span className={`material-symbols-outlined text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-6 animate-in slide-in-from-top-2">
                                    
                                    {/* Lingkup Materi Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">topic</span>
                                                Lingkup Materi (LM)
                                            </h4>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left w-24">Kode</th>
                                                        <th className="px-4 py-2 text-left">Judul Materi</th>
                                                        <th className="px-4 py-2 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {tp.lms.map(lm => (
                                                        <tr key={lm.id} className="group hover:bg-slate-50">
                                                            <td className="px-4 py-2 font-mono text-xs font-bold text-blue-600">{lm.code.toUpperCase()}</td>
                                                            <td className="px-4 py-2 text-slate-800">{lm.title}</td>
                                                            <td className="px-4 py-2 text-right">
                                                                <button 
                                                                    onClick={() => handleDeleteSubItem(tp.id, lm.id, 'LM')}
                                                                    className="text-slate-300 hover:text-red-500 group-hover:text-slate-400"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                        {/* Add Row */}
                                                        <tr className="bg-slate-50">
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="text" placeholder="LM.x" 
                                                                className="w-full text-xs border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                                                                value={newItemForm.type === 'LM' && newItemForm.parentId === tp.id ? newItemForm.val1 : ''}
                                                                onChange={(e) => setNewItemForm({ type: 'LM', parentId: tp.id, val1: e.target.value.toUpperCase(), val2: newItemForm.val2 })}
                                                                onFocus={() => setNewItemForm(prev => ({ ...prev, type: 'LM', parentId: tp.id }))}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="text" placeholder="Tambah Lingkup Materi..." 
                                                                className="w-full text-xs border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                                                                value={newItemForm.type === 'LM' && newItemForm.parentId === tp.id ? newItemForm.val2 : ''}
                                                                onChange={(e) => setNewItemForm({ type: 'LM', parentId: tp.id, val1: newItemForm.val1, val2: e.target.value })}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                                {newItemForm.type === 'LM' && newItemForm.parentId === tp.id && newItemForm.val1 && (
                                                                <button onClick={handleAddItem} className="text-blue-600 hover:text-blue-800">
                                                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                                                </button>
                                                                )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Kriteria Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">fact_check</span>
                                                Kriteria Penilaian (Untuk Matrix Input Nilai)
                                            </h4>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left w-24">Kode</th>
                                                        <th className="px-4 py-2 text-left">Deskripsi Kriteria</th>
                                                        <th className="px-4 py-2 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {tp.criteria.map(cr => (
                                                        <tr key={cr.id} className="group hover:bg-slate-50">
                                                            <td className="px-4 py-2 font-mono text-xs font-bold text-green-600">{cr.code.toUpperCase()}</td>
                                                            <td className="px-4 py-2 text-slate-800">{cr.description}</td>
                                                            <td className="px-4 py-2 text-right">
                                                                <button 
                                                                    onClick={() => handleDeleteSubItem(tp.id, cr.id, 'CRITERIA')}
                                                                    className="text-slate-300 hover:text-red-500 group-hover:text-slate-400"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                        {/* Add Row */}
                                                        <tr className="bg-slate-50">
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="text" placeholder="KR.x" 
                                                                className="w-full text-xs border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-green-500 bg-white text-slate-900"
                                                                value={newItemForm.type === 'CRITERIA' && newItemForm.parentId === tp.id ? newItemForm.val1 : ''}
                                                                onChange={(e) => setNewItemForm({ type: 'CRITERIA', parentId: tp.id, val1: e.target.value.toUpperCase(), val2: newItemForm.val2 })}
                                                                onFocus={() => setNewItemForm(prev => ({ ...prev, type: 'CRITERIA', parentId: tp.id }))}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input 
                                                                type="text" placeholder="Tambah Kriteria Penilaian..." 
                                                                className="w-full text-xs border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-green-500 bg-white text-slate-900"
                                                                value={newItemForm.type === 'CRITERIA' && newItemForm.parentId === tp.id ? newItemForm.val2 : ''}
                                                                onChange={(e) => setNewItemForm({ type: 'CRITERIA', parentId: tp.id, val1: newItemForm.val1, val2: e.target.value })}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                                {newItemForm.type === 'CRITERIA' && newItemForm.parentId === tp.id && newItemForm.val1 && (
                                                                <button onClick={handleAddItem} className="text-green-600 hover:text-green-800">
                                                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                                                </button>
                                                                )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
