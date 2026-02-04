
import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { JournalEntry, LearningObjective, ScheduleItem, ClassInfo } from '../types';

declare const Swal: any;

interface UseJournalLogicProps {
  journals: JournalEntry[];
  onUpdateJournals: (journals: JournalEntry[]) => void;
  tps: LearningObjective[];
  schedules: ScheduleItem[];
  classes: ClassInfo[];
  initialContext?: { className?: string, scheduleId?: string };
}

export const useJournalLogic = ({
  journals,
  onUpdateJournals,
  tps,
  schedules,
  classes,
  initialContext
}: UseJournalLogicProps) => {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // FILTER STATES
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Default Form Data
  const [formData, setFormData] = useState<Omit<JournalEntry, 'id' | 'created_at'>>({
      date: new Date().toISOString().split('T')[0],
      className: '',
      scheduleId: '',
      subjectName: '', 
      startTime: '',
      endTime: '',
      tpId: '',
      lmId: '',
      activity: '',
      reflection: '',
      followUp: ''
  });

  // --- DERIVED LISTS ---
  const availableClasses = useMemo(() => {
      return [...new Set(schedules.map(s => s.className))].sort();
  }, [schedules]);

  const availableSubjects = useMemo(() => {
      return [...new Set(schedules.map(s => s.subject))].sort();
  }, [schedules]);

  const filteredJournals = useMemo(() => {
      return journals.filter(j => {
          const matchClass = filterClass ? j.className === filterClass : false;
          const matchSubject = filterSubject ? j.subjectName === filterSubject : false;
          const query = searchQuery.toLowerCase();
          const matchSearch = j.activity.toLowerCase().includes(query) || 
                              j.reflection.toLowerCase().includes(query);
          return matchClass && matchSubject && matchSearch;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journals, filterClass, filterSubject, searchQuery]);

  const activeTP = useMemo(() => tps.find(tp => tp.id === formData.tpId), [formData.tpId, tps]);
  const availableLMs = activeTP ? activeTP.lms : [];

  // --- EFFECTS ---
  useEffect(() => {
    if (initialContext?.scheduleId && !isModalOpen) {
        const schedule = schedules.find(s => s.id === initialContext.scheduleId);
        if (schedule) {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                className: schedule.className,
                scheduleId: schedule.id,
                subjectName: schedule.subject,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                tpId: '',
                lmId: '',
                activity: '',
                reflection: '',
                followUp: ''
            });
            setIsModalOpen(true);
        }
    }
    if (initialContext?.className) setFilterClass(initialContext.className);
    if (initialContext?.scheduleId) {
        const schedule = schedules.find(s => s.id === initialContext.scheduleId);
        if(schedule) setFilterSubject(schedule.subject);
    }
  }, [initialContext, schedules]);

  // --- HANDLERS ---

  const handleScheduleChange = (scheduleId: string) => {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
          setFormData(prev => ({
              ...prev,
              scheduleId: schedule.id,
              className: schedule.className,
              subjectName: schedule.subject,
              startTime: schedule.startTime,
              endTime: schedule.endTime
          }));
      } else {
          setFormData(prev => ({ 
              ...prev, scheduleId: '', className: '', subjectName: '', startTime: '', endTime: '' 
          }));
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.scheduleId) {
          Swal.fire('Error', 'Wajib memilih Jadwal Mengajar.', 'error');
          return;
      }
      if (!formData.date || !formData.className || !formData.tpId || !formData.activity) {
          Swal.fire('Error', 'Tanggal, Kelas, TP, dan Kegiatan wajib diisi.', 'error');
          return;
      }

      if (editingId) {
          const updated = journals.map(j => j.id === editingId ? { ...j, ...formData } : j);
          onUpdateJournals(updated);
          Swal.fire('Berhasil', 'Jurnal berhasil diperbarui.', 'success');
      } else {
          const newEntry: JournalEntry = {
              id: Date.now().toString(),
              created_at: new Date().toISOString(),
              ...formData
          };
          onUpdateJournals([newEntry, ...journals]);
          Swal.fire('Berhasil', 'Jurnal baru berhasil disimpan.', 'success');
      }
      setIsModalOpen(false);
      setEditingId(null);
  };

  const handleEdit = (journal: JournalEntry) => {
      setEditingId(journal.id);
      setFormData({ ...journal });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      Swal.fire({
          title: 'Hapus Jurnal?',
          text: "Data yang dihapus tidak dapat dikembalikan.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Ya, Hapus'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateJournals(journals.filter(j => j.id !== id));
              Swal.fire('Terhapus', 'Jurnal berhasil dihapus.', 'success');
          }
      });
  };

  const handleExportExcel = async () => {
    if (filteredJournals.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Jurnal Guru');

    const headerRow = sheet.addRow([
        'No', 'Tanggal', 'Jam', 'Kelas', 'Mata Pelajaran', 
        'Kode TP', 'Deskripsi Kegiatan', 'Refleksi Guru', 'Tindak Lanjut'
    ]);

    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    filteredJournals.forEach((j, index) => {
        const tp = tps.find(t => t.id === j.tpId);
        const row = sheet.addRow([
            index + 1,
            new Date(j.date).toLocaleDateString('id-ID'),
            `${j.startTime} - ${j.endTime}`,
            j.className,
            j.subjectName,
            tp ? tp.code : '-',
            j.activity,
            j.reflection,
            j.followUp
        ]);
        row.eachCell((cell) => {
             cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
             cell.alignment = { vertical: 'top', wrapText: true };
        });
    });

    sheet.getColumn(2).width = 15;
    sheet.getColumn(7).width = 40;
    sheet.getColumn(8).width = 30;
    sheet.getColumn(9).width = 30;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Jurnal_${filterClass || 'Semua'}_${filterSubject || 'Semua'}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
          date: new Date().toISOString().split('T')[0],
          className: '',
          scheduleId: '',
          subjectName: '',
          startTime: '',
          endTime: '',
          tpId: '',
          lmId: '',
          activity: '',
          reflection: '',
          followUp: ''
      });
  };

  return {
    state: { isModalOpen, editingId, filterClass, filterSubject, searchQuery, formData },
    setters: { setIsModalOpen, setFilterClass, setFilterSubject, setSearchQuery, setFormData },
    computed: { availableClasses, availableSubjects, filteredJournals, activeTP, availableLMs },
    handlers: { 
        handleScheduleChange, 
        handleSave, 
        handleEdit, 
        handleDelete, 
        handleExportExcel,
        closeModal
    }
  };
};
