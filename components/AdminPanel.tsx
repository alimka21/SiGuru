
import React, { useState, useMemo } from 'react';
import { User, SchoolLevel } from '../types';

declare const Swal: any;

interface Props {
  users: User[];
  onAddUser: (email: string, name: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (id: string, name: string) => void;
  onGoToApp: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<Props> = ({ users, onAddUser, onDeleteUser, onUpdateUser, onGoToApp, onLogout }) => {
  // User Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ email: '', name: '' });

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      // Role Stats
      classTeachers: users.filter(u => u.role === 'CLASS_TEACHER').length,
      subjectTeachers: users.filter(u => u.role === 'SUBJECT_TEACHER').length,
      // Level Stats (Assuming user.level is populated)
      sd: users.filter(u => u.level === 'SD').length,
      smp: users.filter(u => u.level === 'SMP').length,
      sma: users.filter(u => u.level === 'SMA').length,
      smk: users.filter(u => u.level === 'SMK').length,
    };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email, name: user.name });
    } else {
      setEditingUser(null);
      setFormData({ email: '', name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, formData.name);
    } else {
      onAddUser(formData.email.toLowerCase(), formData.name);
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
        Swal.fire('Terhapus!', 'Pengguna berhasil dihapus.', 'success');
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      {/* Header Navigation (Replaces Sidebar) */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="bg-white/10 size-10 rounded-lg flex items-center justify-center text-white border border-white/20">
                  <span className="material-symbols-outlined">admin_panel_settings</span>
               </div>
               <div>
                  <h1 className="text-white text-base font-bold leading-tight">Admin Panel</h1>
                  <p className="text-slate-400 text-[10px] font-normal uppercase tracking-wider">Pusat Kontrol</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                  onClick={onGoToApp}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-bold border border-transparent hover:border-white/20"
               >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Buka Aplikasi
               </button>
               <div className="h-6 w-px bg-white/20"></div>
               <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors text-sm font-bold"
               >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Keluar
               </button>
            </div>
         </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar py-8 px-6">
         <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Database Pengguna</h2>
                <p className="text-slate-500">Kelola akses guru dan statistik sistem secara real-time.</p>
                </div>
                <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Tambah Pengguna Manual
                </button>
            </div>

            {/* STATISTICS DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total User</span>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><span className="material-symbols-outlined">group</span></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">{stats.total}</p>
                    <p className="text-xs text-slate-400">Akun terdaftar dalam sistem</p>
                </div>

                {/* Role Breakdown */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                         <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Distribusi Peran</span>
                         <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><span className="material-symbols-outlined">badge</span></div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Guru Kelas</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{stats.classTeachers}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Guru Mapel</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{stats.subjectTeachers}</span>
                        </div>
                    </div>
                </div>

                {/* Level Breakdown */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4 col-span-2">
                    <div className="flex justify-between items-start">
                         <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Distribusi Jenjang Sekolah</span>
                         <div className="bg-orange-50 text-orange-600 p-2 rounded-lg"><span className="material-symbols-outlined">school</span></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                             <p className="text-2xl font-bold text-slate-900">{stats.sd}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">SD</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                             <p className="text-2xl font-bold text-slate-900">{stats.smp}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">SMP</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                             <p className="text-2xl font-bold text-slate-900">{stats.sma}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">SMA</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                             <p className="text-2xl font-bold text-slate-900">{stats.smk}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">SMK</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 ml-2">Daftar Pengguna</h3>
                    <div className="relative w-full max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                        <input 
                            type="text" 
                            placeholder="Cari nama atau email..." 
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-full focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email Login</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenjang</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-800">{user.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                     {user.role !== 'ADMIN' ? (
                                        <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                                            {user.level || '-'}
                                        </span>
                                     ) : (
                                         <span className="text-xs text-slate-300">-</span>
                                     )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {user.role !== 'ADMIN' && (
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(user)} className="p-2 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-lg transition-colors shadow-sm" title="Edit">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors shadow-sm" title="Hapus">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                                Tidak ada pengguna yang ditemukan.
                            </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
         </div>
      </main>

      {/* User Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-900">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined">close</span>
                  </button>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Email Login <span className="text-red-500">*</span></label>
                     <input 
                        type="email" 
                        required 
                        disabled={!!editingUser}
                        className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-white disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="contoh: guru@sekolah.id"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                     />
                     {editingUser && <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">lock</span> Email tidak dapat diubah setelah dibuat.</p>}
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Nama Guru <span className="text-red-500">*</span></label>
                     <input 
                        type="text" 
                        required 
                        className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        placeholder="Nama Lengkap"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                     />
                  </div>
                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
                     <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-colors">Simpan Data</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
