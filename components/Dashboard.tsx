
import React from 'react';
import { TabView, IdentityData, ScheduleItem, ClassInfo, Student, AttendanceData, GradeData, Subject, LearningObjective } from '../types';
import { useDashboardLogic } from '../hooks/useDashboardLogic';

interface Props {
  onNavigate: (tab: TabView, context?: { className?: string, scheduleId?: string }) => void;
  identity: IdentityData;
  schedules: ScheduleItem[];
  classes: ClassInfo[];
  students: Student[];
  attendanceData: AttendanceData;
  gradeData: GradeData;
  subject: Subject;
  tps: LearningObjective[];
}

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

interface ScheduleCardProps {
    id: string;
    startTime: string;
    endTime: string;
    className: string;
    subject: string;
    room: string;
    currentTime: Date;
    onNavigate: (tab: TabView, context?: { className?: string, scheduleId?: string }) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ id, startTime, endTime, className, subject, room, currentTime, onNavigate }) => {
    // Logic to determine if class is live
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
                        SEDANG BERLANGSUNG
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      
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
                            ? 'Guru Kelas' 
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
