
import { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { GoogleGenAI, Type } from "@google/genai";
import { LearningMaterial, LearningObjective, Subject, AssessmentCriteria, IdentityData, AssessmentType } from '../types';

declare const Swal: any;

const SD_SUBJECTS = [
    { id: 'Pendidikan Pancasila', name: 'Pendidikan Pancasila' },
    { id: 'Bahasa Indonesia', name: 'Bahasa Indonesia' },
    { id: 'Matematika', name: 'Matematika' },
    { id: 'IPAS', name: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
    { id: 'Seni Budaya', name: 'Seni Budaya' },
    { id: 'PJOK', name: 'PJOK' },
    { id: 'Bahasa Inggris', name: 'Bahasa Inggris' },
    { id: 'Muatan Lokal', name: 'Muatan Lokal' }
];

const SECONDARY_SUBJECTS = [
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

interface UseCurriculumLogicProps {
  identity: IdentityData;
  tps: LearningObjective[];
  onUpdateTPs: (tps: LearningObjective[]) => void;
}

export const useCurriculumLogic = ({ identity, tps, onUpdateTPs }: UseCurriculumLogicProps) => {
  // --- STATE ---
  const [expandedTpId, setExpandedTpId] = useState<string | null>(null);
  const [generatingTpId, setGeneratingTpId] = useState<string | null>(null);
  const [isAddingTp, setIsAddingTp] = useState(false);
  
  // Forms
  const [newTpForm, setNewTpForm] = useState({ code: '', description: '', semester: '1', scope: '' });
  const [newItemForm, setNewItemForm] = useState<{
      type: 'CRITERIA' | null, 
      parentId: string | null,
      val1: string, 
      val2: string 
  }>({ type: null, parentId: null, val1: '', val2: '' });
  const [newItemType, setNewItemType] = useState<AssessmentType>('FORMATIVE');

  // --- DERIVED SCOPES (Flexible based on Level) ---
  const scopes = useMemo(() => {
      // Default Scopes (Classes)
      if (identity.level === 'SD') {
          return [
              { id: 'Kelas 1', name: 'Kelas 1 (Fase A)' },
              { id: 'Kelas 2', name: 'Kelas 2 (Fase A)' },
              { id: 'Kelas 3', name: 'Kelas 3 (Fase B)' },
              { id: 'Kelas 4', name: 'Kelas 4 (Fase B)' },
              { id: 'Kelas 5', name: 'Kelas 5 (Fase C)' },
              { id: 'Kelas 6', name: 'Kelas 6 (Fase C)' },
          ];
      } else if (identity.level === 'SMP') {
          return [
              { id: 'Kelas 7', name: 'Kelas 7 (Fase D)' },
              { id: 'Kelas 8', name: 'Kelas 8 (Fase D)' },
              { id: 'Kelas 9', name: 'Kelas 9 (Fase D)' },
          ];
      } else { // SMA / SMK
          return [
              { id: 'Kelas 10', name: 'Kelas 10 (Fase E)' },
              { id: 'Kelas 11', name: 'Kelas 11 (Fase F)' },
              { id: 'Kelas 12', name: 'Kelas 12 (Fase F)' },
          ];
      }
  }, [identity.level]);

  // Subject Logic
  const subjectOptions = useMemo(() => {
      return identity.level === 'SD' ? SD_SUBJECTS : SECONDARY_SUBJECTS;
  }, [identity.level]);

  // Filter States
  const [activeScopeId, setActiveScopeId] = useState<string>(scopes[0].id);
  
  // Active Subject State
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  
  // Check if active subject is in the predefined list (for "Lainnya" logic)
  const isManualSubject = useMemo(() => {
      return !subjectOptions.some(s => s.id === activeSubjectId) && activeSubjectId !== '' && activeSubjectId !== 'Lainnya';
  }, [activeSubjectId, subjectOptions]);

  useEffect(() => {
      // Initialize active subject on load
      if (!activeSubjectId) {
          if (identity.role === 'SUBJECT_TEACHER' && identity.subjectName) {
              setActiveSubjectId(identity.subjectName);
          } else {
              setActiveSubjectId(subjectOptions[0].id);
          }
      }
  }, [identity, subjectOptions, activeSubjectId]);

  useEffect(() => {
      const exists = scopes.find(s => s.id === activeScopeId);
      if (!exists && scopes.length > 0) setActiveScopeId(scopes[0].id);
  }, [scopes, activeScopeId]);

  const filteredTPs = useMemo(() => {
      return tps.filter(tp => {
          const scopeMatch = tp.scopeId === activeScopeId;
          const subjectMatch = tp.subjectId ? tp.subjectId === activeSubjectId : true; 
          return scopeMatch && subjectMatch;
      });
  }, [tps, activeScopeId, activeSubjectId]);

  // Grouping for View (Hierarchy Down: Scope -> TP)
  const tpsByScope = useMemo(() => {
      const groups: Record<string, LearningObjective[]> = {};
      filteredTPs.forEach(tp => {
          const s = tp.scope || 'Lingkup Materi Umum';
          if (!groups[s]) groups[s] = [];
          groups[s].push(tp);
      });
      return groups;
  }, [filteredTPs]);

  // Unique Scopes for Autocomplete
  const uniqueScopes = useMemo(() => {
      return Array.from(new Set(tps.map(t => t.scope || ''))).filter(Boolean).sort();
  }, [tps]);

  // --- HANDLERS (CRUD) ---

  const handleAddTP = () => {
    if(!newTpForm.code || !newTpForm.description) return;
    const newTp: LearningObjective = {
        id: Date.now().toString(),
        code: newTpForm.code.toUpperCase(), 
        description: newTpForm.description,
        semester: Number(newTpForm.semester) as 1 | 2,
        scopeId: activeScopeId,
        subjectId: activeSubjectId, 
        scope: newTpForm.scope || 'Lingkup Materi Umum',
        lms: [],
        criteria: []
    };
    onUpdateTPs([...tps, newTp]);
    setIsAddingTp(false);
    setNewTpForm({ code: '', description: '', semester: '1', scope: '' });
  };

  const handleDeleteTP = (id: string) => {
      Swal.fire({
          title: 'Hapus Tujuan Pembelajaran?',
          text: "Seluruh Kriteria yang ada di dalamnya akan ikut terhapus!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateTPs(tps.filter(t => t.id !== id));
              Swal.fire('Terhapus!', 'TP berhasil dihapus.', 'success')
          }
      });
  };

  const handleAddItem = () => {
      if(!newItemForm.val1 || !newItemForm.val2 || !newItemForm.parentId || !newItemForm.type) return;

      const updatedTPs = tps.map(tp => {
          if(tp.id === newItemForm.parentId) {
              return {
                  ...tp,
                  criteria: [...tp.criteria, { 
                      id: Date.now().toString(), 
                      code: newItemForm.val1.toUpperCase(), 
                      description: newItemForm.val2,
                      type: newItemType 
                  }]
              };
          }
          return tp;
      });

      onUpdateTPs(updatedTPs);
      setNewItemForm({ type: null, parentId: null, val1: '', val2: '' });
      setNewItemType('FORMATIVE');
  };

  const handleDeleteSubItem = (tpId: string, itemId: string, type: 'CRITERIA') => {
      Swal.fire({
          title: 'Hapus Item?',
          text: "Item ini akan dihapus permanen.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              const updatedTPs = tps.map(tp => {
                  if(tp.id === tpId) {
                      return { ...tp, criteria: tp.criteria.filter(c => c.id !== itemId) };
                  }
                  return tp;
              });
              onUpdateTPs(updatedTPs);
          }
      });
  };

  // --- AI GENERATION (KRITERIA ONLY) ---
  const generateTpDetails = async (tp: LearningObjective) => {
      if (tp.criteria.length > 0) {
          const result = await Swal.fire({
              title: 'TP Sudah Memiliki Kriteria',
              text: "Melanjutkan akan menambahkan kriteria baru. Lanjutkan?",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Tambahkan',
              cancelButtonText: 'Batal'
          });
          if (!result.isConfirmed) return;
      }

      setGeneratingTpId(tp.id);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            Role: Expert Curriculum Developer for Indonesian School (Kurikulum Merdeka).
            Context: Subject '${activeSubjectId}' for Grade '${activeScopeId}'.
            Task: Based on the Learning Objective (TP) below, generate strictly:
            
            2 to 3 specific 'Assessment Criteria' (Kriteria Ketercapaian Tujuan Pembelajaran / KKTP). 
            - These are indicators to check if student achieved the TP.
            - Keep it concise.

            TP Description: "${tp.description}" (Code: ${tp.code})
            Scope: "${tp.scope}"

            Output must be valid JSON object with array 'criteria'.
          `;

          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          criteria: {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.OBJECT,
                                  properties: {
                                      code: { type: Type.STRING },
                                      description: { type: Type.STRING },
                                      type: { type: Type.STRING, enum: ["FORMATIVE", "SUMMATIVE"] }
                                  }
                              }
                          }
                      }
                  }
              }
          });

          const json = JSON.parse(response.text || '{}');
          
          if (json.criteria) {
              const newCriteria: AssessmentCriteria[] = json.criteria.map((cr: any, idx: number) => ({
                  id: `gen-cr-${Date.now()}-${idx}`,
                  code: cr.code || `KR.${tp.criteria.length + idx + 1}`,
                  description: cr.description,
                  type: (cr.type === 'SUMMATIVE' ? 'SUMMATIVE' : 'FORMATIVE') as AssessmentType
              }));

              const updatedTPs = tps.map(t => {
                  if (t.id === tp.id) {
                      return {
                          ...t,
                          criteria: [...t.criteria, ...newCriteria]
                      };
                  }
                  return t;
              });

              onUpdateTPs(updatedTPs);
              setExpandedTpId(tp.id);
              Swal.fire({
                  title: 'Generate Berhasil',
                  text: `Ditambahkan ${newCriteria.length} Kriteria Penilaian.`,
                  icon: 'success',
                  timer: 2000
              });
          }

      } catch (error: any) {
          console.error(error);
          Swal.fire('Gagal Generate', error.message, 'error');
      } finally {
          setGeneratingTpId(null);
      }
  };

  // --- EXPORT ---
  const handleExportCurriculum = async () => {
    if (filteredTPs.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kurikulum');
    
    const headerRow = sheet.addRow([
        'No', 'Semester', 'Mata Pelajaran', 'Lingkup Materi (Scope)', 'Kelas', 'Tujuan Pembelajaran (TP)', 'Kriteria Ketercapaian (KKTP)'
    ]);

    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    const activeScopeName = scopes.find(s => s.id === activeScopeId)?.name || activeScopeId;
    let rowIndex = 1;

    filteredTPs.forEach((tp) => {
        if (tp.criteria.length > 0) {
            tp.criteria.forEach(cr => {
                const row = sheet.addRow([
                    rowIndex, `Semester ${tp.semester}`, activeSubjectId, tp.scope || 'Umum', activeScopeName,
                    `${tp.code} - ${tp.description}`, `[${cr.type}] ${cr.description}`
                ]);
                row.eachCell((cell) => {
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    cell.alignment = { vertical: 'top', wrapText: true };
                });
            });
        } else {
             const row = sheet.addRow([
                    rowIndex, `Semester ${tp.semester}`, activeSubjectId, tp.scope || 'Umum', activeScopeName,
                    `${tp.code} - ${tp.description}`, '-'
            ]);
            row.eachCell((cell) => {
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.alignment = { vertical: 'top', wrapText: true };
            });
        }
        rowIndex++;
    });

    sheet.getColumn(6).width = 50;
    sheet.getColumn(7).width = 40;
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Kurikulum_Kriteria_${activeScopeName.replace(/\s/g, '_')}_${activeSubjectId}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    Swal.fire({
        title: 'Export Berhasil!',
        text: 'Data Kurikulum & KKTP telah berhasil diunduh.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
  };

  return {
    state: {
        expandedTpId,
        generatingTpId,
        isAddingTp,
        newTpForm,
        newItemForm,
        newItemType,
        activeScopeId,
        activeSubjectId,
        isManualSubject,
        scopes,
        subjectOptions,
        uniqueScopes // Export for autocomplete
    },
    setters: {
        setExpandedTpId,
        setIsAddingTp,
        setNewTpForm,
        setNewItemForm,
        setNewItemType,
        setActiveScopeId,
        setActiveSubjectId
    },
    computed: {
        filteredTPs,
        tpsByScope // Export grouped data
    },
    handlers: {
        handleAddTP,
        handleDeleteTP,
        handleAddItem,
        handleDeleteSubItem,
        generateTpDetails,
        handleExportCurriculum
    }
  };
};
