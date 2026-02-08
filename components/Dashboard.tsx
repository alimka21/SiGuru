
import React, { useState, useEffect, useMemo } from 'react';
import { TabView, IdentityData, ScheduleItem, ClassInfo, Student, AttendanceData, GradeData, Subject, LearningObjective, TeacherRole, SchoolLevel, CalendarEvent } from '../types';
import { useDashboardLogic } from '../hooks/useDashboardLogic';

declare const Swal: any;

interface Props {
  onNavigate: (tab: TabView, context?: { className?: string, scheduleId?: string, targetDate?: string }) => void;
  identity: IdentityData;
  schedules: ScheduleItem[];
  classes: ClassInfo[];
  students: Student[];
  attendanceData: AttendanceData;
  gradeData: GradeData;
  subject: Subject;
  tps: LearningObjective[];
  calendarEvents?: CalendarEvent[]; // Added calendar events prop
  // Callback untuk menyimpan identity dari modal dashboard
  onSaveIdentity?: (data: IdentityData) => void;
}

// --- DATA REFERENSI MAPEL ---
const SUBJECTS_SD = [
    'Bahasa Indonesia', 'Matematika', 'IPAS', 'Pendidikan Pancasila', 
    'Seni Budaya', 'PJOK', 'Bahasa Inggris', 'Muatan Lokal', 'PAI', 'PAK'
];

const SUBJECTS_SECONDARY = [
    'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Pancasila',
    'Informatika', 'IPA', 'IPS', 'PJOK', 'Seni Budaya', 
    'Fisika', 'Kimia', 'Biologi', 
    'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
    'PAI', 'PAK', 'BK'
];

