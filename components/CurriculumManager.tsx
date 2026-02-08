
import React from 'react';
import { LearningObjective, Subject, IdentityData, AssessmentType } from '../types';
import { useCurriculumLogic } from '../hooks/useCurriculumLogic';

interface Props {
  identity: IdentityData;
  subject: Subject;
  tps: LearningObjective[];
  onUpdateSubject: (kktp: number) => void;
  onUpdateTPs: (tps: LearningObjective[]) => void;
  onBack: () => void;
}

export const CurriculumManager: React.FC<Props> = (props) => {
  const { 
    state, 
    setters, 
    computed, 
    handlers 
  } = useCurriculumLogic(props);

  const { filteredTPs, tpsByScope } = computed;
  const { 
      expandedTpId, generatingTpId, isAddingTp, newTpForm, 
      newItemForm, newItemType, activeScopeId, activeSubjectId, isManualSubject,
      scopes, subjectOptions, uniqueScopes, editingTpId
  } = state;

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Title */}
        <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Manajemen Kurikulum & Asesmen</h2>
                <p className="text-sm text-gray-500">
                    {props.identity.level === 'SD' 
                        ? 'Pengaturan TP per Mata Pelajaran (Jenjang SD)' 
                        : 'Pengaturan TP per Tingkat Kelas (Jenjang SMP/SMA/SMK)'}
                </p>
            </div>
             <button onClick={props.onBack} className="text-gray-500 hover:text-gray-700 font-medium">
                &larr; Kembali
            </button>
        </div>

        {/* Top Control Bar (Dropdown) */}
        <div className="px-6 py-4 bg-white border-b flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                
                {/* Scope/Class Selector */}
                <div className="w-full md:w-56">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        {props.identity.level === 'SD' ? 'Pilih Kelas' : 'Pilih Tingkat / Fase'}
                    </label>
                    <div className="relative">
                        <select 
                            value={activeScopeId} 
                            onChange={(e) => setters.setActiveScopeId(e.target.value)}
                            className="w-full appearance-none pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer bg-white"
                        >
                            {scopes.map(scope => (
                                <option key={scope.id} value={scope.id}>{scope.name}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">
                            {props.identity.level === 'SD' ? 'menu_book' : 'school'}
                        </span>
                        <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-400 pointer-events-none text-sm">expand_more</span>
                    </div>
                </div>

                {/* Subject Selector (Smart Logic) */}
                <div className="w-full md:w-64">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mata Pelajaran</label>
                    <div className="relative flex gap-2">
                        {isManualSubject ? (
                            <div className="relative w-full">
                                <input 
                                    type="text" 
                                    value={activeSubjectId}
                                    onChange={(e) => setters.setActiveSubjectId(e.target.value)}
                                    placeholder="Ketik Mata Pelajaran..."
                                    className="w-full pl-10 pr-8 py-2 border border-blue-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary outline-none bg-blue-50"
                                    autoFocus
                                />
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-blue-500 text-lg">edit</span>
                                <button 
                                    onClick={() => setters.setActiveSubjectId(subjectOptions[0])} 
                                    className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
                                    title="Kembali ke Daftar"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        ) : (
                            <div className="relative w-full">
                                <select 
                                    value={activeSubjectId} 
                                    onChange={(e) => {
                                        if(e.target.value === 'Lainnya') {
                                            setters.setActiveSubjectId(''); // Trigger manual mode
                                        } else {
                                            setters.setActiveSubjectId(e.target.value);
                                        }
                                    }}
                                    className="w-full appearance-none pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer bg-white"
                                >
                                    {subjectOptions.map(subj => (
                                        <option key={subj} value={subj}>{subj}</option>
                                    ))}
                                    {props.identity.level === 'SMK' || props.identity.level === 'SMA' ? (
                                        <option value="Lainnya">+ Tambah Manual / Lainnya</option>
                                    ) : null}
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">book</span>
                                <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-400 pointer-events-none text-sm">expand_more</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                 <button 
                    onClick={handlers.handleExportCurriculum}
                    disabled={filteredTPs.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-sm">table_view</span>
                    Export Excel
                </button>
                <button 
                    onClick={() => {
                        if (isAddingTp) handlers.handleCancelEdit();
                        else setters.setIsAddingTp(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm
                        ${isAddingTp ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white hover:bg-blue-600'}
                    `}
                >
                    <span className="material-symbols-outlined text-sm">{isAddingTp ? 'close' : 'add'}</span>
                    {isAddingTp ? 'Batal' : 'Tambah TP'}
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            
            {/* Add/Edit TP Form */}
            {isAddingTp && (
                <div className="mx-6 mt-6 p-6 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold text-blue-800 mb-4 text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">{editingTpId ? 'edit' : 'add_circle'}</span>
                        {editingTpId ? 'Edit Tujuan Pembelajaran' : `Tambah TP Baru di ${activeSubjectId}`}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Kode */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">Kode TP {editingTpId ? '' : '(Otomatis)'}</label>
                            <input 
                                type="text" placeholder={editingTpId ? "Ex: INF-E-1-1" : "Kosongkan untuk auto-generate"}
                                value={newTpForm.code} onChange={e => setters.setNewTpForm({...newTpForm, code: e.target.value.toUpperCase()})}
                                className="w-full p-2.5 text-sm border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        {/* Lingkup Materi */}
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">Lingkup Materi (Scope)</label>
                            <input 
                                type="text" list="scopes-list" placeholder="Ketik atau pilih Materi..." 
                                value={newTpForm.scope} onChange={e => setters.setNewTpForm({...newTpForm, scope: e.target.value})}
                                className="w-full p-2.5 text-sm border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-900 placeholder:text-slate-400"
                            />
                            <datalist id="scopes-list">
                                {uniqueScopes.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        {/* Semester */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">Semester</label>
                            <select 
                                value={newTpForm.semester} onChange={e => setters.setNewTpForm({...newTpForm, semester: e.target.value})}
                                className="w-full p-2.5 text-sm border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-900"
                            >
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                            </select>
                        </div>
                        
                        {/* Helper Text for TP Code Format */}
                        <div className="md:col-span-4">
                            <p className="text-[10px] text-blue-500 italic bg-blue-100/50 px-2 py-1 rounded inline-block">
                                * Format Kode TP Otomatis: <strong>Mata Pelajaran-Fase-Semester-TP Ke berapa</strong>. (Contoh: MTK-E-1-2)
                            </p>
                        </div>

                        {/* Deskripsi - Full Width */}
                        <div className="md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">Deskripsi Tujuan Pembelajaran</label>
                            <input 
                                type="text" placeholder="Deskripsi lengkap TP..." 
                                value={newTpForm.description} onChange={e => setters.setNewTpForm({...newTpForm, description: e.target.value})}
                                className="w-full p-2.5 text-sm border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-900"
                            />
                        </div>
                        {/* Button */}
                        <div className="md:col-span-1">
                            <button onClick={handlers.handleAddTP} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">
                                {editingTpId ? 'Simpan Perubahan' : 'Simpan TP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TP List (Grouped by Scope) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {Object.keys(tpsByScope).length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">library_books</span>
                        <p>Belum ada Tujuan Pembelajaran untuk {activeSubjectId || 'Mapel'} di {scopes.find(s => s.id === activeScopeId)?.name}.</p>
                    </div>
                )}

                {Object.entries(tpsByScope).map(([scopeName, tpsInScope]) => (
                    <div key={scopeName} className="space-y-4">
                        {/* Scope Header */}
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                            <span className="material-symbols-outlined text-primary">topic</span>
                            <h3 className="text-lg font-bold text-slate-800">{scopeName}</h3>
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{tpsInScope.length} TP</span>
                        </div>

                        {/* TP Cards */}
                        <div className="space-y-4">
                            {tpsInScope.map((tp) => {
                                const isExpanded = expandedTpId === tp.id;
                                const isGeneratingThis = generatingTpId === tp.id;

                                return (
                                    <div key={tp.id} className={`border rounded-xl transition-all ${isExpanded ? 'border-primary shadow-md bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                        {/* TP Header */}
                                        <div 
                                            onClick={() => setters.setExpandedTpId(isExpanded ? null : tp.id)}
                                            className="p-4 flex items-center gap-4 cursor-pointer"
                                        >
                                            <div className={`min-w-[80px] h-10 px-2 rounded-lg flex items-center justify-center font-bold text-xs ${isExpanded ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {tp.code.toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold ${isExpanded ? 'text-primary' : 'text-slate-800'}`}>{tp.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Semester {tp.semester}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px]">fact_check</span> {tp.criteria.length} Kriteria
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {/* Edit Button */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handlers.handleEditTP(tp); }}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit TP"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                {/* Delete Button */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handlers.handleDeleteTP(tp.id); }}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus TP"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                            <span className={`material-symbols-outlined text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                        </div>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-6 animate-in slide-in-from-top-2 relative">
                                                
                                                {/* AI Generate Detail Button */}
                                                <div className="absolute top-4 right-4">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handlers.generateTpDetails(tp); }}
                                                        disabled={isGeneratingThis || generatingTpId !== null}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm
                                                            ${isGeneratingThis 
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                                            }
                                                        `}
                                                    >
                                                        {isGeneratingThis ? (
                                                            <>
                                                                <span className="size-3 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                                                                Menyusun KKTP...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                                {tp.criteria.length > 0 ? 'Tambah Kriteria (AI)' : 'Generate Kriteria (AI)'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Kriteria Section */}
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-sm">fact_check</span>
                                                            Kriteria Penilaian (KKTP)
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
                                                                {tp.criteria.length > 0 ? tp.criteria.map(cr => (
                                                                    <tr key={cr.id} className="group hover:bg-slate-50">
                                                                        <td className="px-4 py-2 font-mono text-xs font-bold text-green-600">{cr.code.toUpperCase()}</td>
                                                                        <td className="px-4 py-2 text-slate-800">{cr.description}</td>
                                                                        <td className="px-4 py-2 text-right">
                                                                            <button 
                                                                                onClick={() => handlers.handleDeleteSubItem(tp.id, cr.id, 'CRITERIA')}
                                                                                className="text-slate-300 hover:text-red-500 group-hover:text-slate-400"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )) : (
                                                                    <tr>
                                                                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic text-xs">Belum ada kriteria penilaian. Gunakan Generate AI di atas atau tambah manual.</td>
                                                                    </tr>
                                                                )}
                                                                    {/* Add Row */}
                                                                    <tr className="bg-slate-50">
                                                                    <td className="px-2 py-2">
                                                                        <input 
                                                                            type="text" placeholder="KR.x" 
                                                                            className="w-full text-xs border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-green-500 bg-white text-slate-900"
                                                                            value={newItemForm.type === 'CRITERIA' && newItemForm.parentId === tp.id ? newItemForm.val1 : ''}
                                                                            onChange={(e) => setters.setNewItemForm({ type: 'CRITERIA', parentId: tp.id, val1: e.target.value.toUpperCase(), val2: newItemForm.val2 })}
                                                                            onFocus={() => setters.setNewItemForm(prev => ({ ...prev, type: 'CRITERIA', parentId: tp.id }))}
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        <input 
                                                                            type="text" placeholder="Tambah Kriteria Manual..." 
                                                                            className="w-full text-xs border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-green-500 bg-white text-slate-900"
                                                                            value={newItemForm.type === 'CRITERIA' && newItemForm.parentId === tp.id ? newItemForm.val2 : ''}
                                                                            onChange={(e) => setters.setNewItemForm({ type: 'CRITERIA', parentId: tp.id, val1: newItemForm.val1, val2: e.target.value })}
                                                                            onKeyDown={(e) => e.key === 'Enter' && handlers.handleAddItem()}
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                            {newItemForm.type === 'CRITERIA' && newItemForm.parentId === tp.id && newItemForm.val1 && (
                                                                            <button onClick={handlers.handleAddItem} className="text-green-600 hover:text-green-800">
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
                ))}
            </div>
        </div>
    </div>
  );
};
