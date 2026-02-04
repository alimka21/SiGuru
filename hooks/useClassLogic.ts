
import { useState, useMemo } from 'react';
import { ClassInfo, IdentityData } from '../types';

declare const Swal: any;

const ALL_PHASES = [
    { label: "Fase A (Kelas 1-2)", level: "SD" },
    { label: "Fase B (Kelas 3-4)", level: "SD" },
    { label: "Fase C (Kelas 5-6)", level: "SD" },
    { label: "Fase D (Kelas 7-9)", level: "SMP" },
    { label: "Fase E (Kelas 10)", level: "SMA" }, // Also SMK
    { label: "Fase F (Kelas 11-12)", level: "SMA" } // Also SMK
];

interface UseClassLogicProps {
  identity: IdentityData;
  classes: ClassInfo[];
  onUpdateClasses: (classes: ClassInfo[]) => void;
}

export const useClassLogic = ({ identity, classes, onUpdateClasses }: UseClassLogicProps) => {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- COMPUTED ---
  const availablePhases = useMemo(() => {
      if (identity.level === 'SMK') {
          return ALL_PHASES.filter(p => p.level === 'SMA'); // SMK uses E and F too
      }
      return ALL_PHASES.filter(p => p.level === identity.level);
  }, [identity.level]);

  // Default value logic
  const defaultLevel = availablePhases.length > 0 ? availablePhases[0].label : '';

  const [formData, setFormData] = useState({
      name: '',
      level: defaultLevel,
  });

  // --- HANDLERS ---

  const handleOpenModal = (cls?: ClassInfo) => {
      if (cls) {
          setEditingId(cls.id);
          setFormData({
              name: cls.name,
              level: cls.level,
          });
      } else {
          setEditingId(null);
          setFormData({ name: '', level: defaultLevel });
      }
      setIsModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (editingId) {
          // Update
          const updatedClasses = classes.map(c => c.id === editingId ? { 
              ...c, 
              ...formData,
          } : c);
          onUpdateClasses(updatedClasses);
      } else {
          // Add
          const newClass: ClassInfo = {
              id: Date.now().toString(),
              name: formData.name,
              level: formData.level,
              studentCount: 0, // Initial value, but display uses dynamic calc
          };
          onUpdateClasses([...classes, newClass]);
      }
      setIsModalOpen(false);
  };

  const handleDeleteClass = (id: string) => {
      Swal.fire({
          title: 'Hapus Kelas?',
          text: "Data siswa yang terhubung mungkin akan terpengaruh!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Ya, hapus!',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateClasses(classes.filter(c => c.id !== id));
              Swal.fire(
                  'Terhapus!',
                  'Data kelas berhasil dihapus.',
                  'success'
              )
          }
      });
  };

  return {
    state: { isModalOpen, editingId, formData },
    setters: { setIsModalOpen, setFormData },
    computed: { availablePhases },
    handlers: { handleOpenModal, handleSaveClass, handleDeleteClass }
  };
};
