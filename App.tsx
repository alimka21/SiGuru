
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
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

import { 
  Student, LearningObjective, Subject, IdentityData, 
  ScheduleItem, AttendanceData, ClassInfo, GradeData, User, UserStorageData, JournalEntry, TabView
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
    schoolName: 'Nama Sekolah',
    teacherName: 'Nama Guru',
    nip: '',
    subjectName: 'Mata Pelajaran',
    semester: 'Genap',
    academicYear: '2025/2026',
    className: '',
    studentCount: 0
};

// Loader for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400 animate-in fade-in zoom-in duration-300">
       <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          <span className="text-sm font-bold tracking-wide">Memuat Halaman...</span>
       </div>
  </div>
);

// Wrapper component to handle routing logic inside BrowserRouter
const AppContent = () => {
  const navigate = useNavigate();
  
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // --- SETTINGS STATE ---
  const [adminWaNumber, setAdminWaNumber] = useState(() => {
    return localStorage.getItem('siguru_admin_wa') || '6282335454864';
  });

  // --- APP DATA STATE ---
  const [identity, setIdentity] = useState<IdentityData>(INITIAL_IDENTITY);
  const [students, setStudents] = useState<Student[]>([]); 
  const [classes, setClasses] = useState<ClassInfo[]>([]); 
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]); 
  const [tps, setTps] = useState<LearningObjective[]>([]); 
  const [subject, setSubject] = useState<Subject>({ id: 's1', name: 'Mata Pelajaran', kktp: 75 });
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [gradeData, setGradeData] = useState<GradeData>({}); 
  const [journals, setJournals] = useState<JournalEntry[]>([]); 

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
      let meta = authUser.user_metadata || {};
      let isActive = false; 

      if (isSupabaseConfigured) {
          try {
            const { data: teacherData } = await supabase
                .from('teachers')
                .select('role, is_active, full_name, level')
                .eq('email', authUser.email)
                .single();
            
            if (teacherData) {
                meta.role = teacherData.role;
                meta.full_name = teacherData.full_name;
                meta.level = teacherData.level; 
                isActive = teacherData.is_active === true;
            }
          } catch (e) { console.error("Auth restore error", e); }
      }

      const appUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: meta.full_name || authUser.email?.split('@')[0] || 'Guru',
          role: authUser.email === 'admin@siguru.com' || meta.role === 'ADMIN' ? 'ADMIN' : (meta.role || 'SUBJECT_TEACHER'),
          level: meta.level || 'SMA',
          isActive: isActive
      };
      
      if (!appUser.isActive && appUser.email !== 'admin@siguru.com') {
          await supabase.auth.signOut();
          Swal.fire({ title: 'Akun Belum Aktif', text: 'Silahkan hubungi Admin sekolah.', icon: 'warning' });
          setIsLoadingAuth(false);
          return;
      }

      loadUserData(appUser); 
      setCurrentUser(appUser);
      
      if (appUser.role === 'ADMIN') {
         fetchRealUsersList(); 
         navigate('/admin');
      } else {
         // Only navigate if we are on login page to avoid overriding deep links
         // With HashRouter, window.location.pathname will be the base path, hash will be separate.
         // We check if hash is empty or just #/login
         const hash = window.location.hash;
         if (!hash || hash === '#/login' || hash === '#/') {
             navigate('/dashboard');
         }
      }
      setIsLoadingAuth(false);
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
      setIsLoadingAuth(false);
      sessionStorage.clear();
      navigate('/login');
  };

  const fetchRealUsersList = async () => {
      if (!isSupabaseConfigured) return;
      try {
          const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
          if (data) {
              const mappedUsers: User[] = data.map((t: any) => ({
                  id: t.id, email: t.email, name: t.full_name, role: t.role,
                  level: t.level || 'SMA', isActive: t.is_active === true, password: t.plain_password 
              }));
              setAllUsers(mappedUsers);
          }
      } catch (err) { console.error("Failed to fetch users", err); }
  };

  const loadUserData = (user: User) => {
        const storageKey = `siguru_data_${user.email}`;
        const savedDataStr = sessionStorage.getItem(storageKey);
        let dataLoaded = false;

        if (savedDataStr) {
          try {
            const data: UserStorageData = JSON.parse(savedDataStr);
            if (data && data.identity) {
                setIdentity(data.identity);
                setStudents(data.students || []);
                setClasses(data.classes || []);
                setSchedules(data.schedules || []);
                setTps(data.tps || []);
                setSubject(data.subject);
                setAttendanceData(data.attendanceData || {});
                setGradeData(data.gradeData || {});
                setJournals(data.journals || []);
                dataLoaded = true;
            } 
          } catch (e) { console.error("Failed to parse saved data", e); }
        }
        
        if (!dataLoaded) {
            setIdentity({
              ...INITIAL_IDENTITY, 
              teacherName: user.name,
              role: user.role === 'ADMIN' ? 'SUBJECT_TEACHER' : user.role, 
              level: user.level || 'SMA'
            });
        }
  };

  useEffect(() => {
    setIdentity(prev => ({ ...prev, studentCount: students.length }));
  }, [students.length]);

  const saveDataToStorage = useCallback(() => {
    if (!currentUser) return;
    const storageKey = `siguru_data_${currentUser.email}`;
    const payload: UserStorageData = { identity, students, classes, schedules, tps, subject, attendanceData, gradeData, journals };
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  }, [currentUser, identity, students, classes, schedules, tps, subject, attendanceData, gradeData, journals]);

  useEffect(() => {
    if (currentUser) {
      const timeout = setTimeout(saveDataToStorage, 1000); 
      return () => clearTimeout(timeout);
    }
  }, [saveDataToStorage, currentUser]);

  // --- ACTIONS ---
  const handleLogin = async (data: LoginData) => {
    setIsLoadingAuth(true);
    if (!isSupabaseConfigured) {
        Swal.fire('Error', 'Supabase belum dikonfigurasi.', 'error');
        setIsLoadingAuth(false);
        return;
    }
    try {
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        if (error) {
            Swal.fire('Gagal Masuk', error.message, 'error');
            setIsLoadingAuth(false);
        }
    } catch (err: any) {
         console.error("Login Error:", err);
         setIsLoadingAuth(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setIsLoadingAuth(true);
    try {
        const { data: existingTeacher } = await supabase.from('teachers').select('id').eq('email', data.email).single();
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email, password: data.password,
            options: { data: { full_name: data.name, role: data.role, level: data.level } }
        });

        if (authError) throw authError;

        if (authData.user) {
            if (existingTeacher) {
                await supabase.from('teachers').update({ user_id: authData.user.id, full_name: data.name, role: data.role, level: data.level }).eq('id', existingTeacher.id);
            } else {
                await supabase.from('teachers').insert({ user_id: authData.user.id, email: data.email, full_name: data.name, role: data.role, level: data.level, is_active: false });
            }
            Swal.fire('Registrasi Berhasil', 'Menunggu persetujuan Admin.', 'success');
        }
        setIsLoadingAuth(false);
    } catch (err: any) {
        Swal.fire('Registrasi Gagal', err.message, 'error');
        setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    Swal.fire({
      title: 'Keluar Aplikasi?', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Keluar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        saveDataToStorage(); 
        if (isSupabaseConfigured) await supabase.auth.signOut(); 
        else resetAppState(); 
      }
    });
  };

  const handleIdentitySave = useCallback((data: IdentityData) => setIdentity(data), []);
  const handleSaveGeneratedTPs = useCallback((newTps: LearningObjective[]) => {
      setTps(prev => [...prev, ...newTps]);
      Swal.fire('Tersimpan!', `${newTps.length} TP berhasil ditambahkan.`, 'success');
      navigate('/curriculum');
  }, [navigate]);

  // Context Navigation Wrapper
  const handleContextNavigate = (tab: TabView, context: { className?: string, scheduleId?: string } = {}) => {
      // Logic to map legacy TabView to Routes (mostly for Dashboard widgets)
      if (tab === TabView.ATTENDANCE) {
          navigate('/akademik/attendance', { state: context });
      } else if (tab === TabView.JOURNAL) {
          navigate('/akademik/journal', { state: context });
      } else if (tab === TabView.GRADING) {
          navigate('/akademik/grading', { state: context });
      } else {
          // Default fallbacks handled by Sidebar links mostly
          console.log("Navigating to:", tab, context);
      }
  };

  // Helper for admin actions (simplified for brevity as they are passed to AdminPanel)
  const adminActions = {
      onAddUser: async (d: RegisterData) => { /* logic */ }, 
      onDeleteUser: async (id: string) => { /* logic */ },
      onUpdateUser: async (id: string, d: RegisterData) => { /* logic */ },
      onApproveUser: async (id: string) => { /* logic */ },
      onRejectUser: async (id: string) => { /* logic */ },
      onUpdateWaNumber: (num: string) => { 
          setAdminWaNumber(num); 
          localStorage.setItem('siguru_admin_wa', num);
          Swal.fire('Sukses', 'WA diperbarui', 'success');
      }
  };

  // Loading Screen
  if (isLoadingAuth) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background-light">
              <div className="flex flex-col items-center gap-4">
                  <div className="size-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-bold text-sm animate-pulse">Memuat Data...</p>
              </div>
          </div>
      );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PUBLIC ROUTE */}
        <Route 
            path="/login" 
            element={
                currentUser ? <Navigate to="/dashboard" replace /> : 
                <LoginPage onLogin={handleLogin} onRegister={handleRegister} isLoading={isLoadingAuth} adminWaNumber={adminWaNumber} />
            } 
        />

        {/* ADMIN ROUTE */}
        <Route 
            path="/admin" 
            element={
                <ProtectedRoute user={currentUser} allowedRoles={['ADMIN']}>
                    <AdminPanel 
                        users={allUsers} 
                        {...adminActions}
                        onGoToApp={() => navigate('/dashboard')}
                        onLogout={handleLogout}
                        waNumber={adminWaNumber}
                    />
                </ProtectedRoute>
            } 
        />

        {/* PROTECTED APP ROUTES */}
        <Route element={<ProtectedRoute user={currentUser}><MainLayout identity={identity} currentUser={currentUser} onLogout={handleLogout} /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={
                <Dashboard 
                    onNavigate={handleContextNavigate} identity={identity} schedules={schedules}
                    classes={classes} students={students} attendanceData={attendanceData}
                    gradeData={gradeData} subject={subject} tps={tps}
                />
            } />
            
            <Route path="identity" element={
                <IdentityForm data={identity} onSave={handleIdentitySave} onBack={() => navigate('/dashboard')} />
            } />

            {/* MASTER DATA */}
            <Route path="master">
                <Route path="classes" element={
                    <ClassManager identity={identity} classes={classes} students={students} onUpdateClasses={setClasses} onBack={() => navigate('/dashboard')} />
                } />
                <Route path="students" element={
                    <StudentManager identity={identity} students={students} classes={classes} onUpdateStudents={setStudents} onUpdateClasses={setClasses} onBack={() => navigate('/dashboard')} />
                } />
                <Route path="schedules" element={
                    <ScheduleManager schedules={schedules} classes={classes} onUpdateSchedules={setSchedules} onBack={() => navigate('/dashboard')} />
                } />
            </Route>

            {/* CURRICULUM */}
            <Route path="curriculum">
                <Route index element={
                    <CurriculumManager identity={identity} subject={subject} tps={tps} onUpdateSubject={(kktp) => setSubject(prev => ({...prev, kktp}))} onUpdateTPs={setTps} onBack={() => navigate('/dashboard')} />
                } />
                <Route path="cp-generator" element={
                    <CPGenerator onSave={handleSaveGeneratedTPs} onBack={() => navigate('/dashboard')} />
                } />
            </Route>

            {/* AKADEMIK */}
            <Route path="akademik">
                <Route path="journal" element={
                    <JournalManager journals={journals} onUpdateJournals={setJournals} tps={tps} schedules={schedules} classes={classes} onBack={() => navigate('/dashboard')} />
                } />
                <Route path="grading" element={
                    <GradingSheet students={students} tps={tps} subject={subject} globalGradeData={gradeData} setGlobalGradeData={setGradeData} />
                } />
                <Route path="attendance" element={
                    <AttendanceSheet students={students} subject={subject} schedules={schedules} globalAttendance={attendanceData} setGlobalAttendance={setAttendanceData} />
                } />
            </Route>

            {/* RECAP */}
            <Route path="recap">
                <Route path="grades" element={
                    <RecapManager students={students} subject={subject} identity={identity} mode='GRADES' globalAttendance={attendanceData} gradeData={gradeData} tps={tps} />
                } />
                <Route path="attendance" element={
                    <RecapManager students={students} subject={subject} identity={identity} mode='ATTENDANCE' globalAttendance={attendanceData} gradeData={gradeData} tps={tps} />
                } />
            </Route>
        </Route>

        {/* 404 CATCH ALL */}
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
