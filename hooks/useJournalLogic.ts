
import { useState, useEffect, useMemo } from 'react';
import { JournalEntry, LearningObjective, ScheduleItem, ClassInfo } from '../types';
import { supabase } from '../utils/supabase';

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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('');

  const [formData, setFormData] = useState<Omit<JournalEntry, 'id' | 'created_at'>>({
      date: new Date().toISOString().split('T')[0],
      className: '', scheduleId: '', subjectName: '', 
      startTime: '', endTime: '', tpId: '', lmId: '', 
      activity: '', reflection: '', followUp: ''
  });

  // --- FETCH JOURNALS FROM DB ON LOAD ---
  useEffect(() => {
      const fetchJournals = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // Get teacher ID
          const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
          if (!t) return;

          // Fetch Journals
          const { data, error } = await supabase
            .from('journals')
            .select('*')
            .eq('teacher_id', t.id)
            .order('date', { ascending: false });
            
          if (!error && data) {
              // Map DB snake_case to CamelCase
              const mapped: JournalEntry[] = data.map((j: any) => ({
                  id: j.id,
                  date: j.date,
                  scheduleId: j.schedule_id,
                  subjectName: j.subject_name || '',
                  className: j.class_name,
                  startTime: j.start_time ? j.start_time.slice(0,5) : '',
                  endTime: j.end_time ? j.end_time.slice(0,5) : '',
                  tpId: j.tp_id,
                  lmId: j.lm_id,
                  activity: j.activity,
                  reflection: j.reflection,
                  followUp: j.follow_up,
                  created_at: j.created_at
              }));
              onUpdateJournals(mapped);
          }
      };
      fetchJournals();
  }, []); // Run once on mount

  // --- COMPUTED ---
  const availableClasses = useMemo(() => [...new Set(schedules.map(s => s.className))].sort(), [schedules]);
  const availableSubjects = useMemo(() => [...new Set(schedules.map(s => s.subject))].sort(), [schedules]);
  
  const filteredJournals = useMemo(() => {
      return journals.filter(j => {
          const matchClass = filterClass ? j.className === filterClass : false;
          const matchSubject = filterSubject ? j.subjectName === filterSubject : false;
          const query = searchQuery.toLowerCase();
          const matchSearch = j.activity.toLowerCase().includes(query) || j.reflection.toLowerCase().includes(query);
          return matchClass && matchSubject && matchSearch;
      });
  }, [journals, filterClass, filterSubject, searchQuery]);

  const availableScopes = useMemo(() => Array.from(new Set(tps.map(tp => tp.scope || 'Materi Umum'))).sort(), [tps]);
  const availableTPs = useMemo(() => selectedScope ? tps.filter(tp => (tp.scope || 'Materi Umum') === selectedScope) : [], [tps, selectedScope]);
  const activeTP = useMemo(() => tps.find(tp => tp.id === formData.tpId), [formData.tpId, tps]);
  const availableLMs = useMemo(() => activeTP?.lms || [], [activeTP]);

  // --- CRUD HANDLERS ---

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.scheduleId || !formData.date || !formData.tpId || !formData.activity) {
          Swal.fire('Error', 'Data wajib diisi (Jadwal, TP, Kegiatan).', 'error');
          return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user?.id).single();
      if(!t) return;

      const payload = {
          teacher_id: t.id,
          schedule_id: formData.scheduleId,
          tp_id: formData.tpId,
          lm_id: formData.lmId || null,
          date: formData.date,
          class_name: formData.className,
          subject_name: formData.subjectName,
          start_time: formData.startTime,
          end_time: formData.endTime,
          activity: formData.activity,
          reflection: formData.reflection,
          follow_up: formData.followUp
      };

      try {
          if (editingId) {
              const { error } = await supabase.from('journals').update(payload).eq('id', editingId);
              if (error) throw error;
              
              onUpdateJournals(journals.map(j => j.id === editingId ? { ...j, ...formData } : j));
              Swal.fire('Berhasil', 'Jurnal diperbarui.', 'success');
          } else {
              const { data, error } = await supabase.from('journals').insert(payload).select().single();
              if (error) throw error;
              
              const newEntry: JournalEntry = {
                  id: data.id, created_at: data.created_at, ...formData
              };
              onUpdateJournals([newEntry, ...journals]);
              Swal.fire('Berhasil', 'Jurnal tersimpan.', 'success');
          }
          setIsModalOpen(false);
          setEditingId(null);
      } catch (err: any) {
          Swal.fire('Gagal', err.message, 'error');
      }
  };

  const handleDelete = async (id: string) => {
      Swal.fire({
          title: 'Hapus Jurnal?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Hapus'
      }).then(async (result: any) => {
          if (result.isConfirmed) {
              const { error } = await supabase.from('journals').delete().eq('id', id);
              if (!error) {
                  onUpdateJournals(journals.filter(j => j.id !== id));
                  Swal.fire('Terhapus', 'Jurnal dihapus.', 'success');
              }
          }
      });
  };

  const handleScheduleChange = (scheduleId: string) => {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
          setFormData(prev => ({
              ...prev, scheduleId: schedule.id, className: schedule.className,
              subjectName: schedule.subject, startTime: schedule.startTime, endTime: schedule.endTime
          }));
      }
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); };
  const handleEdit = (j: JournalEntry) => { setEditingId(j.id); setFormData(j); setIsModalOpen(true); };
  const handleExportWord = () => {}; 

  return {
    state: { isModalOpen, editingId, filterClass, filterSubject, searchQuery, formData, selectedScope },
    setters: { setIsModalOpen, setFilterClass, setFilterSubject, setSearchQuery, setFormData, setSelectedScope },
    computed: { availableClasses, availableSubjects, filteredJournals, activeTP, availableLMs, availableScopes, availableTPs },
    handlers: { handleScheduleChange, handleSave, handleEdit, handleDelete, handleExportWord, closeModal }
  };
};
