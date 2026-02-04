
import React from 'react';
import { User, SchoolLevel, TeacherRole } from '../types';
import { RegisterData } from './LoginPage';
import { useAdminLogic } from '../hooks/useAdminLogic';

interface Props {
  users: User[];
  onAddUser: (data: RegisterData) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (id: string, data: RegisterData) => void;
  onApproveUser: (id: string) => void; 
  onRejectUser: (id: string) => void; 
  onGoToApp: () => void;
  onLogout: () => void;
  waNumber: string;
  onUpdateWaNumber: (num: string) => void;
}

export const AdminPanel: React.FC<Props> = (props) => {
  // Call Custom Hook to get Logic and State
  const { 
    state, 
    setters, 
    computed, 
    handlers 
  } = useAdminLogic({
    users: props.users,
    waNumber: props.waNumber,
    onAddUser: props.onAddUser,
    onUpdateUser: props.onUpdateUser,
    onDeleteUser: props.onDeleteUser,
    onUpdateWaNumber: props.onUpdateWaNumber
  });

  const { stats, filteredUsers } = computed;
  const { isModalOpen, editingUser, userTab, formData, tempWaNumber, searchQuery } = state;

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      {/* Header Navigation */}
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
                  onClick={props.onGoToApp}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-bold border border-transparent hover:border-white/20"
               >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Buka Aplikasi
               </button>
               <div className="h-6 w-px bg-white/20"></div>
               <button 
                  onClick={props.onLogout}
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
            
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Database Pengguna</h2>
                <p className="text-slate-500">Kelola akses guru dan statistik sistem secara real-time.</p>
                </div>
                <button 
                onClick={() => handlers.handleOpenModal()}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Tambah Pengguna Manual
                </button>
            </div>

            {/* SETTINGS SECTION (WA) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">chat</span>
                    Konfigurasi Kontak Bantuan (Lupa Password)
                </h3>
                <div className="flex items-end gap-4 max-w-xl">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nomor WhatsApp Admin</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+</span>
                            <input 
                                type="text"
                                value={tempWaNumber}
                                onChange={(e) => setters.setTempWaNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full pl-6 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-green-500"
                                placeholder="628xxxxxxxx"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400">Gunakan format internasional tanpa '+'. Contoh: 6282335454864</p>
                    </div>
                    <button 
                        onClick={handlers.handleSaveSettings}
                        className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors mb-5"
                    >
                        Simpan
                    </button>
                </div>
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
                    <p className="text-xs text-slate-400">Semua akun (Aktif & Pending)</p>
                </div>

                {/* Pending Users Alert */}
                <div className={`bg-white border p-6 rounded-2xl shadow-sm flex flex-col gap-2 ${stats.pending > 0 ? 'border-orange-200 ring-2 ring-orange-100' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Menunggu Verifikasi</span>
                        <div className="bg-orange-50 text-orange-600 p-2 rounded-lg"><span className="material-symbols-outlined">person_search</span></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">{stats.pending}</p>
                    <p className="text-xs text-slate-400">Calon pengguna perlu persetujuan</p>
                </div>

                {/* Role Breakdown */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                         <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Guru Aktif</span>
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
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                         <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Distribusi Jenjang</span>
                         <div className="bg-green-50 text-green-600 p-2 rounded-lg"><span className="material-symbols-outlined">school</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 rounded p-1">
                             <p className="text-lg font-bold text-slate-900">{stats.sd}</p>
                             <p className="text-[10px] font-bold text-slate-500">SD</p>
                        </div>
                        <div className="bg-slate-50 rounded p-1">
                             <p className="text-lg font-bold text-slate-900">{stats.smp}</p>
                             <p className="text-[10px] font-bold text-slate-500">SMP</p>
                        </div>
                        <div className="bg-slate-50 rounded p-1">
                             <p className="text-lg font-bold text-slate-900">{stats.sma}</p>
                             <p className="text-[10px] font-bold text-slate-500">SMA</p>
                        </div>
                        <div className="bg-slate-50 rounded p-1">
                             <p className="text-lg font-bold text-slate-900">{stats.smk}</p>
                             <p className="text-[10px] font-bold text-slate-500">SMK</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200">
                    <div className="flex px-6 pt-4 gap-6">
                        <button 
                            onClick={() => setters.setUserTab('ACTIVE')}
                            className={`pb-4 text-sm font-bold transition-all border-b-2 ${userTab === 'ACTIVE' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Pengguna Aktif
                        </button>
                        <button 
                            onClick={() => setters.setUserTab('PENDING')}
                            className={`pb-4 text-sm font-bold transition-all border-b-2 relative ${userTab === 'PENDING' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Calon Pengguna
                            {stats.pending > 0 && <span className="ml-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pending}</span>}
                        </button>
                    </div>
                </div>

                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 ml-2">
                        {userTab === 'ACTIVE' ? 'Daftar Guru Terdaftar' : 'Permintaan Akses Baru'}
                    </h3>
                    <div className="relative w-full max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                        <input 
                            type="text" 
                            placeholder="Cari nama atau email..." 
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-full focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400 bg-white"
                            value={searchQuery}
                            onChange={(e) => setters.setSearchQuery(e.target.value)}
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-yellow-50 text-yellow-700 border-l border-r border-yellow-200">Password</th>
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
                                {/* PASSWORD COLUMN */}
                                <td className="px-6 py-4 bg-yellow-50/30 border-l border-r border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                                            {user.password || '-'}
                                        </code>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {/* Action Buttons Logic */}
                                    {user.role !== 'ADMIN' && (
                                        <div className="flex justify-end gap-2">
                                            {userTab === 'PENDING' ? (
                                                <>
                                                    <button onClick={() => props.onApproveUser(user.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm transition-colors" title="Terima User">
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                        Terima
                                                    </button>
                                                    <button onClick={() => props.onRejectUser(user.id)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm transition-colors" title="Tolak User">
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                        Tolak
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handlers.handleOpenModal(user)} className="p-2 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-lg transition-colors shadow-sm" title="Edit">
                                                        <span className="material-symbols-outlined text-sm">edit</span>
                                                    </button>
                                                    <button onClick={() => handlers.handleDelete(user.id)} className="p-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors shadow-sm" title="Hapus">
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                {userTab === 'ACTIVE' 
                                    ? 'Tidak ada pengguna aktif yang ditemukan.' 
                                    : 'Tidak ada calon pengguna yang menunggu verifikasi.'}
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
                  <h3 className="text-xl font-bold text-slate-900">{editingUser ? 'Edit Data Pengguna' : 'Tambah Akses Pengguna'}</h3>
                  <button onClick={() => setters.setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined">close</span>
                  </button>
               </div>
               <form onSubmit={handlers.handleSubmit} className="p-6 space-y-4">
                  
                  {/* Informasi Mode */}
                  {!editingUser && (
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-[11px] text-blue-700 leading-relaxed mb-2">
                        <strong>Info:</strong> Admin membuat akun ini secara manual. User akan langsung berstatus <strong>AKTIF</strong> dan bisa login menggunakan password yang Anda buat di bawah.
                     </div>
                  )}

                  {/* Nama */}
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap <span className="text-red-500">*</span></label>
                     <input 
                        type="text" 
                        required 
                        className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        placeholder="Nama Guru"
                        value={formData.name}
                        onChange={e => setters.setFormData({...formData, name: e.target.value})}
                     />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Email Login <span className="text-red-500">*</span></label>
                     <input 
                        type="email" 
                        required 
                        className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        placeholder="contoh: guru@sekolah.id"
                        value={formData.email}
                        onChange={e => setters.setFormData({...formData, email: e.target.value})}
                     />
                     {editingUser && <p className="text-[10px] text-orange-500 flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[10px]">warning</span> Mengubah email akan mengubah akses login user.</p>}
                  </div>

                  {/* Password (Only for Create Mode in Scenario A) */}
                  {!editingUser && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Buat Password Awal <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            required 
                            className="w-full border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                            placeholder="Minimal 6 karakter"
                            value={formData.password}
                            onChange={e => setters.setFormData({...formData, password: e.target.value})}
                        />
                        <p className="text-[10px] text-slate-400">Berikan password ini kepada guru tersebut.</p>
                      </div>
                  )}

                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Peran</label>
                        <select
                           className="w-full border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50"
                           value={formData.role}
                           onChange={(e) => setters.setFormData({...formData, role: e.target.value as TeacherRole})}
                        >
                           <option value="SUBJECT_TEACHER">Guru Mapel</option>
                           <option value="CLASS_TEACHER">Guru Kelas</option>
                           <option value="ADMIN">Admin</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Jenjang</label>
                        <select
                           className="w-full border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50"
                           value={formData.level}
                           onChange={(e) => setters.setFormData({...formData, level: e.target.value as SchoolLevel})}
                        >
                           <option value="SD">SD</option>
                           <option value="SMP">SMP</option>
                           <option value="SMA">SMA</option>
                           <option value="SMK">SMK</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setters.setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
                     <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-colors">
                         {editingUser ? 'Update Data' : 'Buat User'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
