
import { useState, useMemo } from 'react';
import { User, TeacherRole, SchoolLevel } from '../types';
import { RegisterData } from '../components/LoginPage';

declare const Swal: any;

interface UseAdminLogicProps {
  users: User[];
  waNumber: string;
  onAddUser: (data: RegisterData) => void;
  onUpdateUser: (id: string, data: RegisterData) => void;
  onDeleteUser: (id: string) => void;
  onUpdateWaNumber: (num: string) => void;
}

export const useAdminLogic = ({
  users,
  waNumber,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateWaNumber
}: UseAdminLogicProps) => {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTab, setUserTab] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [tempWaNumber, setTempWaNumber] = useState(waNumber);
  
  // Form Data State
  const [formData, setFormData] = useState<RegisterData>({ 
      email: '', name: '', password: '', role: 'SUBJECT_TEACHER', level: 'SMA' 
  });

  // --- DERIVED STATE (MEMOS) ---
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      pending: users.filter(u => !u.isActive).length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      classTeachers: users.filter(u => u.role === 'CLASS_TEACHER' && u.isActive).length,
      subjectTeachers: users.filter(u => u.role === 'SUBJECT_TEACHER' && u.isActive).length,
      sd: users.filter(u => u.level === 'SD' && u.isActive).length,
      smp: users.filter(u => u.level === 'SMP' && u.isActive).length,
      sma: users.filter(u => u.level === 'SMA' && u.isActive).length,
      smk: users.filter(u => u.level === 'SMK' && u.isActive).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const byTab = users.filter(u => userTab === 'ACTIVE' ? u.isActive : !u.isActive);
    return byTab.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery, userTab]);

  // --- HANDLERS ---

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
          email: user.email, 
          name: user.name, 
          password: '', 
          role: user.role, 
          level: user.level || 'SMA' 
      });
    } else {
      setEditingUser(null);
      setFormData({ email: '', name: '', password: '', role: 'SUBJECT_TEACHER', level: 'SMA' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, formData);
    } else {
      if (!formData.email || !formData.name || !formData.password) {
          Swal.fire('Error', 'Nama, Email, dan Password wajib diisi.', 'error');
          return;
      }
      if (formData.password.length < 6) {
          Swal.fire('Error', 'Password minimal 6 karakter.', 'error');
          return;
      }
      onAddUser(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Hapus Pengguna?',
      text: "Data administrasi pengguna ini akan hilang permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result: any) => {
      if (result.isConfirmed) {
        onDeleteUser(id);
      }
    });
  };

  const handleSaveSettings = () => {
      onUpdateWaNumber(tempWaNumber);
  };

  return {
    state: {
      isModalOpen,
      editingUser,
      searchQuery,
      userTab,
      tempWaNumber,
      formData
    },
    setters: {
      setIsModalOpen,
      setSearchQuery,
      setUserTab,
      setTempWaNumber,
      setFormData
    },
    computed: {
      stats,
      filteredUsers
    },
    handlers: {
      handleOpenModal,
      handleSubmit,
      handleDelete,
      handleSaveSettings
    }
  };
};
