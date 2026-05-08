import React from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-light font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Si<span className="text-primary">Guru</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login?tab=register')}
              className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-primary transition-colors hidden sm:block"
            >
              Daftar
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-full hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
            >
              Masuk / Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-y-0 w-full h-full pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.4 }}></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6 animate-in slide-in-from-bottom flex flex-row">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Pembaruan: Kini Mendukung Evaluasi AI
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-3xl">
              Fokus Mengajar, Biar Kami yang Urus <span className="text-primary">Administrasi</span>.
            </h1>
            
            <p className="max-w-2xl text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
              SiGuru adalah asisten digital cerdas yang dirancang khusus untuk menyederhanakan pengelolaan nilai, absensi, jurnal, dan pencapaian siswa Anda dalam satu platform yang bisa diandalkan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 text-base font-bold text-white bg-primary rounded-full hover:bg-blue-600 transition-all shadow-lg shadow-primary/30 flex items-center gap-2 hover:-translate-y-0.5"
              >
                Mulai Gunakan Gratis
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <a href="#fitur" className="px-8 py-3.5 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-2">
                Pelajari Fitur
              </a>
            </div>
            
            {/* Dashboard Mockup (Visualizer) */}
            <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-200/60 bg-white/50 p-2 shadow-2xl backdrop-blur-sm sm:p-4 perspective-1000 hidden md:block" style={{ transform: 'perspective(1200px) rotateX(4deg)' }}>
                <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-background-light flex flex-col h-[400px]">
                    {/* Mockup Header */}
                    <div className="h-12 bg-white border-b border-slate-100 flex items-center px-4 gap-4">
                        <div className="flex gap-1.5">
                            <div className="size-3 rounded-full bg-slate-200"></div>
                            <div className="size-3 rounded-full bg-slate-200"></div>
                            <div className="size-3 rounded-full bg-slate-200"></div>
                        </div>
                        <div className="h-4 w-48 bg-slate-100 rounded-md mx-auto"></div>
                    </div>
                    {/* Mockup Body */}
                    <div className="flex flex-1 overflow-hidden p-4 gap-4">
                        <div className="w-56 bg-white rounded-lg border border-slate-100 p-3 hidden lg:flex flex-col gap-3">
                             <div className="h-10 bg-blue-50 rounded w-full flex items-center px-3" ><div className="h-4 w-4 rounded-sm bg-blue-200 mr-2"></div> <div className="h-3 w-20 bg-blue-200 rounded-sm"></div></div>
                             <div className="h-8 bg-slate-50 rounded w-full flex items-center px-3"><div className="h-3 w-4 rounded-sm bg-slate-200 mr-2"></div> <div className="h-2 w-16 bg-slate-200 rounded-sm"></div></div>
                             <div className="h-8 bg-slate-50 rounded w-full flex items-center px-3"><div className="h-3 w-4 rounded-sm bg-slate-200 mr-2"></div> <div className="h-2 w-24 bg-slate-200 rounded-sm"></div></div>
                             <div className="h-8 bg-slate-50 rounded w-full flex items-center px-3"><div className="h-3 w-4 rounded-sm bg-slate-200 mr-2"></div> <div className="h-2 w-20 bg-slate-200 rounded-sm"></div></div>
                        </div>
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="flex-1 h-28 bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
                                    <div className="h-3 w-24 bg-slate-100 rounded-sm"></div>
                                    <div className="h-8 w-16 bg-slate-200 rounded-md"></div>
                                </div>
                                <div className="flex-1 h-28 bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
                                    <div className="h-3 w-24 bg-slate-100 rounded-sm"></div>
                                    <div className="h-8 w-16 bg-slate-200 rounded-md"></div>
                                </div>
                                <div className="flex-1 h-28 bg-primary/5 border border-primary/20 rounded-lg shadow-sm p-4 flex flex-col justify-between">
                                    <div className="h-3 w-24 bg-primary/20 rounded-sm"></div>
                                    <div className="h-8 w-16 bg-primary/30 rounded-md"></div>
                                </div>
                            </div>
                            <div className="flex-1 bg-white rounded-lg border border-slate-100 shadow-sm p-4">
                                <div className="h-4 w-48 bg-slate-100 rounded-sm mb-6"></div>
                                <div className="h-8 w-full bg-slate-50 rounded-sm mb-2"></div>
                                <div className="h-8 w-full bg-slate-50 rounded-sm mb-2"></div>
                                <div className="h-8 w-full bg-slate-50 rounded-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* Keunggulan Section */}
        <section className="py-20 bg-background-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-2">Kenapa Pilih SiGuru?</h2>
               <h3 className="text-3xl font-extrabold text-slate-900">Keunggulan Sistem Kami</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="size-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">offline_bolt</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">Anti Kehilangan Data</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Dilengkapi dengan Session Persistence. Data form Anda tidak akan hilang saat tidak sengaja tersapu resfresh atau ketika internet tidak stabil.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="size-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">magic_button</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">Dukungan AI Terintegrasi</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Gunakan fitur CP (Capaian Pembelajaran) generator yang dibantu AI Google Gemini untuk breakdown kompetensi siswa.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="size-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">table_view</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">Rekapitulasi Instan</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Pengolahan nilai dan presensi berbasis sistem matriks modern. Langsung bisa di-export ke Excel yang siap cetak per semester.
                    </p>
                </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="fitur" className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Satu Aplikasi, Semua Terkendali</h2>
               <p className="text-lg text-slate-600 max-w-2xl mx-auto">Kami mengemas segala keperluan administrasi harian sampai semesteran dalam antarmuka yang intuitif layaknya sistem spreadsheet.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                  <div className="space-y-8">
                     {[
                         { icon: 'checklist', title: 'Sinkronisasi Kehadiran', desc: 'Catat absensi tiap kelas. Sistem otomatis menghitung persentase kehadiran sebagai bagian dari rekap akhir.', color: 'text-rose-500', bg: 'bg-rose-100' },
                         { icon: 'grading', title: 'Grading Sheet Ergonomis', desc: 'Panel input nilai dengan dukungan per tujuan pembelajaran. Sangat ringan walau memuat banyak siswa (Fast Matrix Update).', color: 'text-indigo-500', bg: 'bg-indigo-100' },
                         { icon: 'history_edu', title: 'Buku Jurnal Harian', desc: 'Isi jurnal kegiatan yang langsung terhubung dengan CP/TP dan status kehadiran seluruh kelas per tanggal.', color: 'text-orange-500', bg: 'bg-orange-100' },
                         { icon: 'download', title: 'Ekspor Tanpa Ribet', desc: 'Hanya 1 klik untuk ekspor semua format pelaporan akhir ke Excel dengan desain template yang rapi.', color: 'text-teal-500', bg: 'bg-teal-100' }
                     ].map((feat, i) => (
                         <div key={i} className="flex gap-4">
                             <div className={`mt-1 size-12 rounded-full flex items-center justify-center shrink-0 ${feat.bg} ${feat.color}`}>
                                 <span className="material-symbols-outlined text-[24px]">{feat.icon}</span>
                             </div>
                             <div>
                                 <h4 className="text-lg font-bold text-slate-800 mb-1">{feat.title}</h4>
                                 <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
                             </div>
                         </div>
                     ))}
                  </div>
              </div>
              <div className="bg-background-light p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="bg-slate-800 rounded-xl overflow-hidden shadow-2xl relative z-10 border border-slate-700">
                      <div className="h-8 bg-slate-900 border-b border-slate-700 flex items-center px-4">
                          <div className="flex gap-1.5">
                              <div className="size-3 rounded-full bg-red-400"></div>
                              <div className="size-3 rounded-full bg-amber-400"></div>
                              <div className="size-3 rounded-full bg-green-400"></div>
                          </div>
                      </div>
                      <div className="p-5 space-y-4">
                          <div className="h-4 bg-slate-700/80 rounded w-1/3"></div>
                          <div className="h-10 bg-slate-700/60 rounded w-full border border-slate-600"></div>
                          <div className="flex gap-3">
                              <div className="h-24 bg-slate-700/60 border border-slate-600 rounded w-1/2"></div>
                              <div className="h-24 bg-primary/20 border border-primary/30 rounded w-1/2 relative overflow-hidden">
                                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent"></div>
                              </div>
                          </div>
                          <div className="h-32 bg-slate-700/60 border border-slate-600 rounded w-full flex flex-col gap-2 p-3">
                             <div className="h-3 bg-slate-600 rounded w-full"></div>
                             <div className="h-3 bg-slate-600 rounded w-full"></div>
                             <div className="h-3 bg-slate-600 rounded w-3/4"></div>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83-54.627 54.627-.83-.83L54.627 0zM26.965 0l.83.83-26.965 26.965-.83-.83L26.965 0z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E')] opacity-50"></div>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">Siap Mengurangi Beban Administrasi Anda?</h2>
                <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Akses kapan saja dimana saja melalui Web, daftar sekarang dan rapihkan data kelas Anda menjadi lebih terstruktur hari ini.</p>
                <div className="flex justify-center gap-4 flex-col sm:flex-row">
                     <button 
                        onClick={() => navigate('/login?tab=register')}
                        className="px-8 py-4 text-base font-bold text-primary bg-white rounded-full hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95"
                      >
                        Daftar Pendidik
                     </button>
                     <button 
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 text-base font-bold text-white bg-blue-600 border border-blue-500 rounded-full hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                      >
                        Masuk Aplikasi
                     </button>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-2">
                <div className="size-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Si<span className="text-primary">Guru</span></span>
             </div>
             <p className="text-sm">
                 &copy; {new Date().getFullYear()} Administrasi Guru Pintar. Dibuat dengan presisi tinggi.
             </p>
        </div>
      </footer>
    </div>
  );
}
