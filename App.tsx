
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from './utils/supabase'; 
import { Dashboard } from './components/Dashboard'; 
import { LoginPage, RegisterData, LoginData } from './components/LoginPage';
import { MainLayout } from './components/layouts/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotFound } from './components/NotFound';
import { usePersistedState, useSessionTimeout, useOfflineStatus } from './hooks/useAppOptimization';

// --- LAZY LOAD COMPONENTS ---
const LandingPage = React.lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const GradingSheet = React.lazy(() => import('./components/GradingSheet').then(m => ({ default: m.GradingSheet })));
const AttendanceSheet = React.lazy(() => import('./components/AttendanceSheet').then(m => ({ default: m.AttendanceSheet })));
const IdentityForm = React.lazy(() => import('./components/IdentityForm').then(m => ({ default: m.IdentityForm })));
const CurriculumManager = React.lazy(() => import('./components/CurriculumManager').then(m => ({ default: m.CurriculumManager })));
const ClassManager = React.lazy(() => import('./components/ClassManager').then(m => ({ default: m.ClassManager })));
const StudentManager = React.lazy(() => import('./components/StudentManager').then(m => ({ default: m.StudentManager })));
const ScheduleManager = React.lazy(() => import('./components/ScheduleManager').then(m => ({ default: m.ScheduleManager })));
const CPGenerator = React.lazy(() => import('./components/CPGenerator').then(module => ({ default: module.CPGenerator })));
const RecapManager = React.lazy(() => import('./components/RecapManager').then(m => ({ default: m.RecapManager })));
const JournalManager = React.lazy(() => import('./components/JournalManager').then(m => ({ default: m.JournalManager })));
const CalendarManager = React.lazy(() => import('./components/CalendarManager').then(m => ({ default: m.CalendarManager })));
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

import { 
  Student, LearningObjective, Subject, IdentityData, 
  ScheduleItem, AttendanceData, GradeData, User, JournalEntry, CalendarEvent, TabView, ClassInfo
} from './types';

declare const Swal: any;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      refetchOnWindowFocus: false,
    },
  },
});

const INITIAL_IDENTITY: IdentityData = {
    role: 'SUBJECT_TEACHER', 
    level: 'SMA', 
    schoolName: '',
    teacherName: '',
    nip: '',
    subjectName: '',
    semester: '1',
    academicYear: '2025/2026',
    className: '',
    studentCount: 0,
    principalName: '',
    principalNip: ''
};

// Loader for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400 animate-in fade-in zoom-in duration-300">
       <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          <span className="text-sm font-bold tracking-wide">Memuat Data Cloud...</span>
       </div>
  </div>
);

