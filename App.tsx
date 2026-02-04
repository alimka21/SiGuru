
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from './utils/supabase'; // Import Supabase Client and Config Flag
import { GradingSheet } from './components/GradingSheet';
import { AttendanceSheet } from './components/AttendanceSheet';
import { Dashboard } from './components/Dashboard';
import { IdentityForm } from './components/IdentityForm';
import { CurriculumManager } from './components/CurriculumManager';
import { ClassManager } from './components/ClassManager';
import { StudentManager } from './components/StudentManager';
import { ScheduleManager } from './components/ScheduleManager';
// Lazy load CPGenerator to isolate Google GenAI dependency issues
const CPGenerator = React.lazy(() => import('./components/CPGenerator').then(module => ({ default: module.CPGenerator })));

import { RecapManager } from './components/RecapManager';
import { JournalManager } from './components/JournalManager'; // Import Journal Manager
import { LoginPage, RegisterData, LoginData } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { 
  TabView, Student, LearningObjective, Subject, IdentityData, 
  ScheduleItem, AttendanceData, ClassInfo, GradeData, User, UserStorageData, JournalEntry 
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

// INITIAL DATA TEMPLATE (New User gets this)
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

// MOCK DATA FOR ADMIN PANEL DEMO
// In a real app, this would be fetched from 'auth.users' or 'public.teachers' via Supabase Admin API
const MOCK_ALL_USERS: User[] = [
  { id: 'u1', email: 'guru1@sekolah.id', name: 'Budi Santoso', role: 'SUBJECT_TEACHER', level: 'SMA', isActive: true },
  { id: 'u2', email: 'guru2@sekolah.id', name: 'Siti Aminah', role: 'CLASS_TEACHER', level: 'SD', isActive: true },
  { id: 'u3', email: 'calon1@sekolah.id', name: 'Rudi Hartono (Baru)', role: 'SUBJECT_TEACHER', level: 'SMP', isActive: false },
  { id: 'u4', email: 'calon2@sekolah.id', name: 'Dewi Sartika (Baru)', role: 'CLASS_TEACHER', level: 'SD', isActive: false },
];

// Modified NavItem to handle collapsed state
const NavItem = ({ active, label, icon, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined} // Show tooltip on hover when collapsed
    className={`flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 
      ${active ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}
      ${collapsed ? 'justify-center w-full px-0' : 'px-3 w-full text-left'}
    `}
  >
    <span className={`material-symbols-outlined ${collapsed ? 'text-[24px]' : 'text-[20px]'}`}>{icon}</span>
    {!collapsed && (
      <p className="text-sm font-semibold whitespace-nowrap overflow-hidden transition-opacity duration-200 opacity-100">
        {label}
      </p>
    )}
  </button>
);

export default function App() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  
  // State for Admin Panel Management (Mock)
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_ALL_USERS);

  // --- SETTINGS STATE ---
  // Default WA Number (bisa diganti di Admin Panel)
  const [adminWaNumber, setAdminWaNumber] = useState(() => {
    return localStorage.getItem('siguru_admin_wa') || '6282335454864';
  });

  // --- VIEW STATE ---
  const [activeTab, setActiveTab] = useState<TabView>(TabView.LOGIN);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Sidebar State
  
  // --- APP DATA STATE (Per User) ---
  const [identity, setIdentity] = useState<IdentityData>(INITIAL_IDENTITY);
  const [students, setStudents] = useState<Student[]>([]); 
  const [classes, setClasses] = useState<ClassInfo[]>([]); 
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]); 
  const [tps, setTps] = useState<LearningObjective[]>([]); 
  const [subject, setSubject] = useState<Subject>({ id: 's1', name: 'Mata Pelajaran', kktp: 75 });
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [gradeData, setGradeData] = useState<GradeData>({}); 
  const [journals, setJournals] = useState<JournalEntry[]>([]); // New Journal State

  // Context State for Navigation
  const [navContext, setNavContext] = useState<{ className?: string, scheduleId?: string }>({});

  // =================================================================================
  // 1. SUPABASE AUTHENTICATION & SESSION MANAGEMENT
  // =================================================================================
  useEffect(() => {
    if (!isSupabaseConfigured) {
        setIsLoadingAuth(false);
        return;
    }

    // 1. Check Initial Session (Auto-login from localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserRestored(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    }).catch(err => {
        console.error("Supabase Session Check Error:", err);
        setIsLoadingAuth(false);
    });

    // 2. Listen for Auth Changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        handleUserRestored(session.user);
      } else if (event === 'SIGNED_OUT') {
        resetAppState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserRestored = async (authUser: any) => {
      // Map Supabase User to App User
      const meta = authUser.user_metadata || {};
      
      // Determine isActive status. 
      // Rule: Default to TRUE if undefined (legacy), unless explicitly set to FALSE.
      // For NEW registrations, we set it to false.
      const isActiveStatus = meta.isActive === undefined ? true : meta.isActive;

      const appUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: meta.full_name || authUser.email?.split('@')[0] || 'Guru',
          role: authUser.email === 'admin@siguru.com' || meta.role === 'ADMIN' ? 'ADMIN' : (meta.role || 'SUBJECT_TEACHER'),
          level: meta.level || 'SMA',
          isActive: isActiveStatus
      };
      
      // BLOCK LOGIN IF NOT ACTIVE (Except Admin)
      if (!appUser.isActive && appUser.role !== 'ADMIN') {
          await supabase.auth.signOut();
          Swal.fire({
              title: 'Akun Belum Aktif',
              text: 'Pendaftaran Anda sedang menunggu verifikasi Admin. Silahkan hubungi admin atau coba lagi nanti.',
              icon: 'warning'
          });
          setIsLoadingAuth(false);
          return;
      }

      setCurrentUser(appUser);
      
      // If Admin, ensure current user is in the mock list
      if (appUser.role === 'ADMIN') {
          setAllUsers(prev => {
              if (prev.find(u => u.id === appUser.id)) return prev;
              return [...prev, appUser];
          });
      }

      loadUserData(appUser); // Load local app data
      
      // Auto Redirect to Dashboard/Admin
      if (appUser.role === 'ADMIN') {
         setActiveTab(TabView.ADMIN_PANEL);
      } else {
         setActiveTab(TabView.DASHBOARD);
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
      setActiveTab(TabView.LOGIN);
      setIsLoadingAuth(false);
  };

  // =================================================================================
  // 2. DATA LOADING (From LocalStorage for now, keyed by Email)
  // =================================================================================
  const loadUserData = (user: User) => {
        const storageKey = `siguru_data_${user.email}`;
        const savedDataStr = localStorage.getItem(storageKey);
        
        if (savedDataStr) {
          try {
            const data: UserStorageData = JSON.parse(savedDataStr);
            setIdentity(data.identity);
            setStudents(data.students || []);
            setClasses(data.classes || []);
            setSchedules(data.schedules || []);
            setTps(data.tps || []);
            setSubject(data.subject);
            setAttendanceData(data.attendanceData || {});
            setGradeData(data.gradeData || {});
            setJournals(data.journals || []);
          } catch (e) {
            console.error("Failed to parse saved data", e);
          }
        } else {
            // Defaults for new user -> APPLY REGISTERED ROLE & LEVEL
            setIdentity({
              ...INITIAL_IDENTITY, 
              teacherName: user.name,
              role: user.role === 'ADMIN' ? 'SUBJECT_TEACHER' : user.role, // Default fallback if admin logs in to app view
              level: user.level || 'SMA'
            });
        }
  };

  // Update student count in Identity
  useEffect(() => {
    setIdentity(prev => ({ ...prev, studentCount: students.length }));
  }, [students.length]);

  // =================================================================================
  // 3. PERSISTENCE LAYER (Save App Data to LocalStorage)
  // =================================================================================
  
  const saveDataToStorage = useCallback(() => {
    if (!currentUser) return;
    
    // Save App Data locally (separate from Auth Session)
    const storageKey = `siguru_data_${currentUser.email}`;
    const payload: UserStorageData = {
      identity,
      students,
      classes,
      schedules,
      tps,
      subject,
      attendanceData,
      gradeData,
      journals
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [currentUser, identity, students, classes, schedules, tps, subject, attendanceData, gradeData, journals]);

  // Auto-save on data change
  useEffect(() => {
    if (currentUser && activeTab !== TabView.LOGIN && activeTab !== TabView.ADMIN_PANEL) {
      const timeout = setTimeout(saveDataToStorage, 1000); 
      return () => clearTimeout(timeout);
    }
  }, [saveDataToStorage, currentUser, activeTab]);

  // Update settings handler
  const handleUpdateWaNumber = (newNumber: string) => {
    setAdminWaNumber(newNumber);
    localStorage.setItem('siguru_admin_wa', newNumber);
    Swal.fire('Sukses', 'Nomor WhatsApp Admin berhasil diperbarui.', 'success');
  };


  // =================================================================================
  // 4. AUTH ACTIONS
  // =================================================================================

  const handleLogin = async (data: LoginData) => {
    setIsLoadingAuth(true);

    if (!isSupabaseConfigured) {
        Swal.fire({
            title: 'Konfigurasi Hilang', 
            text: 'URL Supabase atau Anon Key belum diset di file .env.', 
            icon: 'error'
        });
        setIsLoadingAuth(false);
        return;
    }

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
        });

        if (error) {
            let errorMsg = error.message;
            let errorTitle = 'Gagal Masuk';
            
            if (error.message.includes("Invalid login credentials")) {
                errorTitle = "Akun Tidak Ditemukan / Password Salah";
                errorMsg = "Mohon cek ejaan email dan password Anda.";
            } else if (error.message.toLowerCase().includes("email not confirmed")) {
                errorTitle = "Email Belum Dikonfirmasi";
                errorMsg = "Akun Anda belum aktif karena email belum diverifikasi.";
            } else if (error.message.toLowerCase().includes("failed to fetch")) {
                errorTitle = "Koneksi Bermasalah";
                errorMsg = "Gagal menghubungi server database.";
            } else if (error.message.toLowerCase().includes("email logins are disabled")) {
                errorTitle = "Fitur Login Email Belum Aktif";
                errorMsg = "Provider Email belum diaktifkan di Supabase Dashboard.";
            }
            
            Swal.fire({ title: errorTitle, text: errorMsg, icon: 'error' });
            setIsLoadingAuth(false);
        }
    } catch (err: any) {
         console.error("Login Error:", err);
         Swal.fire({ title: 'Error Sistem', text: 'Terjadi kesalahan jaringan yang tidak terduga.', icon: 'error' });
         setIsLoadingAuth(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setIsLoadingAuth(true);

    if (!isSupabaseConfigured) {
        Swal.fire({ title: 'Konfigurasi Hilang', text: 'Database belum diset.', icon: 'error' });
        setIsLoadingAuth(false);
        return;
    }

    try {
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                emailRedirectTo: window.location.origin, 
                data: {
                  full_name: data.name,
                  role: data.role,
                  level: data.level,
                  isActive: false // SET DEFAULT INACTIVE
                }
            }
        });

        if (error) {
            Swal.fire({ title: 'Registrasi Gagal', text: error.message, icon: 'error' });
            setIsLoadingAuth(false);
        } else {
            Swal.fire({
                title: 'Registrasi Berhasil!',
                html: `
                    <p>Akun Anda telah dibuat.</p>
                    <div class="bg-yellow-50 text-yellow-800 p-3 rounded text-sm mt-3 border border-yellow-200">
                        <strong>Menunggu Verifikasi Admin</strong><br/>
                        Anda belum bisa login sampai Admin mengaktifkan akun Anda. Silahkan cek email verifikasi terlebih dahulu.
                    </div>
                `,
                icon: 'success'
            });
            setIsLoadingAuth(false);
        }
    } catch (err: any) {
        Swal.fire({ title: 'Error Sistem', text: 'Gagal melakukan registrasi.', icon: 'error' });
        setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    Swal.fire({
      title: 'Keluar Aplikasi?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        saveDataToStorage(); 
        if (isSupabaseConfigured) {
            await supabase.auth.signOut(); 
        } else {
            resetAppState(); 
        }
      }
    });
  };

  // =================================================================================
  // 5. APP LOGIC HANDLERS
  // =================================================================================

  const handleIdentitySave = (newData: IdentityData) => {
      setIdentity(newData);
      setSubject(prev => ({...prev, name: newData.subjectName}));
  };

  const handleSaveGeneratedTPs = (newTPs: LearningObjective[]) => {
      const existingCount = tps.length;
      const formattedTPs = newTPs.map((tp, idx) => ({
          ...tp,
          code: `TP.${existingCount + idx + 1}`,
          lms: [],
          criteria: [],
          scopeId: identity.role === 'CLASS_TEACHER' ? 'math' : 'lvl-7' 
      }));
      setTps([...tps, ...formattedTPs]);
      setActiveTab(TabView.CURRICULUM);
  };

  const handleContextNavigate = (tab: TabView, context?: { className?: string, scheduleId?: string }) => {
    if (context) setNavContext(context);
    else setNavContext({});
    setActiveTab(tab);
  };

  // --- ADMIN HANDLERS (UPDATED) ---
  
  const handleAddUser = (data: RegisterData) => {
      // In a real app with Admin Service Role, this would create a user in Supabase.
      console.log("Adding User Manual:", data);
      
      // Simulate adding to local list for demo
      const newUser: User = {
          id: `new-${Date.now()}`,
          email: data.email,
          name: data.name,
          role: data.role,
          level: data.level,
          isActive: true // Admin-added users are active by default
      };
      setAllUsers([...allUsers, newUser]);

      Swal.fire('Sukses', 'Pengguna berhasil ditambahkan (Simulasi).', 'success');
  };

  const handleDeleteUser = (id: string) => {
      setAllUsers(prev => prev.filter(u => u.id !== id));
      Swal.fire('Terhapus', 'Pengguna berhasil dihapus.', 'success');
  };

  // UPDATED: Handle full update including password logic for simulation
  const handleUpdateUser = (id: string, data: RegisterData) => {
     setAllUsers(prev => prev.map(u => u.id === id ? { 
         ...u, 
         name: data.name,
         email: data.email,
         role: data.role,
         level: data.level
     } : u));

     let message = 'Data pengguna berhasil diperbarui.';
     if (data.password) {
         message += ' Password juga telah direset (Simulasi).';
         console.log(`[Mock] Password for user ${id} reset to: ${data.password}`);
     }
     
     Swal.fire('Sukses', message, 'success');
  };

  const handleApproveUser = (id: string) => {
      // In real app: Call supabase function to update user metadata
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u));
      Swal.fire('Diaktifkan', 'User berhasil diaktifkan. Mereka sekarang bisa login.', 'success');
  };

  const handleRejectUser = (id: string) => {
      // In real app: Delete user or keep as banned
      Swal.fire({
          title: 'Tolak Pengguna?',
          text: "Pengguna ini akan dihapus dari daftar.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Tolak & Hapus'
      }).then((result: any) => {
          if (result.isConfirmed) {
              setAllUsers(prev => prev.filter(u => u.id !== id));
              Swal.fire('Ditolak', 'Pengajuan pengguna ditolak.', 'success');
          }
      });
  };


  // =================================================================================
  // RENDER
  // =================================================================================

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

  // Login Page with Admin Contact Prop
  if (!currentUser) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        isLoading={isLoadingAuth}
        adminWaNumber={adminWaNumber} 
      />
    );
  }

  // Admin Panel with Settings
  if (activeTab === TabView.ADMIN_PANEL && currentUser?.role === 'ADMIN') {
    return (
      <AdminPanel 
        users={allUsers} // Pass All Users (Real + Mock)
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
        onApproveUser={handleApproveUser} // New Handler
        onRejectUser={handleRejectUser} // New Handler
        onGoToApp={() => setActiveTab(TabView.DASHBOARD)}
        onLogout={handleLogout}
        waNumber={adminWaNumber}
        onUpdateWaNumber={handleUpdateWaNumber}
      />
    );
  }

  // Main App Dashboard
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen font-sans">
        {/* Sidebar */}
        <aside 
          className={`
            border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 z-50 shadow-sm transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'w-[88px]' : 'w-64'}
          `}
        >
          {/* Sidebar Header (Fixed) */}
          <div className={`p-6 pb-2 flex ${isSidebarCollapsed ? 'justify-center' : 'items-center justify-between'}`}>
            <div className={`flex items-center gap-3 transition-all duration-200 ${isSidebarCollapsed ? 'mb-4' : 'mb-6'}`}>
              <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                <span className="material-symbols-outlined">auto_stories</span>
              </div>
              {!isSidebarCollapsed && (
                <div className="whitespace-nowrap overflow-hidden">
                  <h1 className="text-slate-900 text-base font-bold leading-tight">SiGuru</h1>
                  <p className="text-slate-500 text-sm font-normal mt-0.5">App Admin Guru</p>
                </div>
              )}
            </div>
            {/* Toggle Button */}
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-slate-50 mb-6"
                title="Ciutkan Sidebar"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
            )}
          </div>

          {/* Collapsed Toggle */}
          {isSidebarCollapsed && (
             <div className="flex justify-center mb-4">
                 <button 
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200"
                  title="Luaskan Sidebar"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
             </div>
          )}
          
          {/* Sidebar Menu (Scrollable) */}
          <div className={`flex-1 overflow-y-auto pb-4 custom-scrollbar ${isSidebarCollapsed ? 'px-3' : 'px-6'}`}>
            <div className="flex flex-col gap-1">
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.DASHBOARD} label="Dashboard" icon="dashboard" onClick={() => handleContextNavigate(TabView.DASHBOARD)} />
              
              <div className="my-2 border-t border-slate-100"></div>
              
              {!isSidebarCollapsed ? (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Master Data</p>
              ) : (
                <div className="h-4"></div> /* Spacer for collapsed mode */
              )}

              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.CLASS_MASTER} label="Master Kelas" icon="school" onClick={() => handleContextNavigate(TabView.CLASS_MASTER)} />
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.STUDENT_MASTER} label="Master Siswa" icon="group" onClick={() => handleContextNavigate(TabView.STUDENT_MASTER)} />
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.SCHEDULE_MASTER} label="Master Jadwal" icon="calendar_month" onClick={() => handleContextNavigate(TabView.SCHEDULE_MASTER)} />
              
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.CP_GENERATOR} label="Generate TP (AI)" icon="psychology" onClick={() => handleContextNavigate(TabView.CP_GENERATOR)} />
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.CURRICULUM} label="Kurikulum" icon="book" onClick={() => handleContextNavigate(TabView.CURRICULUM)} />
              
              <div className="my-2 border-t border-slate-100"></div>
              
              {!isSidebarCollapsed ? (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Akademik</p>
              ) : (
                <div className="h-4"></div>
              )}

              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.JOURNAL} label="Jurnal Guru" icon="edit_note" onClick={() => handleContextNavigate(TabView.JOURNAL)} />
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.GRADING} label="Input Nilai" icon="assignment_turned_in" onClick={() => handleContextNavigate(TabView.GRADING)} />
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.RECAP_GRADES} label="Rekap Nilai" icon="grade" onClick={() => handleContextNavigate(TabView.RECAP_GRADES)} />
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.ATTENDANCE} label="Presensi" icon="how_to_reg" onClick={() => handleContextNavigate(TabView.ATTENDANCE)} />
              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.RECAP_ATTENDANCE} label="Rekap Presensi" icon="fact_check" onClick={() => handleContextNavigate(TabView.RECAP_ATTENDANCE)} />
              
              <div className="my-2 border-t border-slate-100"></div>
              
              {!isSidebarCollapsed ? (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">System</p>
              ) : (
                 <div className="h-4"></div>
              )}

              <NavItem collapsed={isSidebarCollapsed} active={activeTab === TabView.IDENTITY} label="Pengaturan" icon="settings" onClick={() => handleContextNavigate(TabView.IDENTITY)} />
            </div>
          </div>
          
          {/* Sidebar Footer (Fixed) */}
          <div className="p-4 flex flex-col gap-1 border-t border-slate-200 bg-white z-10 transition-all duration-300">
            <div className={`flex items-center gap-3 py-2 rounded-xl border border-slate-100 transition-all ${isSidebarCollapsed ? 'justify-center bg-transparent border-transparent' : 'bg-slate-50 px-3'}`}>
              <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm shrink-0">
                {identity.teacherName.charAt(0)}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <p className="text-slate-900 text-sm font-bold truncate">{identity.teacherName}</p>
                  <p className="text-slate-500 text-sm truncate">{currentUser?.email}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Navbar */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-3 sticky top-0 z-40 h-[72px] shadow-sm">
             <div className="flex items-center gap-2 text-slate-500 text-sm">
               {currentUser?.role === 'ADMIN' && (
                 <button onClick={() => setActiveTab(TabView.ADMIN_PANEL)} className="flex items-center gap-1 hover:text-primary font-bold bg-slate-100 px-3 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Kembali ke Admin
                 </button>
               )}
             </div>
             
             {/* Logout Button */}
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-bold"
             >
                <span className="material-symbols-outlined">logout</span>
                Logout
             </button>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-background-light custom-scrollbar flex flex-col">
            <div className="flex-1 p-8">
                {activeTab === TabView.DASHBOARD && (
                <Dashboard 
                    onNavigate={handleContextNavigate} 
                    identity={identity} 
                    schedules={schedules}
                    classes={classes}
                    students={students}
                    attendanceData={attendanceData}
                    gradeData={gradeData}
                    subject={subject}
                />
                )}
                
                {activeTab === TabView.IDENTITY && (
                    <IdentityForm 
                    data={identity} 
                    onSave={handleIdentitySave} 
                    onBack={() => handleContextNavigate(TabView.DASHBOARD)} 
                    />
                )}

                {activeTab === TabView.CURRICULUM && (
                    <CurriculumManager 
                    identity={identity}
                    subject={subject}
                    tps={tps}
                    onUpdateSubject={(kktp) => setSubject(prev => ({...prev, kktp}))}
                    onUpdateTPs={setTps}
                    onBack={() => handleContextNavigate(TabView.DASHBOARD)}
                    />
                )}

                {activeTab === TabView.CP_GENERATOR && (
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full p-12 text-slate-400">
                             <div className="flex flex-col items-center gap-2">
                                <span className="size-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></span>
                                <span className="text-sm font-bold">Memuat Modul AI...</span>
                             </div>
                        </div>
                    }>
                        <CPGenerator 
                            onSave={handleSaveGeneratedTPs}
                            onBack={() => handleContextNavigate(TabView.DASHBOARD)}
                        />
                    </Suspense>
                )}

                {activeTab === TabView.CLASS_MASTER && (
                    <ClassManager 
                        identity={identity}
                        classes={classes}
                        students={students}
                        onUpdateClasses={setClasses}
                        onBack={() => handleContextNavigate(TabView.DASHBOARD)} 
                    />
                )}

                {activeTab === TabView.STUDENT_MASTER && (
                    <StudentManager 
                        students={students}
                        classes={classes}
                        onUpdateStudents={setStudents}
                        onUpdateClasses={setClasses}
                        onBack={() => handleContextNavigate(TabView.DASHBOARD)} 
                    />
                )}

                {activeTab === TabView.SCHEDULE_MASTER && (
                    <ScheduleManager 
                        schedules={schedules} 
                        onUpdateSchedules={setSchedules}
                        onBack={() => handleContextNavigate(TabView.DASHBOARD)} 
                    />
                )}

                {activeTab === TabView.JOURNAL && (
                    <JournalManager 
                        journals={journals}
                        onUpdateJournals={setJournals}
                        tps={tps}
                        schedules={schedules}
                        classes={classes}
                        initialContext={navContext}
                        onBack={() => handleContextNavigate(TabView.DASHBOARD)}
                    />
                )}
                
                {activeTab === TabView.GRADING && (
                    <GradingSheet 
                    students={students}
                    tps={tps}
                    subject={subject}
                    initialClass={navContext.className}
                    globalGradeData={gradeData}
                    setGlobalGradeData={setGradeData}
                    />
                )}
                
                {activeTab === TabView.ATTENDANCE && (
                    <AttendanceSheet 
                    students={students}
                    subject={subject}
                    schedules={schedules}
                    initialClass={navContext.className}
                    initialScheduleId={navContext.scheduleId}
                    globalAttendance={attendanceData}
                    setGlobalAttendance={setAttendanceData}
                    />
                )}

                {(activeTab === TabView.RECAP_GRADES || activeTab === TabView.RECAP_ATTENDANCE) && (
                    <RecapManager 
                    students={students}
                    subject={subject}
                    identity={identity}
                    mode={activeTab === TabView.RECAP_GRADES ? 'GRADES' : 'ATTENDANCE'}
                    globalAttendance={attendanceData}
                    />
                )}
            </div>

            {/* Application Footer */}
            <footer className="py-6 text-center border-t border-slate-200/60 mt-auto bg-background-light">
                <p className="text-xs font-bold text-slate-400">
                    SiGuru - Aplikasi Administrasi Guru  <span className="mx-1 text-slate-300">|</span>  Copyright 2026
                </p>
            </footer>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
