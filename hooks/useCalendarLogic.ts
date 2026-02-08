
import { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, EventType } from '../types';
import { useLocation } from 'react-router-dom';

declare const Swal: any;

interface UseCalendarLogicProps {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
}

// Extend internal form state to include 'customNote' for OTHER type
interface LocalFormData extends Omit<CalendarEvent, 'id'> {
    customNote?: string;
}

export const useCalendarLogic = ({ events, onUpdateEvents }: UseCalendarLogicProps) => {
  const location = useLocation();
  
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date()); // For viewing Month
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // For modal detail
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<LocalFormData>({
      title: '',
      date: '',
      description: '',
      type: 'MEETING',
      customNote: '' // Initialize custom note
  });

  // --- EFFECT: Check Navigation State (From Dashboard) ---
  useEffect(() => {
      if (location.state && location.state.targetDate) {
          const target = new Date(location.state.targetDate);
          setCurrentDate(target); // Move calendar view to that month
          setSelectedDate(location.state.targetDate); // Open detail for that day
          setIsModalOpen(true);
          // Set form date for adding new event on that day
          setFormData(prev => ({ ...prev, date: location.state.targetDate }));
      }
  }, [location.state]);

  // --- HELPERS ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sunday

  // --- COMPUTED ---
  const monthData = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      // Empty slots for days before the 1st
      for (let i = 0; i < firstDay; i++) {
          days.push(null);
      }
      // Actual days
      for (let i = 1; i <= daysInMonth; i++) {
          days.push(new Date(year, month, i));
      }
      return days;
  }, [currentDate]);

  const selectedDayEvents = useMemo(() => {
      if (!selectedDate) return [];
      return events.filter(e => e.date === selectedDate);
  }, [events, selectedDate]);

  // --- HANDLERS ---
  const changeMonth = (offset: number) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleDayClick = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      setSelectedDate(dateStr);
      setFormData({ title: '', date: dateStr, description: '', type: 'MEETING', customNote: '' });
      setIsModalOpen(true);
  };

  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title || !formData.date) return;

      // Handle "Lainnya" Logic
      // If type is OTHER, prepend the customNote to the description
      let finalDescription = formData.description || '';
      if (formData.type === 'OTHER' && formData.customNote) {
          finalDescription = `[Jenis: ${formData.customNote}] ${finalDescription}`;
      }

      const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: formData.title,
          date: formData.date,
          type: formData.type,
          description: finalDescription
      };
      
      onUpdateEvents([...events, newEvent]);
      setFormData({ title: '', date: selectedDate || '', description: '', type: 'MEETING', customNote: '' }); // Reset form
      
      // Updated Swal to be Center Dialog (Not Toast)
      Swal.fire({
          title: 'Agenda Tersimpan!',
          text: 'Jadwal kegiatan berhasil ditambahkan ke kalender.',
          icon: 'success',
          confirmButtonColor: '#137fec',
          confirmButtonText: 'Oke'
      });
  };

  const handleDeleteEvent = (id: string) => {
      Swal.fire({
          title: 'Hapus Agenda?',
          text: "Agenda ini akan dihapus permanen.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateEvents(events.filter(e => e.id !== id));
              Swal.fire('Terhapus!', 'Agenda berhasil dihapus.', 'success');
          }
      });
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setSelectedDate(null);
  };

  return {
      state: { currentDate, selectedDate, isModalOpen, formData },
      computed: { monthData, selectedDayEvents },
      handlers: { changeMonth, handleDayClick, handleAddEvent, handleDeleteEvent, closeModal, setFormData }
  };
};
