import React from 'react';
import { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
  adminWaNumber: string;
}

export const BillingPaywall: React.FC<Props> = ({ user, onLogout, adminWaNumber }) => {
  const packages = [
    {
      name: "BASIC",
      icon: "menu_book",
      originalPrice: "Rp 15.000",
      promoPrice: "Rp 15.000",
      duration: "1 Bulan",
      saving: "Akses Dasar",
      monthlyRate: "Rp15.000/bulan",
      subtext: "Akses penuh selama sebulan untuk mencoba semua fitur.",
      tag: null,
      colorClass: {
        border: "border-slate-200 hover:border-slate-400",
        bg: "bg-slate-50",
        accent: "text-slate-600 bg-slate-100",
        button: "bg-slate-800 hover:bg-slate-900 text-white shadow-md",
        highlight: "slate",
        iconColor: "text-slate-600 bg-slate-100",
      }
    },
    {
      name: "TRIWULAN",
      icon: "workspace_premium",
      originalPrice: "Rp 45.000",
      promoPrice: "Rp 39.000",
      duration: "3 Bulan",
      saving: "Hemat Rp6.000",
      monthlyRate: "Rp13.000/bulan",
      subtext: "Paket paling populer di kalangan guru Indonesia.",
      tag: "PAKET TERFAVORIT",
      colorClass: {
        border: "border-blue-200 hover:border-blue-500 shadow-blue-100 shadow-lg ring-2 ring-primary ring-offset-1",
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
      subtext: "Cocok untuk penggunaan satu semester penuh.",
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

  const handleRenewPackage = (pkg: typeof packages[0]) => {
    const text = `Halo Admin SiGuru Pro,%0A%0AAkun saya *${user.name}* (${user.email}) telah berakhir masa aktifnya.%0A%0ASaya ingin memperpanjang masa aktif menggunakan *Paket ${pkg.name}* (${pkg.duration}) seharga promo *${pkg.promoPrice}*.%0A%0AMohon bantuan aktivasi akun saya. Terima kasih!`;
    const waUrl = `https://wa.me/${adminWaNumber}?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
        
        {/* Suspended Header */}
        <div className="flex flex-col items-center">
          <div className="size-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-rose-500/5">
            <span className="material-symbols-outlined text-[44px]">lock_person</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Masa Aktif Akun Anda Telah Berakhir
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Halo <span className="text-white font-bold">{user.name}</span>, masa aktif akun SiGuru Pro Anda untuk paket <span className="text-orange-400 font-bold">{user.subscriptionPlan || 'FREE TRIAL'}</span> telah berakhir pada tanggal <span className="text-rose-400 font-bold">{formatDate(user.subscriptionEndDate)}</span>.
          </p>
        </div>

        {/* Warning card */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-left shadow-xl">
          <span className="material-symbols-outlined text-amber-500 text-[36px] shrink-0">info_outline</span>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">Tenang saja, Data Anda Tetap Aman!</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seluruh data administrasi, nilai, absensi, jurnal, dan pencapaian siswa Anda disimpan dengan aman di database cloud kami. Akses akan terbuka kembali secara otomatis begitu Anda melakukan perpanjangan paket.
            </p>
          </div>
        </div>

        {/* Pricing Options title */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">PILIH PAKET PERPANJANGAN</h2>
          <p className="text-xs text-slate-400">Silakan pilih paket di bawah ini untuk melanjutkan aktivitas mengajar Anda:</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-800">
          {packages.map((pkg, idx) => {
            const isFavorite = pkg.tag === "PAKET TERFAVORIT";
            
            return (
              <div 
                key={idx}
                className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col relative overflow-hidden group hover:shadow-xl ${pkg.colorClass.border} ${isFavorite ? 'scale-105 z-10' : ''}`}
              >
                {pkg.tag && (
                  <div className={`absolute top-0 left-0 right-0 py-1 text-center text-[8px] font-bold tracking-wider uppercase text-white ${isFavorite ? 'bg-primary' : 'bg-orange-500'}`}>
                    {pkg.tag}
                  </div>
                )}

                <div className={`p-5 pt-8 flex flex-col items-center flex-1 ${pkg.tag ? 'mt-2' : ''}`}>
                  <div className={`size-12 rounded-xl flex items-center justify-center mb-3 ${pkg.colorClass.iconColor}`}>
                    <span className="material-symbols-outlined text-2xl">{pkg.icon}</span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 tracking-wider mb-1 uppercase">{pkg.name}</h4>
                  
                  {/* Original Price */}
                  {pkg.originalPrice !== pkg.promoPrice && (
                    <span className="text-slate-400 line-through text-[11px] font-medium">{pkg.originalPrice}</span>
                  )}
                  
                  {/* Promo Price stacked vertically to prevent wrap */}
                  <div className="flex flex-col items-center mt-1">
                    <span className={`text-[20px] font-black tracking-tight whitespace-nowrap ${
                      pkg.colorClass.highlight === 'emerald' ? 'text-emerald-600' : 
                      pkg.colorClass.highlight === 'purple' ? 'text-purple-600' : 
                      pkg.colorClass.highlight === 'orange' ? 'text-orange-600' : 
                      'text-primary'
                    }`}>
                      {pkg.promoPrice}
                    </span>
                    <span className="text-slate-500 text-[10px] font-bold mt-0.5 px-2 py-0.5 bg-slate-100 border border-slate-200/50 rounded-full">
                      Masa Aktif: {pkg.duration}
                    </span>
                  </div>

                  {/* Saving Pill */}
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-3 ${pkg.colorClass.accent}`}>
                    {pkg.saving}
                  </span>

                  <p className="text-slate-500 text-[10px] text-center leading-relaxed mt-4 mb-5 border-t border-slate-100 pt-3 flex-1">
                    {pkg.subtext}
                  </p>

                  <button 
                    onClick={() => handleRenewPackage(pkg)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${pkg.colorClass.button}`}
                  >
                    Pilih Paket
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            Butuh bantuan lain? Hubungi Admin via WhatsApp di <span className="text-slate-400 font-bold">+{adminWaNumber}</span>
          </p>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors text-xs font-bold text-slate-300"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Keluar / Login Akun Lain
          </button>
        </div>

      </div>
    </div>
  );
};
