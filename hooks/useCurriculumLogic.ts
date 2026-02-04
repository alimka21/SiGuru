
import { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { GoogleGenAI, Type } from "@google/genai";
import { LearningMaterial, LearningObjective, Subject, AssessmentCriteria, IdentityData, AssessmentType } from '../types';

declare const Swal: any;

// Constants moved outside component
const SD_SUBJECTS = [
    { id: 'math', name: 'Matematika' },
    { id: 'indo', name: 'B. Indonesia' },
    { id: 'ipas', name: 'IPAS' },
    { id: 'ppkn', name: 'PPKn' },
    { id: 'sbura', name: 'Seni Budaya' },
];

const SMP_LEVELS = [
    { id: 'Fase D', name: 'Fase D (Kls 7-9)' },
];

const SMA_LEVELS = [
    { id: 'Fase E', name: 'Fase E (Kls 10)' },
    { id: 'Fase F', name: 'Fase F (Kls 11-12)' },
];

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
  const [newTpForm, setNewTpForm] = useState({ code: '', description: '', semester: '1' });
  const [newItemForm, setNewItemForm] = useState<{
      type: 'LM' | 'CRITERIA' | null, 
      parentId: string | null,
      val1: string, 
      val2: string 
  }>({ type: null, parentId: null, val1: '', val2: '' });
  const [newItemType, setNewItemType] = useState<AssessmentType>('FORMATIVE');

  // --- DERIVED STATE (SCOPES) ---
  const scopes = useMemo(() => {
      if (identity.level === 'SD') return SD_SUBJECTS;
      else if (identity.level === 'SMP') return SMP_LEVELS;
      else return SMA_LEVELS;
  }, [identity.level]);

  // Filter States
  const [activeScopeId, setActiveScopeId] = useState<string>(scopes[0].id);
  const [activeSubjectId, setActiveSubjectId] = useState<string>(
      identity.role === 'SUBJECT_TEACHER' ? identity.subjectName : 'Matematika'
  );

  useEffect(() => {
      const exists = scopes.find(s => s.id === activeScopeId);
      if (!exists) setActiveScopeId(scopes[0].id);
  }, [scopes, activeScopeId]);

  const filteredTPs = useMemo(() => {
      return tps.filter(tp => {
          const scopeMatch = tp.scopeId === activeScopeId;
          const subjectMatch = tp.subjectId ? tp.subjectId === activeSubjectId : true; 
          return scopeMatch && subjectMatch;
      });
  }, [tps, activeScopeId, activeSubjectId]);

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
                          description: newItemForm.val2,
                          type: newItemType 
                      }]
                  };
              }
          }
          return tp;
      });

      onUpdateTPs(updatedTPs);
      setNewItemForm({ type: null, parentId: null, val1: '', val2: '' });
      setNewItemType('FORMATIVE');
  };

  const handleDeleteSubItem = (tpId: string, itemId: string, type: 'LM' | 'CRITERIA') => {
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

  // --- AI GENERATION ---
  const generateTpDetails = async (tp: LearningObjective) => {
      if (tp.lms.length > 0 || tp.criteria.length > 0) {
          const result = await Swal.fire({
              title: 'TP Sudah Memiliki Detail',
              text: "Data Lingkup Materi dan Kriteria yang sudah ada mungkin akan terduplikasi. Lanjutkan generate?",
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
            Context: Subject '${activeSubjectId}' for Grade '${identity.level} - ${activeScopeId}'.
            Task: Based on the Learning Objective (TP) below, generate strictly:
            1. 3 specific 'Lingkup Materi' (Learning Materials/Scope) titles.
            2. 3 specific 'Assessment Criteria' (Kriteria Ketercapaian TP). Ensure mixed types (Formatif/Sumatif).

            TP Description: "${tp.description}" (Code: ${tp.code})

            Output must be valid JSON object with arrays 'lms' and 'criteria'.
          `;

          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          lms: {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.OBJECT,
                                  properties: {
                                      code: { type: Type.STRING },
                                      title: { type: Type.STRING }
                                  }
                              }
                          },
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
          
          if (json.lms && json.criteria) {
              const newLms: LearningMaterial[] = json.lms.map((lm: any, idx: number) => ({
                  id: `gen-lm-${Date.now()}-${idx}`,
                  code: lm.code || `LM.${tp.lms.length + idx + 1}`,
                  title: lm.title
              }));

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
                          lms: [...t.lms, ...newLms],
                          criteria: [...t.criteria, ...newCriteria]
                      };
                  }
                  return t;
              });

              onUpdateTPs(updatedTPs);
              setExpandedTpId(tp.id);
              Swal.fire({
                  title: 'Generate Berhasil',
                  text: `Ditambahkan ${newLms.length} Materi dan ${newCriteria.length} Kriteria.`,
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
        'No', 'Semester', 'Mata Pelajaran', 'Lingkup Materi (Scope/Fase)', 'Kelas', 'Tujuan Pembelajaran (TP)', 'Lingkup Materi (LM) Detail'
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
        if (tp.lms.length > 0) {
            tp.lms.forEach(lm => {
                const row = sheet.addRow([
                    rowIndex, `Semester ${tp.semester}`, activeSubjectId, activeScopeName, identity.level,
                    `${tp.code} - ${tp.description}`, `${lm.code} - ${lm.title}`
                ]);
                row.eachCell((cell) => {
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    cell.alignment = { vertical: 'top', wrapText: true };
                });
            });
        } else {
             const row = sheet.addRow([
                    rowIndex, `Semester ${tp.semester}`, activeSubjectId, activeScopeName, identity.level,
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
    anchor.download = `Kurikulum_${activeScopeName.replace(/\s/g, '_')}_${activeSubjectId}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
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
        scopes,
        subjectOptions: SUBJECT_OPTIONS
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
        filteredTPs
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
