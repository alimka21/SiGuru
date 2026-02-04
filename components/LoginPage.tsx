
import React, { useState } from 'react';
import { TeacherRole, SchoolLevel } from '../types';
import { supabase } from '../utils/supabase'; // Import supabase directly for validation check

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
  onDemoLogin?: () => void;
  isLoading?: boolean;
  isConfigured?: boolean;
  adminWaNumber: string; // New Prop for Dynamic WA
}

type AuthMode = 'LOGIN' | 'REGISTER';

// Helper for Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

export const LoginPage: React.FC<Props> = ({ onLogin, onRegister, onDemoLogin, isLoading, isConfigured = true, adminWaNumber }) => {
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
      const email = loginForm.email.trim();
      
      // Attempt Login
      try {
         await onLogin({ email, password: loginForm.password });
      } catch (error: any) {
         // This catch block might not be reached if onLogin swallows error, 
         // but if it propagates:
         console.error(error);
      }
      
      // Note: We can't easily detect "User exists in Teachers but not Auth" here inside the submit handler
      // because onLogin is async void. The parent component handles the alert.
      // However, we can improve the UX by checking the table if login fails.
      // Let's rely on the Parent (App.tsx) handling standard errors, but maybe check here if needed?
      // Actually, let's keep it simple: Standard error in App.tsx is fine, 
      // but let's add a helper function here to check "Pre-registered" status if login fails.
    }
  };

  const checkPreRegisteredStatus = async (email: string) => {
      // Helper to give better feedback
      const { data } = await supabase.from('teachers').select('id, is_active').eq('email', email).single();
      if (data && data.is_active) {
          Swal.fire({
              title: 'Akun Belum Diaktivasi',
              html: `Email <b>${email}</b> sudah didaftarkan oleh Admin.<br/>Silakan pindah ke tab <strong>"Daftar"</strong> dan buat password baru Anda untuk mengaktifkan akun.`,
              icon: 'info',
              confirmButtonText: 'Ke Menu Daftar'
          }).then((res: any) => {
              if(res.isConfirmed) {
                  setMode('REGISTER');
                  setRegisterForm(prev => ({...prev, email: email}));
              }
          });
      }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.email && registerForm.password && registerForm.name) {
      // Validate Password Length
      if (registerForm.password.length < 6) {
          Swal.fire('Error', 'Password minimal 6 karakter.', 'error');
          return;
      }
      await onRegister({
          ...registerForm,
          email: registerForm.email.trim()
      });
    }
  };

  const handleForgotPassword = () => {
    Swal.fire({
      title: 'Lupa Kata Sandi?',
      html: `
        <p class="text-sm text-slate-500 mb-4">Silahkan isi data berikut untuk menghubungi Admin via WhatsApp.</p>
        <input id="swal-input1" class="swal2-input" placeholder="Nama Lengkap Anda">
        <input id="swal-input2" class="swal2-input" placeholder="Email Terdaftar">
      `,
      focusConfirm: false,
      confirmButtonText: 'Kirim ke WhatsApp',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement).value,
          (document.getElementById('swal-input2') as HTMLInputElement).value
        ]
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        const [name, email] = result.value;
        if (!name || !email) {
            Swal.fire('Error', 'Nama dan Email harus diisi!', 'error');
            return;
        }

        const message = `Halo Admin, saya *${name}* (%0AEmail: ${email})%0A%0ASaya lupa password akun SiGuru saya. Mohon bantuannya untuk reset password. Terima kasih.`;
        const waLink = `https://wa.me/${adminWaNumber}?text=${message}`;
        window.open(waLink, '_blank');
      }
    });
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

          {!isConfigured && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-center animate-pulse">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Mode Offline</p>
                  <p className="text-xs text-orange-600 mb-3">Database belum terkonfigurasi.</p>
                  <button 
                    onClick={onDemoLogin}
                    className="w-full py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm"
                  >
                      Masuk sebagai Guru Demo
                  </button>
              </div>
          )}

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
                        autoCapitalize="none"
                        autoComplete="email"
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
                
                <div className="text-center mt-2 space-y-2">
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                        Lupa Sandi?
                    </button>
                    {/* Fallback Check Trigger for Users confused about registration */}
                    <div>
                         <button 
                            type="button"
                            onClick={() => checkPreRegisteredStatus(loginForm.email)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                        >
                            Saya sudah didaftarkan admin tapi gagal login?
                        </button>
                    </div>
                </div>
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
                        autoCapitalize="none"
                        autoComplete="email"
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
                    Belum punya akun? Klik tab <strong>Daftar</strong> di atas.
                 </p>
             ) : (
                 <p className="text-xs text-slate-400">
                    Pastikan data diri sesuai dengan SK tugas.
                 </p>
             )}
          </div>
       </div>
       
       <footer className="mt-8 text-center flex flex-col items-center gap-1">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">SiGuru &copy; 2026</p>
       </footer>
    </div>
  );
};