const StatCard = ({ title, value, subText, subColor, icon, bgIcon }: any) => (
  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all hover:shadow-md group">
    <div className="absolute right-0 top-0 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
         <span className="material-symbols-outlined text-9xl">{icon}</span>
    </div>
    <div className="flex justify-between items-start z-10">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <div className={`p-2 rounded-lg ${bgIcon}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
    </div>
    <p className="text-slate-900 text-3xl font-bold tracking-tight z-10">{value}</p>
    <p className={`${subColor} text-sm font-semibold flex items-center gap-1 z-10`}>
      <span className="material-symbols-outlined text-sm">trending_up</span>
      {subText}
    </p>
  </div>
);

// ... ScheduleCard Component (Sama seperti sebelumnya, tidak diubah) ...
const ScheduleCard: React.FC<any> = ({ id, startTime, endTime, className, subject, room, currentTime, onNavigate }) => {
    const isLive = () => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const start = new Date(currentTime);
        start.setHours(startH, startM, 0);
        const end = new Date(currentTime);
        end.setHours(endH, endM, 0);
        return currentTime >= start && currentTime <= end;
    };
    const isFinished = () => {
         const [endH, endM] = endTime.split(':').map(Number);
         const end = new Date(currentTime);
         end.setHours(endH, endM, 0);
         return currentTime > end;
    }
    const liveStatus = isLive();
    const finishedStatus = isFinished();

    return (
        <div className={`border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-6 shadow-sm relative overflow-hidden transition-all ${liveStatus ? 'bg-white border-primary border-2 ring-4 ring-primary/5' : 'bg-white border-slate-200'}`}>
            {liveStatus && (
                <div className="absolute top-0 right-0 animate-pulse">
                    <div className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text--[10px]">sensors</span>
                        LIVE
                    </div>
                </div>
            )}
            <div className={`${liveStatus ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-600'} rounded-lg p-3 text-center min-w-[90px]`}>
                <p className="text-lg font-bold">{startTime}</p>
                <p className="text-xs font-bold opacity-70">{liveStatus ? 'S.D' : 'Hingga'}</p>
                <p className="text-sm font-bold opacity-90">{endTime}</p>
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-lg text-slate-900">{subject}</h4>
                <p className="text-slate-500 text-sm">{className} • {room}</p>
                {finishedStatus && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mt-1 inline-block">Selesai</span>}
            </div>
            <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => onNavigate(TabView.ATTENDANCE, { className, scheduleId: id })}
                  className={`flex-1 md:flex-none px-3 py-1.5 border text-xs font-bold rounded transition-colors ${liveStatus ? 'border-primary text-primary hover:bg-primary/10' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                >
                  Presensi
                </button>
                <button 
                  onClick={() => onNavigate(TabView.JOURNAL, { className, scheduleId: id })}
                  className={`flex-1 md:flex-none px-3 py-1.5 border text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 ${liveStatus ? 'border-purple-500 text-purple-600 hover:bg-purple-50' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="material-symbols-outlined text-sm">edit_square</span>
                  Jurnal
                </button>
                <button 
                  onClick={() => onNavigate(TabView.GRADING, { className })}
                  className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold rounded transition-colors ${liveStatus ? 'bg-primary text-white hover:bg-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Input Nilai
                </button>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<Props> = (props) => {
  const { state, computed } = useDashboardLogic({
      schedules: props.schedules,
      attendanceData: props.attendanceData,
      gradeData: props.gradeData,
      subject: props.subject,
      tps: props.tps
  });

  const { currentTime } = state;
  const { dateString, todaysSchedules, averageGrade, attendanceStats } = computed;

  // --- CALENDAR TODAY LOGIC ---
  const todaysEvents = useMemo(() => {
      if (!props.calendarEvents) return [];
      const todayStr = new Date().toISOString().split('T')[0];
      return props.calendarEvents.filter(e => e.date === todayStr);
  }, [props.calendarEvents]);

  // Helper for Event Styling in Dashboard Panel
  const getEventStyle = (type: string) => {
      switch (type) {
          case 'HOLIDAY': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'beach_access', label: 'Hari Libur' };
          case 'EXAM': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'assignment', label: 'Ujian' };
          case 'MEETING': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'groups', label: 'Rapat' };
          default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'event_note', label: 'Kegiatan' };
      }
  };

  // --- ONBOARDING LOGIC ---
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [setupData, setSetupData] = useState<IdentityData>(props.identity);

  // List Mapel Dinamis berdasarkan Jenjang
  const availableSubjects = useMemo(() => {
      return setupData.level === 'SD' ? SUBJECTS_SD : SUBJECTS_SECONDARY;
  }, [setupData.level]);

  useEffect(() => {
      // Cek apakah data identitas sudah "properly set"
      // Kriteria: Nama Sekolah tidak default, dan Mapel/Kelas terisi sesuai role
      const isSchoolSet = props.identity.schoolName && props.identity.schoolName !== 'Nama Sekolah';
      const isContextSet = props.identity.role === 'CLASS_TEACHER' 
          ? (props.identity.className && props.identity.className !== '')
          : (props.identity.subjectName && props.identity.subjectName !== 'Mata Pelajaran' && props.identity.subjectName !== '');
      
      if (!isSchoolSet || !isContextSet) {
          setShowOnboarding(true);
      }
  }, [props.identity]);

  const handleRoleChange = (role: TeacherRole) => {
      setSetupData(prev => ({
          ...prev,
          role,
          // Tidak lagi memaksa pindah ke SMP jika Guru Mapel, 
          // Default tetap SD jika sebelumnya Guru Kelas (yang pasti SD) atau biarkan user pilih.
          level: role === 'CLASS_TEACHER' ? 'SD' : prev.level 
      }));
  };

  const handleFinishOnboarding = (e: React.FormEvent) => {
      e.preventDefault();
      if (props.onSaveIdentity) {
          props.onSaveIdentity(setupData);
          setShowOnboarding(false);
          // Show Success Swal
          Swal.fire({
              title: 'Profil Tersimpan!',
              text: 'Data awal Anda berhasil disimpan. Selamat bekerja!',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
          });
      }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 relative">
      
      {/* --- ONBOARDING MODAL OVERLAY --- */}
      {showOnboarding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                              <span className="material-symbols-outlined text-3xl">settings_account_box</span>
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold">Selamat Datang di SiGuru!</h2>
                              <p className="text-blue-100 text-sm">Mohon lengkapi profil Anda untuk memulai.</p>
                          </div>
                      </div>
                  </div>
                  
                  <form onSubmit={handleFinishOnboarding} className="p-8 space-y-6">
                      {/* 1. Sekolah & Jenjang */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Nama Sekolah</label>
                              <input 
                                  type="text" required
                                  className="w-full border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-primary placeholder:text-slate-400"
                                  placeholder="Contoh: SMA Negeri 1..."
                                  value={setupData.schoolName === 'Nama Sekolah' ? '' : setupData.schoolName}
                                  onChange={e => setSetupData({...setupData, schoolName: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Jenjang Sekolah</label>
                              <select 
                                  className="w-full border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-primary cursor-pointer"
                                  value={setupData.level}
                                  onChange={e => setSetupData({...setupData, level: e.target.value as SchoolLevel})}
                                  disabled={setupData.role === 'CLASS_TEACHER'} // SD Only for Class Teacher
                              >
                                  <option value="SD">SD/MI</option>
                                  <option value="SMP">SMP/MTs</option>
                                  <option value="SMA">SMA/MA</option>
                                  <option value="SMK">SMK</option>
                              </select>
                          </div>
                      </div>

                      <div className="border-t border-slate-100 my-4"></div>

                      {/* 2. Role & Context */}
                      <div className="space-y-4">
                          <label className="text-sm font-bold text-slate-700">Peran Guru</label>
                          <div className="grid grid-cols-2 gap-4">
                              <div 
                                  onClick={() => handleRoleChange('SUBJECT_TEACHER')}
                                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-1 transition-all ${setupData.role === 'SUBJECT_TEACHER' ? 'border-primary bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                              >
                                  <div className="flex items-center gap-2 font-bold text-slate-800">
                                      <span className="material-symbols-outlined text-primary">menu_book</span>
                                      Guru Mapel
                                  </div>
                                  <p className="text-xs text-slate-500">Mengajar 1 mapel (SD/SMP/SMA).</p>
                              </div>
                              <div 
                                  onClick={() => handleRoleChange('CLASS_TEACHER')}
                                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-1 transition-all ${setupData.role === 'CLASS_TEACHER' ? 'border-primary bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                              >
                                  <div className="flex items-center gap-2 font-bold text-slate-800">
                                      <span className="material-symbols-outlined text-orange-500">meeting_room</span>
                                      Guru Kelas
                                  </div>
                                  <p className="text-xs text-slate-500">Wali kelas / Guru Tematik (Khusus SD).</p>
                              </div>
                          </div>
                      </div>

                      {/* 3. Conditional Input */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          {setupData.role === 'SUBJECT_TEACHER' ? (
                              <div className="space-y-2">
                                  <label className="text-sm font-bold text-slate-700">Mata Pelajaran yang Diampu</label>
                                  <div className="relative">
                                    <select 
                                        required
                                        className="w-full border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-primary cursor-pointer appearance-none pl-4 pr-10"
                                        value={setupData.subjectName === 'Mata Pelajaran' ? '' : setupData.subjectName}
                                        onChange={e => setSetupData({...setupData, subjectName: e.target.value})}
                                    >
                                        <option value="">-- Pilih Mata Pelajaran --</option>
                                        {availableSubjects.map((subj) => (
                                            <option key={subj} value={subj}>{subj}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-500 pointer-events-none text-lg">expand_more</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500">Pilih mapel utama yang Anda ajarkan.</p>
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  <label className="text-sm font-bold text-slate-700">Nama Kelas Ampuan</label>
                                  <input 
                                      type="text" required
                                      className="w-full border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-primary placeholder:text-slate-400"
                                      placeholder="Contoh: Kelas 4-B"
                                      value={setupData.className}
                                      onChange={e => setSetupData({...setupData, className: e.target.value})}
                                  />
                              </div>
                          )}
                      </div>

                      <button 
                          type="submit"
                          className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-95"
                      >
                          Simpan & Mulai
                      </button>
                  </form>
              </div>
          </div>
      )}

      
      {/* Hero Header Banner */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
         <div className="absolute right-10 bottom-0 opacity-[0.03] pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">school</span>
         </div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            
            {/* Left: Profile & Greeting */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                        Semester {props.identity.semester}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {props.identity.academicYear}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {props.identity.teacherName}
                </h1>
                
                {/* School Name & Role Integration */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm md:text-base">
                     <div className="flex items-center gap-2 text-slate-500 font-semibold">
                        <span className="material-symbols-outlined text-lg text-primary">domain</span>
                        {props.identity.schoolName}
                     </div>
                     <span className="text-slate-300">|</span>
                     <div className="flex items-center gap-2 text-slate-700 font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                        <span className="material-symbols-outlined text-sm text-slate-500">
                            {props.identity.role === 'CLASS_TEACHER' ? 'meeting_room' : 'menu_book'}
                        </span>
                        {props.identity.role === 'CLASS_TEACHER' 
                            ? `Wali ${props.identity.className || 'Kelas'}` 
                            : `Guru Mapel ${props.identity.subjectName}`
                        }
                     </div>
                </div>
                
                <p className="text-slate-400 text-sm mt-3 max-w-lg">
                    Selamat bertugas! Kelola administrasi pembelajaran, presensi, dan penilaian siswa dengan mudah hari ini.
                </p>
            </div>

            {/* Right: Clock & Date */}
            <div className="text-right bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-100 shadow-sm">
                 <div className="text-4xl font-black text-slate-800 leading-none tracking-tight font-mono">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Makassar' })} 
                    <span className="text-sm font-bold text-slate-400 ml-1">WITA</span>
                </div>
                <div className="text-sm font-bold text-slate-500 mt-1 capitalize flex items-center justify-end gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    {dateString}
                </div>
            </div>
         </div>
      </div>

      {/* --- PANEL INFORMASI AGENDA HARI INI (UPDATED) --- */}
      {todaysEvents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                {/* Left: Heading */}
                <div className="md:w-1/4 flex flex-col justify-center border-r border-slate-100 pr-6">
                    <div className="inline-flex items-center gap-2 text-yellow-600 mb-2">
                        <span className="material-symbols-outlined filled">notifications_active</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Reminder</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 leading-tight">Agenda<br/>Hari Ini</h3>
                    <p className="text-sm text-slate-500 mt-2">
                        Anda memiliki <strong className="text-slate-900">{todaysEvents.length} agenda</strong> terdaftar di kalender pendidikan.
                    </p>
                    <button 
                        onClick={() => props.onNavigate(TabView.CALENDAR, { targetDate: new Date().toISOString().split('T')[0] })}
                        className="mt-4 text-sm font-bold text-primary hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                        Lihat Kalender <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>

                {/* Right: List of Events */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {todaysEvents.map(ev => {
                        const style = getEventStyle(ev.type);
                        return (
                            <div key={ev.id} className={`flex items-start gap-4 p-4 rounded-xl border ${style.bg} ${style.border} transition-transform hover:scale-[1.01]`}>
                                <div className={`p-2.5 rounded-lg bg-white/60 shadow-sm ${style.text}`}>
                                    <span className="material-symbols-outlined">{style.icon}</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/50 ${style.text}`}>
                                            {style.label}
                                        </span>
                                    </div>
                                    <h4 className={`font-bold text-sm ${style.text} truncate`}>{ev.title}</h4>
                                    {ev.description && (
                                        <p className="text-xs text-slate-600 mt-1 opacity-90 line-clamp-2">{ev.description}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Kelas Aktif" 
          value={props.classes.length.toString()} 
          subText="Kelas Terdaftar" 
          subColor="text-green-600" 
          bgIcon="bg-blue-50 text-blue-600" 
          icon="school" 
        />
        <StatCard 
          title="Total Siswa" 
          value={props.students.length.toString()} 
          subText="Siswa Terdaftar" 
          subColor="text-slate-500" 
          bgIcon="bg-orange-50 text-orange-600" 
          icon="groups" 
        />
        <StatCard 
          title="Rata-rata Nilai" 
          value={averageGrade} 
          subText="Seluruh Kelas" 
          subColor="text-green-600" 
          bgIcon="bg-green-50 text-green-600" 
          icon="grade" 
        />
        <StatCard 
          title="Presensi Hari Ini" 
          value={`${attendanceStats.percentage}%`} 
          subText={attendanceStats.total > 0 ? "Kehadiran" : "Belum Ada Data"} 
          subColor={attendanceStats.total > 0 ? "text-slate-700" : "text-slate-400"} 
          bgIcon="bg-red-50 text-red-600" 
          icon="event_available" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
                 <h3 className="text-xl font-bold text-slate-900">Jadwal Mengajar Hari Ini</h3>
                 <p className="text-sm text-slate-500 mt-1 capitalize">{dateString}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {todaysSchedules.length > 0 ? (
                todaysSchedules.map(schedule => (
                    <ScheduleCard 
                        key={schedule.id}
                        {...schedule}
                        currentTime={currentTime}
                        onNavigate={props.onNavigate}
                    />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">event_available</span>
                    <p className="text-sm font-medium">Tidak ada jadwal mengajar hari ini.</p>
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Only Status Presensi remains */}
        <div className="space-y-8">
          
          {/* Attendance Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-slate-900 mb-6">Status Presensi Hari Ini</h3>
            
            {attendanceStats.total > 0 ? (
                 <div className="flex flex-col gap-5">
                    {[
                        { label: 'Hadir', count: attendanceStats.present, color: 'bg-primary', border: 'border-primary', percent: Math.round((attendanceStats.present / attendanceStats.total) * 100) + '%' },
                        { label: 'Izin', count: attendanceStats.izin, color: 'bg-blue-400', border: 'border-blue-400', percent: Math.round((attendanceStats.izin / attendanceStats.total) * 100) + '%' },
                        { label: 'Sakit', count: attendanceStats.sakit, color: 'bg-orange-400', border: 'border-orange-400', percent: Math.round((attendanceStats.sakit / attendanceStats.total) * 100) + '%' },
                        { label: 'Alpa', count: attendanceStats.alpa, color: 'bg-red-500', border: 'border-red-500', percent: Math.round((attendanceStats.alpa / attendanceStats.total) * 100) + '%' }
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-4">
                        <div className={`size-12 rounded-full border-[5px] ${item.border} flex items-center justify-center bg-transparent`}>
                            <span className="text-[10px] font-bold">{item.percent}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-600">{item.label}</span>
                            <span className="font-bold text-slate-900">{item.count} Siswa</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full rounded-full`} style={{ width: item.percent }}></div>
                            </div>
                        </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-lg">
                    <span className="material-symbols-outlined text-3xl mb-2">data_info_alert</span>
                    <p className="text-xs font-bold text-center">Belum ada data presensi<br/>tersimpan hari ini.</p>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
