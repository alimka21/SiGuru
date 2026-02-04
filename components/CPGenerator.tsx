
import React, { useState } from 'react';
import { LearningObjective } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

declare const Swal: any;

interface Props {
  onSave: (tps: LearningObjective[]) => void;
  onBack: () => void;
}

// Mock Subjects List for Selection
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
    { id: 'PAK', name: 'Pendidikan Agama Kristen' }
];

export const CPGenerator: React.FC<Props> = ({ onSave, onBack }) => {
  // Input State
  const [level, setLevel] = useState('SMA');
  const [phase, setPhase] = useState('Fase E'); // This acts as scopeId
  const [selectedSubject, setSelectedSubject] = useState('Matematika'); // This acts as subjectId
  const [cpText, setCpText] = useState('');
  
  // Processing State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<LearningObjective[]>([]);
  
  // Buckets for Drag n Drop
  const [sem1Items, setSem1Items] = useState<LearningObjective[]>([]);
  const [sem2Items, setSem2Items] = useState<LearningObjective[]>([]);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempText, setTempText] = useState('');

  // --- REAL AI GENERATION LOGIC ---
  const handleGenerate = async () => {
    if (!cpText.trim()) {
        Swal.fire('Error', 'Teks CP tidak boleh kosong.', 'error');
        return;
    }
    
    setIsGenerating(true);
    setGeneratedItems([]);
    setSem1Items([]);
    setSem2Items([]);

    try {
        // Initialize SDK with key from env
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
        Tugas: Analisis teks Capaian Pembelajaran (CP) berikut untuk Mata Pelajaran '${selectedSubject}' pada jenjang ${level} ${phase}.
        
        Instruksi:
        1. Pecah CP menjadi beberapa Tujuan Pembelajaran (TP) yang spesifik dan terukur.
        2. Gunakan kata kerja operasional (Taksonomi Bloom) yang sesuai dengan karakteristik mata pelajaran ${selectedSubject}.
        3. Pastikan output dalam format JSON array yang valid.
        
        Teks CP:
        "${cpText}"
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
                            tp_description: {
                                type: Type.STRING,
                                description: "Deskripsi lengkap tujuan pembelajaran"
                            },
                            bloom_level: {
                                type: Type.STRING,
                                description: "Level kognitif (C1-C6)"
                            }
                        },
                        required: ["tp_description"]
                    }
                }
            }
        });

        const responseText = response.text;

        if (responseText) {
            const rawData = JSON.parse(responseText);
            
            // Map AI response to our App Type
            // NOTE: scopeId and subjectId will be attached firmly upon Save
            const results: LearningObjective[] = rawData.map((item: any, index: number) => ({
                id: `gen-${Date.now()}-${index}`,
                code: `TP.${index + 1}`,
                description: item.tp_description,
                semester: undefined,
                scopeId: phase, // Attach context immediately for display if needed
                subjectId: selectedSubject, // Attach context
                lms: [],
                criteria: [] 
            }));

            setGeneratedItems(results);
            Swal.fire('Sukses', `Berhasil menghasilkan ${results.length} TP untuk Mapel ${selectedSubject}.`, 'success');
        }

    } catch (error: any) {
        console.error("AI Error:", error);
        Swal.fire('Gagal Generate', 'Terjadi kesalahan saat menghubungi AI: ' + error.message, 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent, item: LearningObjective, source: 'pool' | 'sem1' | 'sem2') => {
    if (editingId === item.id) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.setData('source', source);
  };

  const handleDrop = (e: React.DragEvent, target: 'sem1' | 'sem2' | 'pool') => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    const source = e.dataTransfer.getData('source');

    if (!itemId || !source) return;
    if (source === target) return;

    // Find Item
    let item: LearningObjective | undefined;
    if (source === 'pool') item = generatedItems.find(i => i.id === itemId);
    else if (source === 'sem1') item = sem1Items.find(i => i.id === itemId);
    else if (source === 'sem2') item = sem2Items.find(i => i.id === itemId);

    if (!item) return;

    // Remove from source
    if (source === 'pool') setGeneratedItems(prev => prev.filter(i => i.id !== itemId));
    else if (source === 'sem1') setSem1Items(prev => prev.filter(i => i.id !== itemId));
    else if (source === 'sem2') setSem2Items(prev => prev.filter(i => i.id !== itemId));

    // Update Item Semester
    let updatedItem = { ...item };
    if (target === 'sem1') updatedItem.semester = 1;
    else if (target === 'sem2') updatedItem.semester = 2;
    else updatedItem.semester = undefined;

    // Add to target
    if (target === 'sem1') setSem1Items(prev => [...prev, updatedItem as LearningObjective]);
    else if (target === 'sem2') setSem2Items(prev => [...prev, updatedItem as LearningObjective]);
    else setGeneratedItems(prev => [...prev, updatedItem as LearningObjective]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // --- EDITING LOGIC ---
  const startEditing = (id: string, currentText: string) => {
      setEditingId(id);
      setTempText(currentText);
  };

  const saveEdit = (id: string, listType: 'sem1' | 'sem2') => {
      if (listType === 'sem1') {
          setSem1Items(prev => prev.map(item => item.id === id ? { ...item, description: tempText } : item));
      } else {
          setSem2Items(prev => prev.map(item => item.id === id ? { ...item, description: tempText } : item));
      }
      setEditingId(null);
  };

  const handleSaveAll = () => {
      if (sem1Items.length === 0 && sem2Items.length === 0) {
          Swal.fire('Peringatan', 'Belum ada TP yang dialokasikan ke semester.', 'warning');
          return;
      }

      // CRITICAL: Inject scopeId and subjectId before saving to ensure they appear in Curriculum Manager
      const finalItems = [...sem1Items, ...sem2Items].map(item => ({
          ...item,
          scopeId: phase,          // Links to Class/Phase filter
          subjectId: selectedSubject // Links to Subject filter
      }));

      onSave(finalItems);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
            <button onClick={onBack} className="text-slate-500 text-sm font-medium hover:text-primary">Beranda</button>
            <span className="text-slate-400 text-sm font-medium">/</span>
            <span className="text-primary text-sm font-bold">Generator TP (AI)</span>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-extrabold mb-2">AI Curriculum Generator</h2>
                <p className="text-blue-100 max-w-2xl">
                    Generate Tujuan Pembelajaran (TP) otomatis dari naskah Capaian Pembelajaran (CP) menggunakan kecerdasan buatan Google Gemini.
                </p>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Panel: Input */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-24">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">input</span>
                        Input Data CP
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Jenjang</label>
                            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-primary">
                                <option value="SD">SD</option>
                                <option value="SMP">SMP</option>
                                <option value="SMA">SMA</option>
                                <option value="SMK">SMK</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fase / Kelas</label>
                            <select value={phase} onChange={e => setPhase(e.target.value)} className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-primary">
                                <option value="Fase A">Fase A (Kls 1-2)</option>
                                <option value="Fase B">Fase B (Kls 3-4)</option>
                                <option value="Fase C">Fase C (Kls 5-6)</option>
                                <option value="Fase D">Fase D (Kls 7-9)</option>
                                <option value="Fase E">Fase E (Kls 10)</option>
                                <option value="Fase F">Fase F (Kls 11-12)</option>
                            </select>
                        </div>

                        {/* NEW SUBJECT SELECTOR */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mata Pelajaran</label>
                            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-primary">
                                {SUBJECT_OPTIONS.map(subj => (
                                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Teks Capaian Pembelajaran (CP)</label>
                            <textarea 
                                value={cpText}
                                onChange={e => setCpText(e.target.value)}
                                rows={8}
                                placeholder="Paste teks CP dari dokumen kurikulum di sini..."
                                className="w-full border-slate-200 rounded-lg text-sm text-slate-700 p-3 focus:ring-primary"
                            ></textarea>
                            <p className="text-[10px] text-slate-400 mt-1 text-right">Maks 2000 karakter</p>
                        </div>
                        
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2
                                ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600 hover:shadow-blue-200'}
                            `}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Menganalisis...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    Generate TP
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Result & Planning (Vertical Stack) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Hasil Generate (Pool) */}
                <div 
                    onDrop={(e) => handleDrop(e, 'pool')}
                    onDragOver={handleDragOver}
                    className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-[120px] transition-colors hover:border-primary/50"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">psychology</span>
                            Hasil Generate AI
                        </h4>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{generatedItems.length} TP</span>
                    </div>
                    
                    {generatedItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generatedItems.map((item) => (
                                <div 
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item, 'pool')}
                                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all group relative"
                                >
                                    <div className="font-bold text-primary text-xs mb-1">{item.code}</div>
                                    <div className="text-slate-700">{item.description}</div>
                                    <div className="absolute top-2 right-2 text-slate-300 group-hover:text-primary">
                                        <span className="material-symbols-outlined text-lg">drag_indicator</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-slate-400 text-center">
                            <p className="text-xs">Tujuan Pembelajaran yang dihasilkan akan muncul di sini.<br/>Tarik item ke kotak Semester di bawah.</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-lg">Perencanaan Semester</h3>
                    <button 
                        onClick={handleSaveAll}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">save</span>
                        Simpan ke Kurikulum
                    </button>
                </div>

                {/* 2. Semester 1 Drop Zone */}
                <div 
                    onDrop={(e) => handleDrop(e, 'sem1')}
                    onDragOver={handleDragOver}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                >
                    <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex justify-between items-center">
                        <h4 className="font-bold text-blue-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">filter_1</span>
                            Semester 1 (Ganjil)
                        </h4>
                        <span className="bg-white text-blue-600 px-2 py-0.5 rounded text-xs font-bold">{sem1Items.length} TP</span>
                    </div>
                    <div className="p-4 min-h-[150px] space-y-2 bg-slate-50/50">
                        {sem1Items.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">download</span>
                                <p className="text-xs">Drop TP di sini untuk Semester 1</p>
                            </div>
                        )}
                        {sem1Items.map((item, idx) => (
                            <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex gap-4 items-start group">
                                <div className="bg-blue-100 text-blue-700 size-8 rounded flex items-center justify-center font-bold text-xs shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    {editingId === item.id ? (
                                        <div className="flex gap-2">
                                            <input 
                                                autoFocus
                                                value={tempText}
                                                onChange={(e) => setTempText(e.target.value)}
                                                className="flex-1 border-primary rounded px-2 py-1 text-sm border focus:ring-2 focus:ring-primary"
                                            />
                                            <button onClick={() => saveEdit(item.id, 'sem1')} className="text-green-600"><span className="material-symbols-outlined">check</span></button>
                                        </div>
                                    ) : (
                                        <p className="text-slate-800 text-sm">{item.description}</p>
                                    )}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={() => startEditing(item.id, item.description)} className="text-slate-400 hover:text-blue-500"><span className="material-symbols-outlined text-sm">edit</span></button>
                                    <button onClick={() => setSem1Items(prev => prev.filter(i => i.id !== item.id))} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-sm">close</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Semester 2 Drop Zone */}
                <div 
                    onDrop={(e) => handleDrop(e, 'sem2')}
                    onDragOver={handleDragOver}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                >
                    <div className="bg-purple-50 px-6 py-3 border-b border-purple-100 flex justify-between items-center">
                        <h4 className="font-bold text-purple-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">filter_2</span>
                            Semester 2 (Genap)
                        </h4>
                        <span className="bg-white text-purple-600 px-2 py-0.5 rounded text-xs font-bold">{sem2Items.length} TP</span>
                    </div>
                    <div className="p-4 min-h-[150px] space-y-2 bg-slate-50/50">
                        {sem2Items.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">download</span>
                                <p className="text-xs">Drop TP di sini untuk Semester 2</p>
                            </div>
                        )}
                        {sem2Items.map((item, idx) => (
                            <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex gap-4 items-start group">
                                <div className="bg-purple-100 text-purple-700 size-8 rounded flex items-center justify-center font-bold text-xs shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    {editingId === item.id ? (
                                        <div className="flex gap-2">
                                            <input 
                                                autoFocus
                                                value={tempText}
                                                onChange={(e) => setTempText(e.target.value)}
                                                className="flex-1 border-primary rounded px-2 py-1 text-sm border focus:ring-2 focus:ring-primary"
                                            />
                                            <button onClick={() => saveEdit(item.id, 'sem2')} className="text-green-600"><span className="material-symbols-outlined">check</span></button>
                                        </div>
                                    ) : (
                                        <p className="text-slate-800 text-sm">{item.description}</p>
                                    )}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={() => startEditing(item.id, item.description)} className="text-slate-400 hover:text-blue-500"><span className="material-symbols-outlined text-sm">edit</span></button>
                                    <button onClick={() => setSem2Items(prev => prev.filter(i => i.id !== item.id))} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-sm">close</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
