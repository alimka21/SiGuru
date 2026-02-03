
import React, { useState } from 'react';
import { TeacherRole, SchoolLevel } from '../types';

declare const Swal: any;

// Interfaces for form data
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: TeacherRole;
  level: SchoolLevel;
}

interface Props {
  onLogin: (data: LoginData) => Promise<void>;
  onRegister: (data: RegisterData) => Promise<void>;
  isLoading?: boolean;
}

type AuthMode = 'LOGIN' | 'REGISTER';

// Helper for Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

export const LoginPage: React.FC<Props> = ({ onLogin, onRegister, isLoading }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);

  // Login State
  const [loginForm, setLoginForm] = useState<LoginData>({ email: '', password: '' });

  // Register State
  const [registerForm, setRegisterForm] = useState<RegisterData>({
      email: '',
      password: '',
      name: '',
      role: 'SUBJECT_TEACHER', // Default
      level: 'SMA' // Default fallback
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      await onLogin(loginForm);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.email && registerForm.password && registerForm.name) {
      // Validate Password Length
      if (registerForm.password.length < 6) {
          Swal.fire('Error', 'Password minimal 6 karakter.', 'error');
          return;
      }
      await onRegister(registerForm);
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-3xl"></div>
       </div>

       <div className="bg-white p-10 md:p-12 rounded-2xl shadow-xl w-full max-w-[450px] border border-slate-200 relative z-10 animate-in fade-in zoom-in duration-500">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="bg-gradient-to-br from-primary to-blue-600 size-14 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-4">
               <span className="material-symbols-outlined text-3xl">auto_stories</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SiGuru</h1>
            <p className="text-slate-500 text-sm font-medium">Sistem Administrasi Guru</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
              <button 
                onClick={() => setMode('LOGIN')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Masuk
              </button>
              <button 
                onClick={() => setMode('REGISTER')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Daftar
              </button>
          </div>

          {mode === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 focus:bg-white"
                        placeholder="contoh@sekolah.id"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 focus:bg-white pr-10"
                            placeholder="••••••••"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        />
                         <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Memproses...' : 'Masuk ke Aplikasi'}
                </button>
              </form>
          ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Lengkap</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 focus:bg-white"
                        placeholder="Nama Guru"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({...registerForm, name: toTitleCase(e.target.value)})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 focus:bg-white"
                        placeholder="email@sekolah.id"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 focus:bg-white pr-10"
                            placeholder="••••••••"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        />
                         <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Peran Guru</label>
                        <select
                            className="w-full px-3 py-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 focus:bg-white cursor-pointer"
                            value={registerForm.role}
                            onChange={(e) => setRegisterForm({...registerForm, role: e.target.value as TeacherRole})}
                        >
                            <option value="SUBJECT_TEACHER">Guru Mapel</option>
                            <option value="CLASS_TEACHER">Guru Kelas</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Jenjang</label>
                        <select
                            className="w-full px-3 py-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 focus:bg-white cursor-pointer"
                            value={registerForm.level}
                            onChange={(e) => setRegisterForm({...registerForm, level: e.target.value as SchoolLevel})}
                        >
                            <option value="SD">SD/MI Sederajat</option>
                            <option value="SMP">SMP/MTs Sederajat</option>
                            <option value="SMA">SMA/SMK/MA Sederajat</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Mendaftarkan...' : 'Buat Akun Baru'}
                </button>
              </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             {mode === 'LOGIN' ? (
                 <p className="text-xs text-slate-400">
                    Lupa password? Hubungi Admin Sekolah.
                 </p>
             ) : (
                 <p className="text-xs text-slate-400">
                    Pastikan data diri sesuai dengan SK tugas.
                 </p>
             )}
          </div>
       </div>
       
       <footer className="mt-8 text-center">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">SiGuru &copy; 2026</p>
       </footer>
    </div>
  );
};
