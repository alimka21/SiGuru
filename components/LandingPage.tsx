import React from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  // Load WhatsApp support number from local storage or use default
  const adminWaNumber = localStorage.getItem('app_adminWaNumber') 
    ? JSON.parse(localStorage.getItem('app_adminWaNumber')!) 
    : '6282335454864';

  const benefits = [
    { icon: 'schedule', text: 'Hemat Waktu' },
    { icon: 'assignment', text: 'Administrasi Lebih Mudah' },
    { icon: 'gpp_good', text: 'Data Aman & Terpercaya' },
    { icon: 'devices', text: 'Akses Kapan Saja, di Mana Saja' }
  ];

  const packages = [
    {
      name: "BASIC",
      icon: "yard",
      originalPrice: "Rp 30.000",
      promoPrice: "Rp 15.000",
      duration: "1 Bulan",
      saving: "Hemat Rp15.000",
      monthlyRate: null,
      subtext: "Cocok untuk kebutuhan dasar administrasi Anda.",
      tag: null,
      colorClass: {
        border: "border-emerald-200 hover:border-emerald-500",
        bg: "bg-emerald-50/50",
        accent: "text-emerald-600 bg-emerald-50",
        button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white",
        highlight: "emerald",
        iconColor: "text-emerald-600 bg-emerald-50",
      }
    },
    {
      name: "TRIWULAN",
      icon: "rocket_launch",
      originalPrice: "Rp 75.000",
      promoPrice: "Rp 39.000",
      duration: "3 Bulan",
      saving: "Hemat Rp36.000",
      monthlyRate: "Rp13.000/bulan",
      subtext: "Fitur lengkap dengan masa aktif 3 bulan penuh.",
      tag: "PAKET FAVORIT",
      colorClass: {
        border: "border-blue-200 hover:border-blue-500 shadow-blue-100 shadow-lg",
        bg: "bg-blue-50/50",
        accent: "text-blue-600 bg-blue-50",
        button: "bg-primary hover:bg-blue-600 shadow-blue-200 text-white",
        highlight: "blue",
        iconColor: "text-blue-600 bg-blue-50",
      }
    },
    {
      name: "SEMESTER",
      icon: "auto_stories",
      originalPrice: "Rp 150.000",
      promoPrice: "Rp 69.000",
      duration: "6 Bulan",
      saving: "Hemat Rp81.000",
      monthlyRate: "Rp11.500/bulan",
      subtext: "Cocok untuk penggunaan semesteran.",
      tag: null,
      colorClass: {
        border: "border-purple-200 hover:border-purple-500",
        bg: "bg-purple-50/50",
        accent: "text-purple-600 bg-purple-50",
        button: "bg-purple-600 hover:bg-purple-700 shadow-purple-200 text-white",
        highlight: "purple",
        iconColor: "text-purple-600 bg-purple-50",
      }
    },
    {
      name: "PREMIUM",
      icon: "emoji_events",
      originalPrice: "Rp 299.000",
      promoPrice: "Rp 109.000",
      duration: "1 Tahun",
      saving: "Hemat Rp190.000",
      monthlyRate: "Rp9.083/bulan",
      subtext: "Akses premium setahun penuh, bebas khawatir.",
      tag: "PAKET PALING HEMAT",
      colorClass: {
        border: "border-orange-200 hover:border-orange-500",
        bg: "bg-orange-50/50",
        accent: "text-orange-600 bg-orange-50",
        button: "bg-orange-600 hover:bg-orange-700 shadow-orange-200 text-white",
        highlight: "orange",
        iconColor: "text-orange-600 bg-orange-50",
      }
    }
  ];

  const pricingFeatures = [
    { icon: 'task_alt', text: 'Semua paket sudah termasuk fitur lengkap SiGuru Pro untuk mendukung kinerja Anda.' },
    { icon: 'support_agent', text: 'Customer Support Siap membantu Anda kapan saja.' },
    { icon: 'phonelink', text: 'Bisa diakses di semua perangkat: Android, iOS, & Web.' }
  ];

  const handleSelectPackage = (pkg: typeof packages[0]) => {
    const text = `Halo Admin SiGuru Pro,%0A%0ASaya ingin berlangganan *Paket ${pkg.name}* (${pkg.duration}) dengan harga promo *${pkg.promoPrice}*.%0A%0AMohon panduannya untuk proses pembayaran dan aktivasi akun. Terima kasih!`;
    const waUrl = `https://wa.me/${adminWaNumber}?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background-light font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Si<span className="text-primary">Guru</span> Pro</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a 
                href="#fitur" 
                onClick={(e) => scrollToSection(e, 'fitur')}
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                Fitur
              </a>
              <a 
                href="#harga" 
                onClick={(e) => scrollToSection(e, 'harga')}
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                Harga &amp; Paket
              </a>
              <a 
                href="https://wa.me/6285210994414" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-emerald-500 text-[18px]">chat</span>
                Hubungi Admin
              </a>
            </nav>
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
              SiGuru Pro adalah asisten digital cerdas yang dirancang khusus untuk menyederhanakan pengelolaan nilai, absensi, jurnal, dan pencapaian siswa Anda dalam satu platform yang bisa diandalkan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 text-base font-bold text-white bg-primary rounded-full hover:bg-blue-600 transition-all shadow-lg shadow-primary/30 flex items-center gap-2 hover:-translate-y-0.5"
              >
                Mulai Gunakan Gratis
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <a 
                href="#fitur" 
                onClick={(e) => scrollToSection(e, 'fitur')}
                className="px-8 py-3.5 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                Pelajari Fitur
              </a>
            </div>
            
            {/* Dashboard Mockup (Visualizer) */}
            <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-200/60 bg-white/50 p-2 shadow-2xl backdrop-blur-sm sm:p-4 perspective-1000 hidden md:block" style={{ transform: 'perspective(1200px) rotateX(3deg)' }}>
                <div className="rounded-xl overflow-hidden border border-slate-150 shadow-sm bg-slate-50 flex h-[580px]">
                    {/* Mockup Sidebar */}
                    <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 text-left h-full">
                        <div className="space-y-5">
                            {/* Logo & Header */}
                            <div className="flex items-center gap-2 px-1">
                                <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xs font-bold text-slate-800 leading-tight">SiGuru Pro</h3>
                                    <p className="text-[9px] text-slate-400 font-medium">App Admin Guru</p>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 text-primary rounded-lg font-bold text-[11px] cursor-pointer">
                                        <span className="material-symbols-outlined text-sm">dashboard</span>
                                        Dashboard
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-1">Master Data</p>
                                    <div className="space-y-0.5">
                                        {[
                                            { icon: 'school', label: 'Master Kelas' },
                                            { icon: 'groups', label: 'Master Siswa' },
                                            { icon: 'calendar_today', label: 'Master Jadwal' },
                                            { icon: 'magic_button', label: 'Generate TP (AI)' },
                                            { icon: 'book', label: 'Kurikulum' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-2 py-1 text-slate-500 hover:bg-slate-50 rounded-md font-medium text-[11px] cursor-pointer">
                                                <span className="material-symbols-outlined text-xs">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-1">Akademik</p>
                                    <div className="space-y-0.5">
                                        {[
                                            { icon: 'edit_note', label: 'Jurnal Guru' },
                                            { icon: 'assessment', label: 'Asesmen / Nilai' },
                                            { icon: 'checklist_rtl', label: 'Presensi' },
                                            { icon: 'calendar_month', label: 'Kalender Pendidikan' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-2 py-1 text-slate-500 hover:bg-slate-50 rounded-md font-medium text-[11px] cursor-pointer">
                                                <span className="material-symbols-outlined text-xs">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-1">Laporan</p>
                                    <div className="space-y-0.5">
                                        {[
                                            { icon: 'summarize', label: 'Rekap Nilai' },
                                            { icon: 'assignment', label: 'Rekap Presensi' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-2 py-1 text-slate-500 hover:bg-slate-50 rounded-md font-medium text-[11px] cursor-pointer">
                                                <span className="material-symbols-outlined text-xs">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User profile at the bottom */}
                        <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                            <div className="size-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                G
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate leading-tight">Nama Guru</p>
                                <p className="text-[9px] text-slate-400 truncate leading-none mt-0.5">contohemail@gmail.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Mockup Main Content Area */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className="h-12 bg-white border-b border-slate-150 flex items-center justify-between px-6 shrink-0">
                            <button className="flex items-center gap-1 bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold transition-all">
                                <span className="material-symbols-outlined text-xs">arrow_back</span>
                                Kembali ke Admin
                            </button>
                            <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[10px] font-bold">
                                <span className="material-symbols-outlined text-xs">logout</span>
                                Logout
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto space-y-6">
                            {/* Super Admin Welcome Banner */}
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="px-2 py-0.5 bg-blue-50 text-primary rounded-full text-[9px] font-bold uppercase tracking-wider border border-blue-100">
                                                SEMESTER 1
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                                                2025/2026
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                            Nama Guru
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                            <span className="font-semibold flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-primary">domain</span> Sekolah
                                            </span>
                                            <span className="text-slate-300">|</span>
                                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[9px] flex items-center gap-0.5">
                                                <span className="material-symbols-outlined text-[11px]">menu_book</span> Guru Mapel
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-[10px] mt-2 max-w-md">
                                            Selamat bertugas! Kelola administrasi pembelajaran, presensi, dan penilaian siswa dengan mudah hari ini.
                                        </p>
                                    </div>

                                    {/* Real-time Clock */}
                                    <div className="text-right bg-white/90 p-3 rounded-xl border border-slate-100 shadow-sm shrink-0">
                                        <div className="text-xl font-black text-slate-800 leading-none tracking-tight font-mono">
                                            16.26 <span className="text-[10px] font-bold text-slate-400 ml-0.5">WITA</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-500 mt-1 flex items-center justify-end gap-1">
                                            <span className="material-symbols-outlined text-[10px]">calendar_month</span>
                                            Sabtu, 4 Juli 2026
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stat Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { title: 'Kelas Aktif', value: '4', sub: 'Kelas Terdaftar', color: 'text-emerald-600', icon: 'school', bg: 'bg-blue-50 text-blue-600' },
                                    { title: 'Total Siswa', value: '124', sub: 'Siswa Terdaftar', color: 'text-slate-500', icon: 'groups', bg: 'bg-orange-50 text-orange-600' },
                                    { title: 'Rata-rata Nilai', value: '83.5', sub: 'Seluruh Kelas', color: 'text-emerald-600', icon: 'grade', bg: 'bg-green-50 text-green-600' },
                                    { title: 'Presensi Hari Ini', value: '98%', sub: 'Kehadiran', color: 'text-emerald-600', icon: 'event_available', bg: 'bg-red-50 text-red-600' }
                                ].map((card, i) => (
                                    <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-1 relative overflow-hidden text-left">
                                        <div className="flex justify-between items-start">
                                            <p className="text-slate-500 text-[10px] font-bold">{card.title}</p>
                                            <div className={`p-1 rounded ${card.bg}`}>
                                                <span className="material-symbols-outlined text-xs">{card.icon}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-900 text-xl font-bold tracking-tight">{card.value}</p>
                                        <p className={`${card.color} text-[9px] font-bold flex items-center gap-0.5`}>
                                            <span className="material-symbols-outlined text-[10px]">trending_up</span>
                                            {card.sub}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Lower Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Jadwal Mengajar (Teacher-filled!) */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                        <h4 className="font-bold text-slate-800 text-xs text-left">Jadwal Mengajar Hari Ini</h4>
                                        <span className="text-[10px] text-slate-400 font-bold">Sabtu, 4 Juli 2026</span>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Class 1 (LIVE) */}
                                        <div className="bg-white border-2 border-primary ring-2 ring-primary/5 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0">
                                                <div className="bg-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-bl flex items-center gap-0.5 animate-pulse">
                                                    <span className="material-symbols-outlined text-[8px]">sensors</span>
                                                    LIVE
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="bg-primary/10 text-primary rounded-lg p-2 text-center min-w-[70px] shrink-0">
                                                    <p className="text-xs font-bold leading-none">07.30</p>
                                                    <p className="text-[8px] opacity-75 my-0.5">s.d</p>
                                                    <p className="text-[10px] font-bold leading-none">09.00</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-xs text-slate-900">Matematika Wajib</h5>
                                                    <p className="text-slate-500 text-[10px]">Kelas X-A • Ruang 101</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button className="px-2.5 py-1 bg-primary text-white text-[9px] font-bold rounded-md hover:bg-blue-600 transition-colors">
                                                    Presensi
                                                </button>
                                                <button className="px-2.5 py-1 border border-slate-200 text-slate-600 text-[9px] font-bold rounded-md hover:bg-slate-50 transition-colors flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[10px]">edit_square</span> Jurnal
                                                </button>
                                            </div>
                                        </div>

                                        {/* Class 2 (Selesai) */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="bg-slate-50 text-slate-500 rounded-lg p-2 text-center min-w-[70px] shrink-0 border border-slate-100">
                                                    <p className="text-xs font-bold leading-none">09.15</p>
                                                    <p className="text-[8px] opacity-75 my-0.5">s.d</p>
                                                    <p className="text-[10px] font-bold leading-none">10.45</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-xs text-slate-900">Fisika Peminatan</h5>
                                                    <p className="text-slate-500 text-[10px] mb-1">Kelas X-B • Lab Fisika</p>
                                                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Selesai</span>
                                                </div>
                                            </div>
                                            <button className="px-3 py-1 bg-slate-100 text-slate-400 text-[9px] font-bold rounded-md cursor-not-allowed">
                                                Terisi
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Presensi (Populated Stats Chart) */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-fit text-left">
                                    <h4 className="font-bold text-slate-800 text-xs mb-3">Status Presensi Hari Ini</h4>
                                    <div className="space-y-2.5">
                                        {[
                                            { label: 'Hadir', count: 121, color: 'bg-primary', border: 'border-primary', percent: '98%' },
                                            { label: 'Izin', count: 2, color: 'bg-blue-400', border: 'border-blue-400', percent: '1%' },
                                            { label: 'Sakit', count: 1, color: 'bg-orange-400', border: 'border-orange-400', percent: '1%' },
                                            { label: 'Alpa', count: 0, color: 'bg-red-500', border: 'border-red-500', percent: '0%' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className={`size-8 rounded-full border-2 ${item.border} flex items-center justify-center bg-transparent shrink-0`}>
                                                    <span className="text-[8px] font-bold">{item.percent}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between text-[9px] mb-0.5">
                                                        <span className="font-bold text-slate-600">{item.label}</span>
                                                        <span className="font-bold text-slate-800">{item.count} Siswa</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                                        <div className={`${item.color} h-full rounded-full`} style={{ width: item.percent }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
               <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-2">Kenapa Pilih SiGuru Pro?</h2>
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
              <div className="bg-background-light p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="rounded-xl overflow-hidden border border-slate-150 shadow-lg bg-slate-50 flex h-[500px] relative z-10">
                      {/* Mockup Sidebar */}
                      <div className="w-48 bg-white border-r border-slate-200 p-3 flex flex-col justify-between shrink-0 text-left h-full hidden sm:flex">
                          <div className="space-y-4">
                              {/* Logo & Header */}
                              <div className="flex items-center gap-1.5 px-1">
                                  <div className="size-7 bg-primary text-white rounded-lg flex items-center justify-center shrink-0">
                                      <span className="material-symbols-outlined text-[15px]">menu_book</span>
                                  </div>
                                  <div className="min-w-0">
                                      <h3 className="text-[10px] font-bold text-slate-800 leading-tight">SiGuru Pro</h3>
                                      <p className="text-[8px] text-slate-400 font-medium">App Admin Guru</p>
                                  </div>
                              </div>

                              {/* Menu Items */}
                              <div className="space-y-3">
                                  <div>
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-primary rounded-lg font-bold text-[10px] cursor-pointer">
                                          <span className="material-symbols-outlined text-xs">dashboard</span>
                                          Dashboard
                                      </div>
                                  </div>

                                  <div>
                                      <p className="text-[8px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-0.5">Master Data</p>
                                      <div className="space-y-0.5">
                                          {[
                                              { icon: 'school', label: 'Master Kelas' },
                                              { icon: 'groups', label: 'Master Siswa' },
                                              { icon: 'calendar_today', label: 'Master Jadwal' }
                                          ].map((item, idx) => (
                                              <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 text-slate-500 hover:bg-slate-50 rounded-md font-medium text-[9px] cursor-pointer">
                                                  <span className="material-symbols-outlined text-[10px]">{item.icon}</span>
                                                  {item.label}
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  <div>
                                      <p className="text-[8px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-0.5">Akademik</p>
                                      <div className="space-y-0.5">
                                          {[
                                              { icon: 'edit_note', label: 'Jurnal Guru' },
                                              { icon: 'assessment', label: 'Asesmen' },
                                              { icon: 'checklist_rtl', label: 'Presensi' }
                                          ].map((item, idx) => (
                                              <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 text-slate-500 hover:bg-slate-50 rounded-md font-medium text-[9px] cursor-pointer">
                                                  <span className="material-symbols-outlined text-[10px]">{item.icon}</span>
                                                  {item.label}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* User profile */}
                          <div className="border-t border-slate-100 pt-2.5 flex items-center gap-1.5">
                              <div className="size-7 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                                  G
                              </div>
                              <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">Nama Guru</p>
                                  <p className="text-[8px] text-slate-400 truncate leading-none mt-0.5">contohemail@gmail.com</p>
                              </div>
                          </div>
                      </div>

                      {/* Mockup Main Content Area */}
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                          {/* Header */}
                          <div className="h-10 bg-white border-b border-slate-150 flex items-center justify-between px-4 shrink-0">
                              <button className="flex items-center gap-0.5 bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-[8px] font-bold transition-all">
                                  <span className="material-symbols-outlined text-[10px]">arrow_back</span>
                                  Kembali ke Admin
                              </button>
                              <button className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-[8px] font-bold">
                                  <span className="material-symbols-outlined text-[10px]">logout</span>
                                  Logout
                              </button>
                          </div>

                          {/* Scrollable Content */}
                          <div className="flex-1 bg-slate-50/50 p-4 overflow-y-auto space-y-4">
                              {/* Super Admin Welcome Banner */}
                              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                      <div className="text-left">
                                          <div className="flex items-center gap-1 mb-1">
                                              <span className="px-1.5 py-0.5 bg-blue-50 text-primary rounded-full text-[8px] font-bold uppercase tracking-wider border border-blue-100">
                                                  SEMESTER 1
                                              </span>
                                          </div>
                                          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                                              Nama Guru
                                          </h2>
                                          <p className="text-slate-400 text-[8px] mt-1 max-w-xs">
                                              Kelola administrasi pembelajaran, presensi, dan penilaian siswa dengan mudah hari ini.
                                          </p>
                                      </div>

                                      {/* Real-time Clock */}
                                      <div className="text-right bg-white/90 p-2 rounded-lg border border-slate-100 shadow-sm shrink-0 hidden sm:block">
                                          <div className="text-sm font-black text-slate-800 leading-none tracking-tight font-mono">
                                              16.26 <span className="text-[8px] font-bold text-slate-400 ml-0.5">WITA</span>
                                          </div>
                                          <div className="text-[8px] font-bold text-slate-500 mt-0.5">
                                              Sabtu, 4 Juli 2026
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Stat Cards */}
                              <div className="grid grid-cols-2 gap-3">
                                  {[
                                      { title: 'Kelas Aktif', value: '4', sub: 'Kelas Terdaftar', icon: 'school', bg: 'bg-blue-50 text-blue-600' },
                                      { title: 'Total Siswa', value: '124', sub: 'Siswa Terdaftar', icon: 'groups', bg: 'bg-orange-50 text-orange-600' },
                                      { title: 'Rata-rata Nilai', value: '83.5', sub: 'Seluruh Kelas', icon: 'grade', bg: 'bg-green-50 text-green-600' },
                                      { title: 'Presensi Hari Ini', value: '98%', sub: 'Kehadiran', icon: 'event_available', bg: 'bg-red-50 text-red-600' }
                                  ].map((card, i) => (
                                      <div key={i} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col gap-0.5 relative overflow-hidden text-left">
                                          <div className="flex justify-between items-start">
                                              <p className="text-slate-500 text-[8px] font-bold">{card.title}</p>
                                              <div className={`p-0.5 rounded ${card.bg}`}>
                                                  <span className="material-symbols-outlined text-[10px]">{card.icon}</span>
                                              </div>
                                          </div>
                                          <p className="text-slate-900 text-sm font-bold tracking-tight">{card.value}</p>
                                          <p className="text-emerald-600 text-[8px] font-bold flex items-center gap-0.5">
                                              {card.sub}
                                          </p>
                                      </div>
                                  ))}
                              </div>

                              {/* Jadwal Mengajar */}
                              <div className="space-y-2">
                                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                                      <h4 className="font-bold text-slate-800 text-[10px] text-left">Jadwal Mengajar Hari Ini</h4>
                                      <span className="text-[8px] text-slate-400 font-bold">Sabtu, 4 Juli 2026</span>
                                  </div>

                                  <div className="space-y-2">
                                      <div className="bg-white border border-primary/50 ring-1 ring-primary/5 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden">
                                          <div className="flex items-center gap-2 text-left">
                                              <div className="bg-primary/10 text-primary rounded-lg p-1.5 text-center min-w-[50px] shrink-0">
                                                  <p className="text-[10px] font-bold leading-none">07.30</p>
                                                  <p className="text-[8px] opacity-75 my-0.5">s.d</p>
                                                  <p className="text-[9px] font-bold leading-none">09.00</p>
                                              </div>
                                              <div>
                                                  <h5 className="font-bold text-[10px] text-slate-900">Matematika Wajib</h5>
                                                  <p className="text-slate-500 text-[8px]">Kelas X-A • Ruang 101</p>
                                              </div>
                                          </div>
                                          <span className="text-[8px] font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Aktif</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="harga" className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-2">Harga &amp; Paket Berlangganan</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                Bantu Guru Lebih Fokus Mengajar, <span className="text-primary">Bukan Sibuk Administrasi</span>
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Pilih paket yang sesuai dengan kebutuhan administrasi Anda dan rasakan kemudahannya bersama SiGuru Pro!
              </p>
            </div>

            {/* Benefits Banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 max-w-5xl mx-auto">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3 justify-center text-center">
                  <span className="material-symbols-outlined text-primary text-[24px] shrink-0">{benefit.icon}</span>
                  <span className="text-slate-800 font-semibold text-xs sm:text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Pricing Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto items-stretch">
              {packages.map((pkg, idx) => {
                const isFavorite = pkg.tag === "PAKET FAVORIT";
                const isBestValue = pkg.tag === "PAKET PALING HEMAT";
                
                return (
                  <div 
                    key={idx} 
                    className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col relative overflow-hidden group hover:-translate-y-2 hover:shadow-xl ${pkg.colorClass.border} ${isFavorite ? 'ring-2 ring-primary ring-offset-2 scale-105 z-10' : ''}`}
                  >
                    {pkg.tag && (
                      <div className={`absolute top-0 left-0 right-0 py-1.5 text-center text-[10px] font-bold tracking-wider uppercase text-white ${isFavorite ? 'bg-primary' : 'bg-orange-500'}`}>
                        {pkg.tag}
                      </div>
                    )}

                    <div className={`p-6 pt-10 flex flex-col items-center flex-1 ${pkg.tag ? 'mt-3' : ''}`}>
                      <div className={`size-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${pkg.colorClass.iconColor}`}>
                        <span className="material-symbols-outlined text-3xl">{pkg.icon}</span>
                      </div>

                      <h4 className="text-xl font-extrabold text-slate-900 tracking-wider mb-2">{pkg.name}</h4>
                      
                      {/* Original Price */}
                      <span className="text-slate-400 line-through text-sm font-medium">{pkg.originalPrice}</span>
                      
                      {/* Promo Price */}
                      <div className="flex flex-col items-center mt-1">
                        <span className={`text-2xl sm:text-[28px] font-black tracking-tight whitespace-nowrap ${
                          pkg.colorClass.highlight === 'emerald' ? 'text-emerald-600' : 
                          pkg.colorClass.highlight === 'purple' ? 'text-purple-600' : 
                          pkg.colorClass.highlight === 'orange' ? 'text-orange-600' : 
                          'text-primary'
                        }`}>
                          {pkg.promoPrice}
                        </span>
                        <span className="text-slate-500 text-[11px] font-bold mt-1 px-2.5 py-0.5 bg-slate-50 border border-slate-100 rounded-full">
                          Masa Aktif: {pkg.duration}
                        </span>
                      </div>

                      {/* Saving Pill */}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-4 ${pkg.colorClass.accent}`}>
                        {pkg.saving}
                      </span>

                      {/* Monthly Rate Indicator */}
                      {pkg.monthlyRate && (
                        <div className="mt-4 px-4 py-1.5 rounded-xl border border-dashed border-slate-200 text-slate-600 font-bold text-xs bg-slate-50/50">
                          {pkg.monthlyRate}
                        </div>
                      )}

                      <p className="text-slate-500 text-xs text-center leading-relaxed mt-6 mb-8 border-t border-slate-100 pt-4 flex-1">
                        {pkg.subtext}
                      </p>

                      <button 
                        onClick={() => handleSelectPackage(pkg)}
                        className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 hover:shadow-lg ${pkg.colorClass.button}`}
                      >
                        Beli Sekarang
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-features bar */}
            <div className="mt-16 max-w-4xl mx-auto border-t border-slate-200/80 pt-10">
              <div className="grid md:grid-cols-3 gap-6">
                {pricingFeatures.map((feat, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-emerald-500 shrink-0 text-[24px]">{feat.icon}</span>
                    <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">{feat.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-xs sm:text-sm font-bold text-primary tracking-wide uppercase bg-blue-50/80 inline-block px-6 py-2 rounded-full border border-blue-100">
                PILIH PAKET YANG SESUAI &amp; RASAKAN MUDAHNYA ADMINISTRASI BERSAMA SIGURU PRO!
              </p>
              <div className="flex justify-center gap-6 text-slate-400 text-xs font-semibold mt-4">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-emerald-500 text-[16px]">verified</span> Aman</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-emerald-500 text-[16px]">verified</span> Terpercaya</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-rose-500 text-[16px]">favorite</span> Dikembangkan untuk Guru Indonesia</span>
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
                <span className="text-xl font-bold tracking-tight text-white">Si<span className="text-primary">Guru</span> Pro</span>
             </div>
             <p className="text-sm">
                 &copy; {new Date().getFullYear()} Administrasi Guru Pintar. Dibuat dengan presisi tinggi.
             </p>
        </div>
      </footer>
    </div>
  );
}
