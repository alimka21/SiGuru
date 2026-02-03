
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { SystemBlueprint } from './SystemBlueprint';

declare const Swal: any;

interface Props {
  users: User[];
  onAddUser: (email: string, name: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (id: string, name: string) => void;
  onGoToApp: () => void;
  onLogout: () => void;
}

type AdminView = 'USERS' | 'DOCS';

export const AdminPanel: React.FC<Props> = ({ users, onAddUser, onDeleteUser, onUpdateUser, onGoToApp, onLogout }) => {
  const [activeView, setActiveView] = useState<AdminView>('USERS');
  
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
      teachers: users.filter(u => u.role === 'USER').length,
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
    <div className="flex min-h-screen font-sans bg-background-light">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 z-50 shadow-sm">
         <div className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-slate-900 size-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-slate-300">
                  <span className="material-symbols-outlined">admin_panel_settings</span>
               </div>
               <div>
                  <h1 className="text-slate-900 text-base font-bold leading-tight">Admin Panel</h1>
                  <p className="text-slate-500 text-[10px] font-normal mt-0.5">Pusat Kontrol</p>
               </div>
            </div>
         </div>

         {/* Menu */}
         <div className="flex-1 px-6 space-y-1">
            <button 
               onClick={() => setActiveView('USERS')}
               className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${activeView === 'USERS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
               <span className="material-symbols-outlined text-[20px]">group</span>
               <p className="text-sm font-semibold">Database Pengguna</p>
            </button>
            <button 
               onClick={() => setActiveView('DOCS')}
               className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${activeView === 'DOCS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
               <span className="material-symbols-outlined text-[20px]">description</span>
               <p className="text-sm font-semibold">Dokumentasi Sistem</p>
            </button>
         </div>

         {/* Footer Actions */}
         <div className="p-6 border-t border-slate-200 space-y-2">
            <button 
               onClick={onGoToApp}
               className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 w-full text-left transition-colors border border-blue-200"
            >
               <span className="material-symbols-outlined text-[20px]">open_in_new</span>
               <p className="text-sm font-bold">Buka Aplikasi</p>
            </button>
            <button 
               onClick={onLogout}
               className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 w-full text-left transition-colors"
            >
               <span className="material-symbols-outlined text-[20px]">logout</span>
               <p className="text-sm font-bold">Keluar</p>
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
         <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-3 sticky top-0 z-40 h-[72px] shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
               {activeView === 'USERS' ? 'Manajemen Pengguna' : 'Dokumentasi Teknis & Blueprint'}
            </h2>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status System:</span>
               <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                  <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                  Online
               </span>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto bg-background-light p-8 custom-scrollbar">
            
            {/* VIEW: USER MANAGEMENT */}
            {activeView === 'USERS' && (
               <div className="max-w-6xl mx-auto space-y-8">
                  {/* Header & Add Button */}
                  <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                     <div className="space-y-1">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Database Pengguna</h2>
                        <p className="text-slate-500">Kelola akses guru dan administrator dalam sistem.</p>
                     </div>
                     <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-95"
                     >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Tambah Pengguna
                     </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                           <span className="material-symbols-outlined text-2xl">group</span>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pengguna</p>
                           <p className="text-3xl font-extrabold text-slate-900">{stats.total}</p>
                        </div>
                     </div>
                     <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                           <span className="material-symbols-outlined text-2xl">verified_user</span>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Administrator</p>
                           <p className="text-3xl font-extrabold text-slate-900">{stats.admins}</p>
                        </div>
                     </div>
                     <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="bg-orange-50 text-orange-600 p-3 rounded-xl">
                           <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Guru Terdaftar</p>
                           <p className="text-3xl font-extrabold text-slate-900">{stats.teachers}</p>
                        </div>
                     </div>
                  </div>

                  {/* Table Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center">
                        <div className="relative w-full max-w-md">
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
                           <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email Login</th>
                                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                 <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
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
                                          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit border border-green-100">
                                             <span className="size-1.5 rounded-full bg-green-500"></span> Aktif
                                          </span>
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
            )}

            {/* VIEW: DOCUMENTATION (Moved from Main App) */}
            {activeView === 'DOCS' && (
               <SystemBlueprint />
            )}

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
