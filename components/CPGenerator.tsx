
import React, { useState } from 'react';
import { LearningObjective } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

declare const Swal: any;

interface Props {
  onSave: (tps: LearningObjective[]) => void;
  onBack: () => void;
}

export const CPGenerator: React.FC<Props> = ({ onSave, onBack }) => {
  // Input State
  const [level, setLevel] = useState('SMA');
  const [phase, setPhase] = useState('Fase E');
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
        Tugas: Analisis teks Capaian Pembelajaran (CP) berikut untuk jenjang ${level} ${phase}.
        
        Instruksi:
        1. Pecah CP menjadi beberapa Tujuan Pembelajaran (TP) yang spesifik dan terukur.
        2. Gunakan kata kerja operasional (Taksonomi Bloom) yang sesuai.
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

        if (response.text) {
            const rawData = JSON.parse(response.text);
            
            // Map AI response to our App Type
            const results: LearningObjective[] = rawData.map((item: any, index: number) => ({
                id: `gen-${Date.now()}-${index}`,
                code: `TP.${index + 1}`,
                description: item.tp_description,
                semester: undefined,
                lms: [],
                criteria: [] 
            }));

            setGeneratedItems(results);
            Swal.fire('Sukses', `Berhasil menghasilkan ${results.length} TP.`, 'success');
        }

    } catch (error: any) {
        console.error("AI Error:", error);
        Swal.fire('Gagal Generate', 'Terjadi kesalahan saat menghubungi AI: ' + error.message, 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  // --- DRAG AND DROP LOGIC (Using HTML5 Native) ---
  const handleDragStart = (e: React.DragEvent, item: LearningObjective, source: 'pool' | 'sem1' | 'sem2') => {
    if (editingId === item.id) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.setData('source', source);
  };

  const handleDrop = (e: React.DragEvent, target: 'sem1' | 'sem2') => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    const source = e.dataTransfer.getData('source');

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

    // Add to target with updated semester
    const updatedItem = { ...item, semester: target === 'sem1' ? 1 : 2 } as LearningObjective;
    if (target === 'sem1') setSem1Items(prev => [...prev, updatedItem]);
    else if (target === 'sem2') setSem2Items(prev => [...prev, updatedItem]);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  // --- EDITING LOGIC ---
  const handleStartEdit = (item: LearningObjective) => {
      setEditingId(item.id);
      setTempText(item.description);
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setTempText('');
  };

  const handleSaveEdit = (semester: 1 | 2) => {
      if (!editingId) return;

      const updater = (prev: LearningObjective[]) => 
          prev.map(item => item.id === editingId ? { ...item, description: tempText } : item);

      if (semester === 1) setSem1Items(updater);
      else setSem2Items(updater);

      setEditingId(null);
      setTempText('');
  };

  const handleSaveAll = () => {
      const finalTPs = [...sem1Items, ...sem2Items];
      if (finalTPs.length === 0) {
          Swal.fire('Info', 'Silahkan pindahkan minimal 1 TP ke Semester 1 atau 2 sebelum menyimpan.', 'info');
          return;
      }
      onSave(finalTPs);
  };

  // Render Item Helper
  const renderItem = (item: LearningObjective, idx: number, semester: 1 | 2) => {
      const isEditing = editingId === item.id;
      
      if (isEditing) {
          return (
              <div key={item.id} className="bg-white p-3 rounded-lg border-l-4 border-purple-500 shadow-md flex flex-col gap-2">
                  <span className="text-xs font-bold text-purple-600">Edit Narasi TP</span>
                  <textarea 
                      value={tempText}
                      onChange={(e) => setTempText(e.target.value)}
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-200 outline-none text-slate-900"
                      rows={3}
                      autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                      <button 
                        onClick={handleCancelEdit}
                        className="p-1 text-slate-500 hover:bg-slate-100 rounded" title="Batal"
                      >
                          <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                      <button 
                        onClick={() => handleSaveEdit(semester)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded" title="Simpan Perubahan"
                      >
                          <span className="material-symbols-outlined text-lg">check</span>
                      </button>
                  </div>
              </div>
          );
      }

      return (
        <div 
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item, semester === 1 ? 'sem1' : 'sem2')}
            className={`bg-white p-4 rounded-lg border-l-4 ${semester === 1 ? 'border-blue-500' : 'border-orange-500'} shadow-sm flex items-start gap-3 cursor-grab group`}
        >
            <span className="text-xs font-bold text-slate-400 mt-0.5">#{idx + 1}</span>
            <p className="text-sm text-slate-900 font-medium flex-1">{item.description}</p>
            <button 
                onClick={() => handleStartEdit(item)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                title="Edit Narasi TP"
            >
                <span className="material-symbols-outlined text-sm">edit</span>
            </button>
        </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 mb-1">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Kembali
                </button>
             </div>
             <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-purple-600">psychology_alt</span>
                AI TP Generator
             </h2>
             <p className="text-slate-500 text-base">Ubah narasi Capaian Pembelajaran (CP) menjadi Tujuan Pembelajaran (TP) siap pakai secara otomatis menggunakan <strong>Google Gemini AI</strong>.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleSaveAll}
                disabled={sem1Items.length === 0 && sem2Items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary border-2 border-primary rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400"
            >
                <span className="material-symbols-outlined">save</span>
                Simpan ke Kurikulum
            </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
          
          {/* Left Panel: Inputs & Source (Widened to col-span-5) */}
          <div className="col-span-5 flex flex-col gap-4 h-full overflow-hidden">
              {/* Configuration */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">1. Konfigurasi CP</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="text-xs font-bold text-slate-500">Jenjang</label>
                          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full mt-1 border-slate-200 rounded-lg text-sm font-bold text-slate-900">
                              <option>SD</option>
                              <option>SMP</option>
                              <option>SMA</option>
                              <option>SMK</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500">Fase</label>
                          <select value={phase} onChange={e => setPhase(e.target.value)} className="w-full mt-1 border-slate-200 rounded-lg text-sm font-bold text-slate-900">
                              <option>Fase A (1-2)</option>
                              <option>Fase B (3-4)</option>
                              <option>Fase C (5-6)</option>
                              <option>Fase D (7-9)</option>
                              <option>Fase E (10)</option>
                              <option>Fase F (11-12)</option>
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500">Input Teks Capaian Pembelajaran (CP)</label>
                      <textarea 
                        value={cpText}
                        onChange={(e) => setCpText(e.target.value)}
                        placeholder="Paste teks CP dari dokumen resmi (Keputusan BSKAP) di sini..."
                        className="w-full mt-1 border-slate-200 rounded-lg text-sm font-medium text-slate-900 p-3 h-32 focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-400"
                      ></textarea>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !cpText}
                    className="w-full py-3 bg-purple-600 text-white border border-transparent rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-70 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                      {isGenerating ? (
                          <>
                            <span className="material-symbols-outlined animate-spin">sync</span>
                            Gemini Sedang Berpikir...
                          </>
                      ) : (
                          <>
                            <span className="material-symbols-outlined">auto_awesome</span>
                            Generate Tujuan Pembelajaran
                          </>
                      )}
                  </button>
              </div>

              {/* Pool Results */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex-1 overflow-y-auto flex flex-col">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                      <span>Hasil Analisis AI ({generatedItems.length})</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-1 rounded text-slate-500">Drag ke kanan</span>
                  </h3>
                  
                  {generatedItems.length === 0 && !isGenerating && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                          <span className="material-symbols-outlined text-4xl mb-2">input</span>
                          <p className="text-sm">Masukkan CP dan klik Generate untuk melihat hasil.</p>
                      </div>
                  )}

                  <div className="space-y-2">
                    {generatedItems.map((item) => (
                        <div 
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item, 'pool')}
                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-purple-400 hover:shadow-md transition-all group animate-in slide-in-from-left-1"
                        >
                            <p className="text-sm text-slate-900 font-medium leading-snug">{item.description}</p>
                            <div className="flex gap-1 mt-2">
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 font-bold">Hasil AI</span>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
          </div>

          {/* Right Panel: Semester Buckets (Narrowed to col-span-7) */}
          <div className="col-span-7 grid grid-rows-2 gap-4 h-full overflow-hidden">
              
              {/* Semester 1 */}
              <div 
                onDrop={(e) => handleDrop(e, 'sem1')}
                onDragOver={handleDragOver}
                className={`bg-blue-50/50 border-2 border-dashed ${sem1Items.length > 0 ? 'border-blue-300' : 'border-slate-300'} rounded-xl p-5 flex flex-col overflow-hidden transition-colors hover:bg-blue-50`}
              >
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-600">filter_1</span>
                          Semester 1 (Ganjil)
                      </h3>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{sem1Items.length} TP</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {sem1Items.map((item, idx) => renderItem(item, idx, 1))}
                      {sem1Items.length === 0 && (
                          <div className="h-full flex items-center justify-center text-slate-400">
                              <p className="text-sm font-medium">Drop Tujuan Pembelajaran di sini</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Semester 2 */}
              <div 
                onDrop={(e) => handleDrop(e, 'sem2')}
                onDragOver={handleDragOver}
                className={`bg-orange-50/50 border-2 border-dashed ${sem2Items.length > 0 ? 'border-orange-300' : 'border-slate-300'} rounded-xl p-5 flex flex-col overflow-hidden transition-colors hover:bg-orange-50`}
              >
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <span className="material-symbols-outlined text-orange-600">filter_2</span>
                          Semester 2 (Genap)
                      </h3>
                       <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">{sem2Items.length} TP</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {sem2Items.map((item, idx) => renderItem(item, idx, 2))}
                       {sem2Items.length === 0 && (
                          <div className="h-full flex items-center justify-center text-slate-400">
                              <p className="text-sm font-medium">Drop Tujuan Pembelajaran di sini</p>
                          </div>
                      )}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};