const AppContent = () => {
  const navigate = useNavigate();
  
  // --- OFFLINE AND TIMEOUT (Optimizations) ---
  const isOffline = useOfflineStatus();
  
  // Session timeout of 120 minutes (2 hours). Upon timeout, log out.
  useSessionTimeout(120, () => {
    if (currentUser) {
      Swal.fire('Sesi Berakhir', 'Sesi Anda telah habis karena tidak ada aktivitas. Silakan login kembali.', 'info');
      handleLogout(true); // force logout
    }
  });

  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = usePersistedState<User | null>('app_currentUser', null);
  // If we already have a hydrated user, we don't need to show a loading screen while validating
  const [isLoadingAuth, setIsLoadingAuth] = useState(currentUser === null); 
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // --- SETTINGS STATE ---
  const [adminWaNumber, setAdminWaNumber] = usePersistedState('app_adminWaNumber', '6282335454864');

  // --- APP DATA STATE (Global Context fetched from DB, hydrated from local storage) ---
  const [identity, setIdentity] = usePersistedState<IdentityData>('app_identity', INITIAL_IDENTITY);
  const [students, setStudents] = usePersistedState<Student[]>('app_students', []); 
  const [classes, setClasses] = usePersistedState<ClassInfo[]>('app_classes', []); 
  const [schedules, setSchedules] = usePersistedState<ScheduleItem[]>('app_schedules', []); 
  const [tps, setTps] = usePersistedState<LearningObjective[]>('app_tps', []); 
  const [subject, setSubject] = usePersistedState<Subject>('app_subject', { id: 's1', name: 'Mata Pelajaran', kktp: 75 });
  
  // NOTE: Grade, Attendance, Journal data are now fetched inside their specific components 
  // to avoid loading too much data at start. We use local persistence here for offline recovery/anti-hilang data
  const [attendanceData, setAttendanceData] = usePersistedState<AttendanceData>('app_attendanceData', {});
  const [gradeData, setGradeData] = usePersistedState<GradeData>('app_gradeData', {}); 
  const [journals, setJournals] = usePersistedState<JournalEntry[]>('app_journals', []); 
  const [calendarEvents, setCalendarEvents] = usePersistedState<CalendarEvent[]>('app_calendarEvents', []);

  // --- AUTH EFFECTS ---
  useEffect(() => {
    if (!isSupabaseConfigured) {
        setIsLoadingAuth(false);
        return;
    }

    const initSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (session?.user) await handleUserRestored(session.user);
            else setIsLoadingAuth(false);
        } catch (err) {
            console.error("Session Validation Failed:", err);
            setIsLoadingAuth(false);
        }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) handleUserRestored(session.user);
      else if (event === 'SIGNED_OUT') resetAppState();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserRestored = async (authUser: any) => {
      // 1. Fetch Teacher Profile from DB
      try {
        const { data: teacherData, error } = await supabase
            .from('teachers')
            .select('*, schools(name)')
            .eq('email', authUser.email)
            .single();
        
        if (error || !teacherData) {
            console.error("Teacher profile not found", error);
            // Fallback / Admin logic could go here
        }

        const appUser: User = {
            id: teacherData?.id || authUser.id,
            email: authUser.email || '',
            name: teacherData?.full_name || authUser.email?.split('@')[0],
            role: teacherData?.role || 'SUBJECT_TEACHER',
            level: teacherData?.level || 'SMA',
            isActive: teacherData?.is_active === true
        };

        if (!appUser.isActive && appUser.email !== 'admin@siguru.com') {
            await supabase.auth.signOut();
            Swal.fire({ title: 'Akun Belum Aktif', text: 'Silahkan hubungi Admin sekolah.', icon: 'warning' });
            setIsLoadingAuth(false);
            return;
        }

        setCurrentUser(appUser);
        setIsLoadingAuth(false); // Stop loading UI early for minimal state hydration + fast perceptable load!
        
        // 2. Fetch Global Master Data (Classes, Students, TPs) in background
        // Removing await allows the UI to render immediately with cached persisted data!
        fetchGlobalData(appUser.id, teacherData).then(() => {
           // Navigate logic after data is fetched if no hash present
           if (appUser.role === 'ADMIN') {
               navigate('/admin');
           } else {
               const hash = window.location.hash;
               if (!hash || hash === '#/login' || hash === '#/') {
                   navigate('/dashboard');
               }
           }
        });

      } catch (e) {
          console.error("Login process failed", e);
          setIsLoadingAuth(false);
      }
  };

  const fetchGlobalData = async (teacherId: string, teacherProfile: any) => {
      try {
          // Set Identity
          setIdentity({
              role: teacherProfile.role,
              level: teacherProfile.level,
              schoolName: teacherProfile.schools?.name || 'Sekolah',
              teacherName: teacherProfile.full_name,
              nip: teacherProfile.nip || '',
              subjectName: '', // Will be inferred or fetched if stored
              semester: teacherProfile.active_semester || '1',
              academicYear: teacherProfile.active_academic_year || '2025/2026',
              className: '', 
              studentCount: 0 
          });

          // Fetch Classes
          const { data: clsData } = await supabase.from('classes').select('*').eq('teacher_id', teacherId);
          if (clsData) setClasses(clsData as ClassInfo[]);

          // Fetch Students
          const { data: stdData } = await supabase.from('students').select('*').eq('teacher_id', teacherId);
          if (stdData) setStudents(stdData.map(s => ({
              id: s.id, name: s.name, nis: s.nis, nisn: s.nisn, className: s.class_id // Need mapping if class_id is UUID
          })) as any); // Simplified for now, real implementation needs join for className

          // Fetch Schedules
          const { data: schData } = await supabase.from('schedules').select('*').eq('teacher_id', teacherId);
          if (schData) setSchedules(schData.map(s => ({
              id: s.id, day: s.day, startTime: s.start_time.slice(0,5), endTime: s.end_time.slice(0,5), 
              className: '...', subject: s.subject_name, room: s.room 
          })) as any); // Again, mapping needed for class name if strictly relational

          // Fetch TPs (Learning Objectives) - Only fetches basic info
          const { data: tpData } = await supabase.from('learning_objectives').select('*, assessment_criteria(*)').eq('teacher_id', teacherId);
          if (tpData) {
              const mappedTps = tpData.map((tp: any) => ({
                  id: tp.id, code: tp.code, description: tp.description, semester: tp.semester,
                  scope: tp.scope_name, subjectId: tp.subject_id, criteria: tp.assessment_criteria
              }));
              setTps(mappedTps as any);
          }

          // Fetch Calendar (Lightweight)
          const { data: calData } = await supabase.from('calendar_events').select('*').eq('teacher_id', teacherId);
          if (calData) setCalendarEvents(calData as CalendarEvent[]);

      } catch (err) {
          console.error("Failed to fetch global data", err);
      }
  };

  const resetAppState = () => {
      setCurrentUser(null);
      setIdentity(INITIAL_IDENTITY);
      setStudents([]);
      setClasses([]);
      setSchedules([]);
      setTps([]);
      setAttendanceData({});
      setGradeData({});
      setJournals([]);
      setCalendarEvents([]);
      setIsLoadingAuth(false);
      navigate('/login');
  };

  // --- ACTIONS ---
  
  const handleLogin = async (data: LoginData) => {
    setIsLoadingAuth(true);
    try {
        const cleanEmail = data.email.trim();
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: data.password });
        if (error) {
            Swal.fire({
                 title: 'Gagal Masuk', 
                 text: `${error.message}\n\n[Debug: Pastikan config URL dan API Key benar]`, 
                 icon: 'error'
            });
            setIsLoadingAuth(false);
        }
    } catch (err: any) {
         setIsLoadingAuth(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setIsLoadingAuth(true);
    // ... (Keep existing register logic via Supabase)
    // For brevity, assuming existing logic or RPC
    try {
        // Just a placeholder for the actual complex registration flow
        const { error } = await supabase.auth.signUp({ email: data.email, password: data.password });
        if(error) throw error;
        Swal.fire('Sukses', 'Silahkan cek email untuk verifikasi.', 'success');
        setIsLoadingAuth(false);
    } catch(e: any) {
        Swal.fire('Error', e.message, 'error');
        setIsLoadingAuth(false);
    }
  };

  const handleLogout = async (force: boolean = false) => {
    const performLogout = async () => {
      // Security feature: clear sensitive local caches
      localStorage.removeItem('app_currentUser');
      localStorage.removeItem('app_identity');
      localStorage.removeItem('app_students');
      localStorage.removeItem('app_classes');
      localStorage.removeItem('app_schedules');
      localStorage.removeItem('app_tps');
      localStorage.removeItem('app_subject');
      localStorage.removeItem('app_attendanceData');
      localStorage.removeItem('app_gradeData');
      localStorage.removeItem('app_journals');
      localStorage.removeItem('app_calendarEvents');
      localStorage.removeItem('app_adminWaNumber');
      localStorage.removeItem('supabase.auth.token'); // Fallback clear
      
      queryClient.clear();
      await supabase.auth.signOut();
      navigate('/');
    };

    if (force) {
      await performLogout();
      return;
    }

    Swal.fire({
      title: 'Keluar Aplikasi?', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Keluar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        await performLogout(); 
      }
    });
  };

  const handleSaveIdentity = async (updatedData: IdentityData) => {
      setIdentity(updatedData); // Optimistic Update
      if (!currentUser?.id) return;

      try {
          const { error } = await supabase.from('teachers').update({
              full_name: updatedData.teacherName,
              nip: updatedData.nip,
              role: updatedData.role,
              level: updatedData.level,
              active_semester: updatedData.semester,
              active_academic_year: updatedData.academicYear
          }).eq('id', currentUser.id);

          if (error) {
              console.error("Supabase update error:", error);
              // Silent fail for UX or show simple toast if needed, but optimistic UI is key here
          }
      } catch (err) {
          console.error("Failed to save identity", err);
      }
  };

  // Context Navigation Wrapper
  const handleContextNavigate = (tab: TabView, context: { className?: string, scheduleId?: string, targetDate?: string } = {}) => {
      if (tab === TabView.ATTENDANCE) navigate('/akademik/attendance', { state: context });
      else if (tab === TabView.JOURNAL) navigate('/akademik/journal', { state: context });
      else if (tab === TabView.GRADING) navigate('/akademik/grading', { state: context });
      else if (tab === TabView.CALENDAR) navigate('/akademik/calendar', { state: context });
  };

  if (isLoadingAuth) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background-light">
              <div className="flex flex-col items-center gap-4">
                  <div className="size-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-bold text-sm animate-pulse">Menghubungkan Database...</p>
              </div>
          </div>
      );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 shadow-md sticky top-0 z-[100] text-sm font-medium flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">wifi_off</span>
          Koneksi Terputus - Anda sedang dalam mode offline. Beberapa fitur yang memerlukan sinkronisasi mungkin tidak berjalan.
        </div>
      )}
      <Routes>
        <Route path="/" element={
            currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
            currentUser ? <Navigate to="/dashboard" replace /> : 
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} isLoading={isLoadingAuth} adminWaNumber={adminWaNumber} />
        } />

        <Route path="/admin" element={
            <ProtectedRoute user={currentUser} allowedRoles={['ADMIN']} redirectPath="/">
                <AdminPanel users={allUsers} onAddUser={()=>{}} onDeleteUser={()=>{}} onUpdateUser={()=>{}} onApproveUser={()=>{}} onRejectUser={()=>{}} onGoToApp={() => navigate('/dashboard')} onLogout={handleLogout} waNumber={adminWaNumber} onUpdateWaNumber={setAdminWaNumber} />
            </ProtectedRoute>
        } />

        <Route element={<ProtectedRoute user={currentUser} redirectPath="/"><MainLayout identity={identity} currentUser={currentUser} onLogout={handleLogout} /></ProtectedRoute>}>
            <Route path="dashboard" element={
                <Dashboard 
                    onNavigate={handleContextNavigate} identity={identity} schedules={schedules}
                    classes={classes} students={students} attendanceData={attendanceData}
                    gradeData={gradeData} subject={subject} tps={tps}
                    calendarEvents={calendarEvents}
                    onSaveIdentity={handleSaveIdentity}
                />
            } />
            
            <Route path="identity" element={<IdentityForm data={identity} onSave={handleSaveIdentity} onBack={() => navigate('/dashboard')} onResetSemester={()=>{}} onResetYear={()=>{}} />} />

            <Route path="master">
                <Route path="classes" element={<ClassManager identity={identity} classes={classes} students={students} onUpdateClasses={setClasses} onBack={() => navigate('/dashboard')} />} />
                <Route path="students" element={<StudentManager identity={identity} students={students} classes={classes} onUpdateStudents={setStudents} onUpdateClasses={setClasses} onBack={() => navigate('/dashboard')} />} />
                <Route path="schedules" element={<ScheduleManager schedules={schedules} classes={classes} onUpdateSchedules={setSchedules} onBack={() => navigate('/dashboard')} identity={identity} />} />
            </Route>

            <Route path="curriculum">
                <Route index element={<CurriculumManager identity={identity} subject={subject} tps={tps} onUpdateSubject={()=>{}} onUpdateTPs={setTps} onBack={() => navigate('/dashboard')} />} />
                <Route path="cp-generator" element={<CPGenerator onSave={(newTps) => setTps([...tps, ...newTps])} onBack={() => navigate('/dashboard')} identity={identity} />} />
            </Route>

            <Route path="akademik">
                <Route path="journal" element={<JournalManager journals={journals} onUpdateJournals={setJournals} tps={tps} schedules={schedules} classes={classes} onBack={() => navigate('/dashboard')} />} />
                <Route path="grading" element={<GradingSheet students={students} tps={tps} subject={subject} globalGradeData={gradeData} setGlobalGradeData={setGradeData} identity={identity} />} />
                <Route path="attendance" element={<AttendanceSheet students={students} subject={subject} schedules={schedules} globalAttendance={attendanceData} setGlobalAttendance={setAttendanceData} identity={identity} />} />
                <Route path="calendar" element={<CalendarManager events={calendarEvents} onUpdateEvents={setCalendarEvents} onBack={() => navigate('/dashboard')} />} />
            </Route>

            <Route path="recap">
                <Route path="grades" element={<RecapManager students={students} subject={subject} identity={identity} mode='GRADES' globalAttendance={attendanceData} gradeData={gradeData} tps={tps} />} />
                <Route path="attendance" element={<RecapManager students={students} subject={subject} identity={identity} mode='ATTENDANCE' globalAttendance={attendanceData} gradeData={gradeData} tps={tps} />} />
            </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </QueryClientProvider>
  );
}
