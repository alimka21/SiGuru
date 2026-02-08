
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from './utils/supabase'; 
import { Dashboard } from './components/Dashboard'; 
import { LoginPage, RegisterData, LoginData } from './components/LoginPage';
import { MainLayout } from './components/layouts/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotFound } from './components/NotFound';

// --- LAZY LOAD COMPONENTS ---
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
  
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // --- SETTINGS STATE ---
  const [adminWaNumber, setAdminWaNumber] = useState('6282335454864');

  // --- APP DATA STATE (Global Context fetched from DB) ---
  const [identity, setIdentity] = useState<IdentityData>(INITIAL_IDENTITY);
  const [students, setStudents] = useState<Student[]>([]); 
  const [classes, setClasses] = useState<ClassInfo[]>([]); 
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]); 
  const [tps, setTps] = useState<LearningObjective[]>([]); 
  const [subject, setSubject] = useState<Subject>({ id: 's1', name: 'Mata Pelajaran', kktp: 75 });
  
  // NOTE: Grade, Attendance, Journal data are now fetched inside their specific components 
  // to avoid loading too much data at start. Passing empty/defaults here.
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [gradeData, setGradeData] = useState<GradeData>({}); 
  const [journals, setJournals] = useState<JournalEntry[]>([]); 
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

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
            id: teacherData?.id || authUser.id, // Use Teacher ID for relations
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
        
        // 2. Fetch Global Master Data (Classes, Students, TPs)
        await fetchGlobalData(appUser.id, teacherData);

        if (appUser.role === 'ADMIN') {
           navigate('/admin');
        } else {
           const hash = window.location.hash;
           if (!hash || hash === '#/login' || hash === '#/') {
               navigate('/dashboard');
           }
        }
      } catch (e) {
          console.error("Login process failed", e);
      } finally {
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
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        if (error) {
            Swal.fire('Gagal Masuk', error.message, 'error');
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

  const handleLogout = async () => {
    Swal.fire({
      title: 'Keluar Aplikasi?', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Keluar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut(); 
      }
    });
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
      <Routes>
        <Route path="/login" element={
            currentUser ? <Navigate to="/dashboard" replace /> : 
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} isLoading={isLoadingAuth} adminWaNumber={adminWaNumber} />
        } />

        <Route path="/admin" element={
            <ProtectedRoute user={currentUser} allowedRoles={['ADMIN']}>
                <AdminPanel users={allUsers} onAddUser={()=>{}} onDeleteUser={()=>{}} onUpdateUser={()=>{}} onApproveUser={()=>{}} onRejectUser={()=>{}} onGoToApp={() => navigate('/dashboard')} onLogout={handleLogout} waNumber={adminWaNumber} onUpdateWaNumber={setAdminWaNumber} />
            </ProtectedRoute>
        } />

        <Route element={<ProtectedRoute user={currentUser}><MainLayout identity={identity} currentUser={currentUser} onLogout={handleLogout} /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={
                <Dashboard 
                    onNavigate={handleContextNavigate} identity={identity} schedules={schedules}
                    classes={classes} students={students} attendanceData={attendanceData}
                    gradeData={gradeData} subject={subject} tps={tps}
                    calendarEvents={calendarEvents} 
                />
            } />
            
            <Route path="identity" element={<IdentityForm data={identity} onSave={setIdentity} onBack={() => navigate('/dashboard')} onResetSemester={()=>{}} onResetYear={()=>{}} />} />

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
