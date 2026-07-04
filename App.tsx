
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
const BillingPaywall = React.lazy(() => import('./components/BillingPaywall').then(m => ({ default: m.BillingPaywall })));

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
            if (session?.user) {
              await handleUserRestored(session.user);
            } else {
              setCurrentUser(null);
              setIsLoadingAuth(false);
            }
        } catch (err) {
            console.error("Session Validation Failed:", err);
            setCurrentUser(null);
            setIsLoadingAuth(false);
        }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleUserRestored(session.user);
      } else if (event === 'SIGNED_OUT') {
        const storedUser = localStorage.getItem('app_currentUser');
        const wasLoggedIn = storedUser && storedUser !== 'null';
        const currentHash = window.location.hash;
        const isPublicPath = !currentHash || currentHash === '#/' || currentHash === '#/login' || currentHash === '#' || currentHash === '#/register';
        if (wasLoggedIn || !isPublicPath) {
          resetAppState();
        } else {
          setCurrentUser(null);
          setIsLoadingAuth(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all users automatically when ADMIN logs in
  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      const fetchAdminUsers = async () => {
        try {
          const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data) {
            setAllUsers(data.map((t: any) => ({
              id: t.id,
              email: t.email,
              name: t.full_name,
              role: t.role,
              level: t.level,
              isActive: t.is_active === true,
              subscriptionPlan: t.subscription_plan || 'NONE',
              subscriptionEndDate: t.subscription_end_date || null,
              password: t.password_plain || ''
            })));
          }
        } catch (err) {
          console.error("Failed to load admin users:", err);
        }
      };
      fetchAdminUsers();
    }
  }, [currentUser]);

  const handleUserRestored = async (authUser: any) => {
      // 1. Fetch Teacher Profile from DB
      let teacherData = null;
      let dbError = null;
      try {
        // Try with schools join first
        const res = await supabase
            .from('teachers')
            .select('*, schools(name)')
            .eq('email', authUser.email)
            .maybeSingle(); // Use maybeSingle to not throw on 0 rows
        
        if (res.error && res.error.message.includes('relationship')) {
             // Fallback if schema doesn't have foreign key
             const fallbackRes = await supabase.from('teachers').select('*').eq('email', authUser.email).maybeSingle();
             teacherData = fallbackRes.data;
             dbError = fallbackRes.error;
        } else {
             teacherData = res.data;
             dbError = res.error;
        }

        if (dbError || !teacherData) {
            const isSuperAdminEmail = authUser.email === 'admin@siguru.com' || authUser.email === 'alimkamcl@gmail.com';
            
            if (isSuperAdminEmail) {
                console.log("Applying Super Admin Fallback for:", authUser.email);
                teacherData = { 
                    full_name: 'Super Admin', 
                    role: 'ADMIN', 
                    level: 'SMA', 
                    is_active: true,
                    id: authUser.id
                };
                
                // Opt-in: Try to silently create the profile to fix future loads
                supabase.from('teachers').upsert({
                    id: authUser.id,
                    email: authUser.email,
                    full_name: 'Super Admin',
                    role: 'ADMIN',
                    level: 'SMA',
                    is_active: true
                }).then(() => {});

            } else {
                console.error("Teacher profile error/not found", dbError);
            }
        }

        const appUser: User = {
            id: teacherData?.id || authUser.id,
            email: authUser.email || '',
            name: teacherData?.full_name || authUser.email?.split('@')[0],
            role: teacherData?.role || 'SUBJECT_TEACHER',
            level: teacherData?.level || 'SMA',
            isActive: teacherData?.is_active === true,
            subscriptionPlan: teacherData?.subscription_plan || 'NONE',
            subscriptionEndDate: teacherData?.subscription_end_date || null
        };

        const isSuperAdmin = appUser.email === 'admin@siguru.com' || appUser.email === 'alimkamcl@gmail.com' || appUser.role === 'ADMIN';

        if (!isSuperAdmin && appUser.subscriptionEndDate && new Date(appUser.subscriptionEndDate) < new Date()) {
            await supabase.auth.signOut();
            Swal.fire({
                title: 'Mohon Maaf',
                text: 'Akun ini sudah mencapai batas waktu penggunaan Paket.',
                icon: 'error',
                showCancelButton: true,
                confirmButtonText: 'Hubungi Admin',
                cancelButtonText: 'Cek Harga Paket',
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#2563eb',
                reverseButtons: true
            }).then((result: any) => {
                if (result.isConfirmed) {
                    const waText = encodeURIComponent(`Halo Admin SiGuru Pro,\n\nAkun saya (${appUser.email}) sudah mencapai batas waktu penggunaan Paket. Saya ingin memperpanjang paket langganan saya.`);
                    window.open(`https://wa.me/${adminWaNumber || '6282335454864'}?text=${waText}`, '_blank');
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    navigate('/');
                    setTimeout(() => {
                        const el = document.getElementById('harga');
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                }
            });
            setIsLoadingAuth(false);
            return;
        }

        if (!appUser.isActive && !isSuperAdmin) {
            await supabase.auth.signOut();
            Swal.fire({
                title: 'Terimakasih sudah mendaftar.',
                text: 'Hubungi admin untuk melakukan verifikasi',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Hubungi Admin',
                cancelButtonText: 'Kembali Ke Beranda',
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            }).then((result: any) => {
                if (result.isConfirmed) {
                    window.open(`https://wa.me/${adminWaNumber || '6282335454864'}`, '_blank');
                }
                navigate('/');
            });
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

  const calculateSubscriptionEndDate = (plan?: string): string => {
    let days = 30; // BASIC
    if (plan === 'TRIWULAN') days = 90;
    else if (plan === 'SEMESTER') days = 180;
    else if (plan === 'PREMIUM') days = 365;
    else if (plan === 'NONE') days = 7;
    
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const handleRegister = async (data: RegisterData) => {
    setIsLoadingAuth(true);
    try {
        const { data: authData, error } = await supabase.auth.signUp({ 
            email: data.email, 
            password: data.password,
            options: {
                data: {
                    full_name: data.name,
                    role: data.role || 'SUBJECT_TEACHER',
                    level: data.level || 'SMA',
                    subscription_plan: data.subscriptionPlan || 'BASIC',
                    password_plain: data.password
                }
            }
        });
        if (error) throw error;
        
        const userId = authData.user?.id;
        if (userId) {
            const endDate = calculateSubscriptionEndDate(data.subscriptionPlan);
            
            // Insert profile into teachers table
            try {
                const { error: dbError } = await supabase.from('teachers').upsert({
                    id: userId,
                    email: data.email,
                    full_name: data.name,
                    role: data.role || 'SUBJECT_TEACHER',
                    level: data.level || 'SMA',
                    is_active: false, // Pending Admin Approval
                    subscription_plan: data.subscriptionPlan || 'BASIC',
                    subscription_end_date: endDate,
                    password_plain: data.password
                });
                
                if (dbError) {
                    console.warn("Client-side insert returned warning (trigger should have handled it):", dbError);
                }
            } catch (dbErr) {
                console.warn("Client-side insert error, trigger probably handled it successfully:", dbErr);
            }
        }
        
        Swal.fire({
            title: 'Terimakasih sudah mendaftar.',
            text: 'Hubungi admin untuk melakukan verifikasi',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Hubungi Admin',
            cancelButtonText: 'Kembali Ke Beranda',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
            reverseButtons: true
        }).then((result: any) => {
            if (result.isConfirmed) {
                window.open(`https://wa.me/${adminWaNumber || '6282335454864'}`, '_blank');
            }
            navigate('/');
        });
        setIsLoadingAuth(false);
    } catch(e: any) {
        Swal.fire('Error', e.message, 'error');
        setIsLoadingAuth(false);
    }
  };

  const handleLogout = async (force: boolean = false) => {
    const performLogout = async () => {
      // Security feature: clear sensitive local caches
      localStorage.clear();
      sessionStorage.clear();
      
      queryClient.clear();
      await supabase.auth.signOut();
      navigate('/');
    };

    if (force) {
      await performLogout();
      return;
    }

    Swal.fire({
      title: 'Keluar Aplikasi?', 
      text: 'Anda akan keluar dan semua cache sesi akan dihapus.',
      icon: 'question', 
      showCancelButton: true, 
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        await performLogout(); 
      }
    });
  };

  // --- ADMIN ACTIONS (DATABASE SYNC) ---

  const handleAdminAddUser = async (userForm: RegisterData) => {
    try {
      // Create Auth user via Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password || '123456'
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Gagal membuat user ID dari Auth.");

      // Calculate initial end date based on plan or custom input
      let endDate: string | null = null;
      if (userForm.role === 'ADMIN') {
        endDate = null;
      } else if (userForm.subscriptionPlan === 'NONE') {
        endDate = null;
      } else if (userForm.subscriptionEndDate) {
        endDate = new Date(userForm.subscriptionEndDate + 'T23:59:59').toISOString();
      } else {
        endDate = calculateSubscriptionEndDate(userForm.subscriptionPlan);
      }

      // Insert into teachers
      const { error: dbError } = await supabase.from('teachers').insert({
        id: userId,
        email: userForm.email,
        full_name: userForm.name,
        role: userForm.role || 'SUBJECT_TEACHER',
        level: userForm.level || 'SMA',
        is_active: true, // Manual admin creations are auto-activated
        subscription_plan: userForm.subscriptionPlan || 'BASIC',
        subscription_end_date: endDate,
        password_plain: userForm.password
      });
      if (dbError) throw dbError;

      Swal.fire('Sukses', `Akses guru "${userForm.name}" berhasil dibuat.`, 'success');
      
      // Refresh User list
      const { data: updatedUsers } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
      if (updatedUsers) {
        setAllUsers(updatedUsers.map((t: any) => ({
          id: t.id,
          email: t.email,
          name: t.full_name,
          role: t.role,
          level: t.level,
          isActive: t.is_active === true,
          subscriptionPlan: t.subscription_plan || 'NONE',
          subscriptionEndDate: t.subscription_end_date || null,
          password: t.password_plain || ''
        })));
      }
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleAdminUpdateUser = async (userId: string, userForm: RegisterData) => {
    try {
      const existingUser = allUsers.find(u => u.id === userId);
      if (!existingUser) throw new Error("Pengguna tidak ditemukan.");

      // Calculate end date. If user specified custom date in form, use it!
      let endDate: string | null = null;
      if (userForm.role === 'ADMIN') {
        endDate = null;
      } else if (userForm.subscriptionPlan === 'NONE') {
        endDate = null;
      } else if (userForm.subscriptionEndDate) {
        endDate = new Date(userForm.subscriptionEndDate + 'T23:59:59').toISOString();
      } else if (existingUser.subscriptionPlan !== userForm.subscriptionPlan) {
        endDate = calculateSubscriptionEndDate(userForm.subscriptionPlan);
      } else {
        endDate = existingUser.subscriptionEndDate;
      }

      const { error: dbError } = await supabase.from('teachers').update({
        full_name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        level: userForm.level,
        subscription_plan: userForm.subscriptionPlan,
        subscription_end_date: endDate
      }).eq('id', userId);

      if (dbError) throw dbError;

      Swal.fire('Sukses', `Data "${userForm.name}" berhasil diperbarui.`, 'success');

      // Refresh User list
      const { data: updatedUsers } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
      if (updatedUsers) {
        setAllUsers(updatedUsers.map((t: any) => ({
          id: t.id,
          email: t.email,
          name: t.full_name,
          role: t.role,
          level: t.level,
          isActive: t.is_active === true,
          subscriptionPlan: t.subscription_plan || 'NONE',
          subscriptionEndDate: t.subscription_end_date || null,
          password: t.password_plain || ''
        })));
      }
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleAdminDeleteUser = async (userId: string) => {
    try {
      const { error: dbError } = await supabase.from('teachers').delete().eq('id', userId);
      if (dbError) throw dbError;

      Swal.fire('Terhapus', 'Akun guru telah dihapus.', 'success');

      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleAdminApproveUser = async (userId: string) => {
    try {
      const { error: dbError } = await supabase.from('teachers').update({
        is_active: true
      }).eq('id', userId);

      if (dbError) throw dbError;

      Swal.fire('Disetujui', 'Pendaftaran guru telah disetujui.', 'success');

      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true } : u));
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleAdminRejectUser = async (userId: string) => {
    try {
      const { error: dbError } = await supabase.from('teachers').delete().eq('id', userId);
      if (dbError) throw dbError;

      Swal.fire('Ditolak', 'Pendaftaran guru telah ditolak dan dihapus.', 'success');

      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    }
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
            currentUser ? <Navigate to={currentUser.role === 'ADMIN' ? "/admin" : "/dashboard"} replace /> : <LandingPage />
        } />
        <Route path="/login" element={
            currentUser ? <Navigate to={currentUser.role === 'ADMIN' ? "/admin" : "/dashboard"} replace /> : 
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} isLoading={isLoadingAuth} adminWaNumber={adminWaNumber} />
        } />

        <Route path="/admin" element={
            <ProtectedRoute user={currentUser} allowedRoles={['ADMIN']} redirectPath="/">
                <AdminPanel 
                    users={allUsers} 
                    onAddUser={handleAdminAddUser} 
                    onDeleteUser={handleAdminDeleteUser} 
                    onUpdateUser={handleAdminUpdateUser} 
                    onApproveUser={handleAdminApproveUser} 
                    onRejectUser={handleAdminRejectUser} 
                    onGoToApp={() => navigate('/dashboard')} 
                    onLogout={() => handleLogout()} 
                    waNumber={adminWaNumber} 
                    onUpdateWaNumber={setAdminWaNumber} 
                />
            </ProtectedRoute>
        } />

        <Route element={
          <ProtectedRoute user={currentUser} redirectPath="/">
            {currentUser && currentUser.role !== 'ADMIN' && currentUser.subscriptionEndDate && new Date(currentUser.subscriptionEndDate) < new Date() ? (
              <BillingPaywall user={currentUser} onLogout={() => handleLogout(true)} adminWaNumber={adminWaNumber} />
            ) : (
              <MainLayout identity={identity} currentUser={currentUser} onLogout={() => handleLogout()} />
            )}
          </ProtectedRoute>
        }>
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
