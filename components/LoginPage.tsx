import React, { useState } from 'react';

declare const Swal: any;

interface Props {
  onLogin: (email: string) => Promise<void>; // Updated to Promise
  isLoading?: boolean;
}

export const LoginPage: React.FC<Props> = ({ onLogin, isLoading }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      await onLogin(email.trim().toLowerCase());
      setIsSubmitted(true);
    }
  };

  if (isSubmitted && !isLoading) {
      return (
        <div className="min-h-screen bg-background-light flex flex-col justify-center items-center p-4 font-sans">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-200 animate-in fade-in zoom-in duration-500">
                <div className="bg-green-50 size-16 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Cek Email Anda</h2>
                <p className="text-slate-500 text-sm mb-6">
                    Kami telah mengirimkan tautan masuk (Magic Link) ke <strong>{email}</strong>. Silahkan klik tautan tersebut untuk masuk ke aplikasi.
                </p>
                <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary text-sm font-bold hover:underline"
                >
                    Kembali / Ganti Email
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-background-light flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-3xl"></div>
       </div>

       <div className="bg-white p-10 md:p-12 rounded-2xl shadow-xl w-full max-w-[420px] border border-slate-200 relative z-10 animate-in fade-in zoom-in duration-500">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-gradient-to-br from-primary to-blue-600 size-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-5">
               <span className="material-symbols-outlined text-4xl">auto_stories</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SiGuru</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Sistem Administrasi Guru</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Pengguna</label>
              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="nama@sekolah.id"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 placeholder:font-normal bg-slate-50 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
              </div>
              <p className="text-[10px] text-slate-400 pl-1">*Gunakan email aktif. Link login akan dikirim ke email.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Mengirim Link...
                </>
              ) : (
                <>
                  Masuk
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1">
               <span>Belum punya akun?</span> 
               <a 
                 href="#" 
                 className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                 onClick={(e) => { e.preventDefault(); Swal.fire('Info', 'Hubungi Administrator Sekolah untuk pendaftaran akun.', 'info'); }}
               >
                 Hubungi Admin Sekolah
               </a>
             </p>
          </div>
       </div>
       
       <footer className="mt-8 text-center">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">SiGuru &copy; 2026</p>
       </footer>
    </div>
  );
};