
import React, { useState, useMemo, useEffect } from 'react';
import { LearningObjective, AssessmentCriteria, IdentityData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

declare const Swal: any;

interface Props {
  onSave: (tps: LearningObjective[]) => void;
  onBack: () => void;
  identity?: IdentityData; // Added identity prop
}

// Data Mapping Fase ke Kelas
const PHASE_MAP: { [key: string]: string[] } = {
    'Fase A': ['Kelas 1', 'Kelas 2'],
    'Fase B': ['Kelas 3', 'Kelas 4'],
    'Fase C': ['Kelas 5', 'Kelas 6'],
    'Fase D': ['Kelas 7', 'Kelas 8', 'Kelas 9'],
    'Fase E': ['Kelas 10'],
    'Fase F': ['Kelas 11', 'Kelas 12'],
};

// Map Level to Default Phase
const LEVEL_TO_PHASE_MAP: { [key: string]: string } = {
    'SD': 'Fase A',
    'SMP': 'Fase D',
    'SMA': 'Fase E',
    'SMK': 'Fase E'
};

// Mock Subjects
const SUBJECT_OPTIONS = [
    { id: 'Matematika', name: 'Matematika' },
    { id: 'Bahasa Indonesia', name: 'Bahasa Indonesia' },
    { id: 'Bahasa Inggris', name: 'Bahasa Inggris' },
    { id: 'IPA', name: 'Ilmu Pengetahuan Alam (IPA)' },
    { id: 'IPS', name: 'Ilmu Pengetahuan Sosial (IPS)' },
    { id: 'PPKn', name: 'Pendidikan Pancasila' },
    { id: 'PJOK', name: 'PJOK' },
    { id: 'Seni Budaya', name: 'Seni Budaya' },
    { id: 'Informatika', name: 'Informatika' },
    { id: 'PAI', name: 'Pendidikan Agama Islam' },
    { id: 'PAK', name: 'Pendidikan Agama Kristen' },
    { id: 'Sejarah', name: 'Sejarah' },
    { id: 'Geografi', name: 'Geografi' },
    { id: 'Ekonomi', name: 'Ekonomi' },
    { id: 'Sosiologi', name: 'Sosiologi' },
    { id: 'Fisika', name: 'Fisika' },
    { id: 'Kimia', name: 'Kimia' },
    { id: 'Biologi', name: 'Biologi' }
];

interface AllocationItem {
    id: string;
    code: string;
    description: string;
    level: string; // Cognitive Level
    topicTitle: string; 
    container: string; // 'BANK' or 'ClassName-Semester'
    criteria: { description: string }[]; 
}

export const CPGenerator: React.FC<Props> = ({ onSave, onBack, identity }) => {
  // Input State
  const [phase, setPhase] = useState('Fase E'); 
  const [selectedSubject, setSelectedSubject] = useState('Matematika'); 
  const [cpText, setCpText] = useState('');
  
  // Data State
  const [isGenerating, setIsGenerating] = useState(false);
  const [allocatedItems, setAllocatedItems] = useState<AllocationItem[]>([]);

  // Drag State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // --- AUTO FILL EFFECT ---
  useEffect(() => {
      if (identity) {
          // Auto Phase
          if (identity.level && LEVEL_TO_PHASE_MAP[identity.level]) {
              setPhase(LEVEL_TO_PHASE_MAP[identity.level]);
          }
          // Auto Subject (if subject teacher)
          if (identity.role === 'SUBJECT_TEACHER' && identity.subjectName) {
              // Try to find exact match in options, or just set it
              const match = SUBJECT_OPTIONS.find(s => s.name.toLowerCase() === identity.subjectName.toLowerCase());
              if (match) setSelectedSubject(match.id);
              // Note: If mapel is custom (not in list), simple select won't show it unless we add it dynamically.
              // For now, defaulting to Matematika if not found in standard list is safer, or user picks.
          }
      }
  }, [identity]);

  // --- COMPUTED ---
  const targetClasses = useMemo(() => PHASE_MAP[phase] || [], [phase]);

  // --- AI GENERATION LOGIC ---
  const handleGenerate = async () => {
    if (!cpText.trim()) {
        Swal.fire('Error', 'Teks CP tidak boleh kosong.', 'error');
        return;
    }
    
    setIsGenerating(true);
    setAllocatedItems([]); 

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
        Role: Expert Curriculum Developer (Kurikulum Merdeka Indonesia).
        Task: Analyze the Capaian Pembelajaran (CP) text below for Subject '${selectedSubject}' in '${phase}'.
        
        Instructions:
        1. Break down the CP into distinct "Lingkup Materi" (Scope/Topics).
        2. For each Scope, generate specific "Tujuan Pembelajaran" (TP).
        3. For each TP, provide 2-3 "Kriteria Ketercapaian" (KKTP/Indicators).
        4. Determine the Cognitive Level (e.g., C1, C2, C3, C4, C5, C6) based on Bloom's Taxonomy.
        
        Format the output strictly as a JSON Array.
        
        CP Text: "${cpText}"
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            lingkup_materi: { type: Type.STRING },
                            tps: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        kode_tp: { type: Type.STRING, description: "Short code like TP.1" },
                                        deskripsi: { type: Type.STRING },
                                        level_kognitif: { type: Type.STRING },
                                        kktp: { 
                                            type: Type.ARRAY, 
                                            items: { type: Type.STRING } 
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const rawData = JSON.parse(response.text || '[]');
        
        // Transform to internal state -> Put into 'BANK' initially
        const newAllocations: AllocationItem[] = [];
        let globalTpIndex = 1;
        
        rawData.forEach((topic: any) => {
            topic.tps.forEach((tp: any) => {
                newAllocations.push({
                    id: `gen-tp-${Date.now()}-${globalTpIndex}`,
                    code: `TP.${globalTpIndex}`,
                    description: tp.deskripsi,
                    level: tp.level_kognitif,
                    topicTitle: topic.lingkup_materi,
                    container: 'BANK', // Default to Staging Area
                    criteria: (tp.kktp || []).map((k: string) => ({ description: k }))
                });
                globalTpIndex++;
            });
        });

        setAllocatedItems(newAllocations);
        Swal.fire({
            title: 'Analisa Selesai',
            text: `Berhasil mengidentifikasi ${rawData.length} Lingkup Materi dan ${newAllocations.length} TP. Silahkan distribusikan ke kelas.`,
            icon: 'success'
        });

    } catch (error: any) {
        console.error("AI Error:", error);
        Swal.fire('Gagal', error.message, 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  // --- DRAG & DROP LOGIC ---

  const onDragStart = (e: React.DragEvent, itemId: string) => {
      setDraggedItemId(itemId);
      e.dataTransfer.setData('text/plain', itemId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, targetContainer: string) => {
      e.preventDefault();
      if (!draggedItemId) return;

      setAllocatedItems(prev => prev.map(item => {
          if (item.id === draggedItemId) {
              return { ...item, container: targetContainer };
          }
          return item;
      }));
      
      setDraggedItemId(null);
  };

  const handleDeleteItem = (id: string) => {
      setAllocatedItems(prev => prev.filter(i => i.id !== id));
  };

  // --- SAVE & RESET ---

  const handleReset = () => {
      Swal.fire({
          title: 'Reset Generator?',
          text: "Semua hasil generate akan dihapus.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Ya, Reset'
      }).then((result: any) => {
          if (result.isConfirmed) {
              setAllocatedItems([]);
              setCpText('');
          }
      });
  };

  const handleSaveAll = () => {
      // Filter items that are actually distributed (not in BANK)
      const distributedItems = allocatedItems.filter(i => i.container !== 'BANK');

      if (distributedItems.length === 0) {
          Swal.fire('Belum Ada Distribusi', 'Silahkan drag TP dari Bank TP ke Kelas/Semester terlebih dahulu.', 'warning');
          return;
      }

      // Final transformation
      const finalTPs: LearningObjective[] = distributedItems.map(item => {
          // Parse container string "ClassName-Semester" -> e.g. "Kelas 10-1"
          const [className, semesterStr] = item.container.split('::');
          
          const criteriaObjects: AssessmentCriteria[] = item.criteria.map((c, idx) => ({
              id: `auto-crit-${item.id}-${idx}`,
              code: `KKTP.${idx + 1}`,
              description: c.description,
              type: 'FORMATIVE'
          }));

          return {
              id: item.id,
              code: item.code,
              description: item.description,
              semester: parseInt(semesterStr) as 1 | 2,
              scopeId: className, // Stores Class Name as ScopeID for curriculum mapping
              subjectId: selectedSubject,
              scope: item.topicTitle, 
              lms: [], 
              criteria: criteriaObjects
          };
      });

      onSave(finalTPs);
  };

  // Helper Styles
  const getBloomColor = (level: string) => {
      if (['C1', 'C2'].some(l => level.includes(l))) return 'bg-green-100 text-green-700 border-green-200';
      if (['C3', 'C4'].some(l => level.includes(l))) return 'bg-blue-100 text-blue-700 border-blue-200';
      return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50"> 
        {/* TOP CONFIGURATION BAR */}
        <div className="bg-white border-b border-slate-200 p-5 shadow-sm z-30 shrink-0">
            <div className="max-w-[1800px] mx-auto">
                <div className="flex items-start gap-6">
                    
                    {/* INPUTS */}
                    <div className="flex-1 grid grid-cols-12 gap-6">
                        <div className="col-span-3 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Fase</label>
                                <select 
                                    value={phase} 
                                    onChange={e => setPhase(e.target.value)} 
                                    className="w-full border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-primary py-2"
                                >
                                    {Object.keys(PHASE_MAP).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                                <select 
                                    value={selectedSubject} 
                                    onChange={e => setSelectedSubject(e.target.value)} 
                                    className="w-full border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-primary py-2"
                                >
                                    {SUBJECT_OPTIONS.map(subj => (
                                        <option key={subj.id} value={subj.id}>{subj.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="col-span-9 space-y-1 flex flex-col h-full">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Capaian Pembelajaran (CP) - <span className="text-primary normal-case">Copy paste teks CP dari dokumen kurikulum</span></label>
                            <textarea 
                                value={cpText}
                                onChange={e => setCpText(e.target.value)}
                                placeholder="Paste naskah CP di sini..."
                                className="w-full border-slate-300 rounded-lg text-xs text-slate-700 p-3 focus:ring-primary resize-none h-24"
                            ></textarea>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-col gap-2 w-48 shrink-0">
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-md transition-all flex justify-center items-center gap-2 h-14
                                ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:scale-[1.02]'}
                            `}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Menganalisa...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-xl">psychology</span>
                                    Generate TP
                                </>
                            )}
                        </button>
                        <button onClick={onBack} className="w-full py-2 text-slate-400 hover:text-slate-600 font-bold text-xs border border-transparent hover:border-slate-200 rounded-lg transition-all">
                            Kembali ke Menu
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT PANEL: STAGING / BANK TP */}
            <div className="w-[350px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-lg">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">inventory_2</span>
                            Bank TP
                        </h3>
                        <p className="text-[10px] text-slate-500">Hasil generate AI masuk di sini</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                        {allocatedItems.filter(i => i.container === 'BANK').length} Item
                    </span>
                </div>
                
                <div 
                    className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50 custom-scrollbar"
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, 'BANK')}
                >
                    {allocatedItems.filter(i => i.container === 'BANK').length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
                            <span className="material-symbols-outlined text-3xl mb-2">auto_awesome</span>
                            <p className="text-xs">Hasil generate akan muncul di sini.</p>
                        </div>
                    )}

                    {allocatedItems.filter(i => i.container === 'BANK').map(item => (
                        <div 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => onDragStart(e, item.id)}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs relative group cursor-grab active:cursor-grabbing hover:border-orange-400 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getBloomColor(item.level)}`}>{item.level}</span>
                                <div className="flex gap-1">
                                    <span className="material-symbols-outlined text-slate-300 text-base">drag_indicator</span>
                                </div>
                            </div>
                            <p className="text-slate-800 font-medium leading-snug mb-2">{item.description}</p>
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-500">
                                <span className="material-symbols-outlined text-[12px] text-blue-500">topic</span>
                                <span className="truncate font-bold">{item.topicTitle}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL: DISTRIBUTION BOARD */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50 p-6">
                <div className="flex gap-6 h-full min-w-max">
                    {targetClasses.map((clsName) => (
                        <div key={clsName} className="w-[380px] flex flex-col bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden h-full">
                            {/* Class Header */}
                            <div className="bg-slate-800 text-white py-3 px-4 flex justify-between items-center shrink-0">
                                <span className="font-bold text-sm tracking-wide">{clsName}</span>
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white/80">
                                    {allocatedItems.filter(i => i.container.startsWith(clsName)).length} TP
                                </span>
                            </div>
                            
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Semester 1 Zone */}
                                <div 
                                    onDrop={(e) => onDrop(e, `${clsName}::1`)}
                                    onDragOver={onDragOver}
                                    className="flex-1 bg-blue-50/30 p-3 border-b border-dashed border-slate-300 overflow-y-auto custom-scrollbar flex flex-col gap-3 relative transition-colors hover:bg-blue-100/50 group/zone"
                                >
                                    <div className="sticky top-0 z-10 flex justify-center mb-1 pointer-events-none opacity-60 group-hover/zone:opacity-100 transition-opacity">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-blue-200 uppercase tracking-wider">
                                            Semester 1
                                        </span>
                                    </div>
                                    
                                    {/* Empty State Hint */}
                                    {allocatedItems.filter(i => i.container === `${clsName}::1`).length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest opacity-30">Drop Here</p>
                                        </div>
                                    )}

                                    {allocatedItems.filter(i => i.container === `${clsName}::1`).map(item => (
                                        <div 
                                            key={item.id} 
                                            draggable
                                            onDragStart={(e) => onDragStart(e, item.id)}
                                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs relative group cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getBloomColor(item.level)}`}>{item.level}</span>
                                                <button onClick={() => handleDeleteItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                            <p className="text-slate-800 leading-snug font-medium">{item.description}</p>
                                            <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-500 truncate font-bold">
                                                {item.topicTitle}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Semester 2 Zone */}
                                <div 
                                    onDrop={(e) => onDrop(e, `${clsName}::2`)}
                                    onDragOver={onDragOver}
                                    className="flex-1 bg-purple-50/30 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 relative transition-colors hover:bg-purple-100/50 group/zone"
                                >
                                    <div className="sticky top-0 z-10 flex justify-center mb-1 pointer-events-none opacity-60 group-hover/zone:opacity-100 transition-opacity">
                                        <span className="bg-purple-100 text-purple-700 px-3 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-purple-200 uppercase tracking-wider">
                                            Semester 2
                                        </span>
                                    </div>

                                    {/* Empty State Hint */}
                                    {allocatedItems.filter(i => i.container === `${clsName}::2`).length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest opacity-30">Drop Here</p>
                                        </div>
                                    )}

                                    {allocatedItems.filter(i => i.container === `${clsName}::2`).map(item => (
                                        <div 
                                            key={item.id} 
                                            draggable
                                            onDragStart={(e) => onDragStart(e, item.id)}
                                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs relative group cursor-grab active:cursor-grabbing hover:border-purple-400 transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getBloomColor(item.level)}`}>{item.level}</span>
                                                <button onClick={() => handleDeleteItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                            <p className="text-slate-800 leading-snug font-medium">{item.description}</p>
                                            <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-500 truncate font-bold">
                                                {item.topicTitle}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 shrink-0">
            <div className="max-w-[1800px] mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-bold uppercase">Total TP Didistribusikan</span>
                        <div className="text-xl font-black text-slate-800 leading-none">
                            {allocatedItems.filter(i => i.container !== 'BANK').length} <span className="text-sm font-medium text-slate-400">/ {allocatedItems.length}</span>
                        </div>
                    </div>
                    {allocatedItems.some(i => i.container !== 'BANK') && (
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 animate-pulse">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Siap Disimpan
                        </p>
                    )}
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleReset}
                        className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">restart_alt</span>
                        Reset
                    </button>
                    <button 
                        onClick={handleSaveAll}
                        className="px-8 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        Simpan Kurikulum
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
