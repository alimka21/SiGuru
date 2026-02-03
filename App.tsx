
import React, { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './utils/supabase'; // Import Supabase Client
import { GradingSheet } from './components/GradingSheet';
import { AttendanceSheet } from './components/AttendanceSheet';
import { Dashboard } from './components/Dashboard';
import { IdentityForm } from './components/IdentityForm';
import { CurriculumManager } from './components/CurriculumManager';
import { ClassManager } from './components/ClassManager';
import { StudentManager } from './components/StudentManager';
import { ScheduleManager } from './components/ScheduleManager';
import { CPGenerator } from './components/CPGenerator';
import { RecapManager } from './components/RecapManager';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { 
  TabView, Student, LearningObjective, Subject, IdentityData, 
  ScheduleItem, AttendanceData, ClassInfo, GradeData, User, UserStorageData 
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
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Default true to check session first

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

  // Context State for Navigation
  const [navContext, setNavContext] = useState<{ className?: string, scheduleId?: string }>({});

  // =================================================================================
  // 1. SUPABASE AUTHENTICATION CHECK
  // =================================================================================
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        handleUserRestored(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        handleUserRestored(session.user);
      } else {
        setCurrentUser(null);
        setActiveTab(TabView.LOGIN);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserRestored = (authUser: any) => {
      // Map Supabase User to App User
      const appUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Guru',
          role: authUser.email === 'admin@siguru.com' ? 'ADMIN' : 'USER', // Simple admin check logic
          isActive: true
      };
      setCurrentUser(appUser);
      loadUserData(appUser.email);
      
      // Determine Tab
      if (appUser.role === 'ADMIN') {
         setActiveTab(TabView.ADMIN_PANEL);
      } else {
         setActiveTab(TabView.DASHBOARD);
      }
      setIsLoadingAuth(false);
  };

  // =================================================================================
  // 2. DATA LOADING (From LocalStorage for now, keyed by Email)
  // =================================================================================
  const loadUserData = (email: string) => {
        const storageKey = `siguru_data_${email}`;
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
          } catch (e) {
            console.error("Failed to parse saved data", e);
          }
        } else {
            // Defaults
            setIdentity({...INITIAL_IDENTITY, teacherName: email.split('@')[0]});
        }
  };

  // Update student count in Identity
  useEffect(() => {
    setIdentity(prev => ({ ...prev, studentCount: students.length }));
  }, [students.length]);

  // =================================================================================
  // 3. PERSISTENCE LAYER (Save Logic - LocalStorage + Supabase Placeholder)
  // =================================================================================
  
  // Function to save current state
  const saveDataToStorage = useCallback(() => {
    if (!currentUser) return;
    
    // 1. Save to LocalStorage (Instant)
    const storageKey = `siguru_data_${currentUser.email}`;
    const payload: UserStorageData = {
      identity,
      students,
      classes,
      schedules,
      tps,
      subject,
      attendanceData,
      gradeData
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    
    // 2. Future: Save to Supabase DB
    // Since we have a relational DB setup in Supabase (from Blueprint), 
    // a proper sync would require mapping this JSON back to SQL Tables.
    // For now, we keep data local to browser but attached to the logged-in Supabase user.
  }, [currentUser, identity, students, classes, schedules, tps, subject, attendanceData, gradeData]);

  // Auto-save on any data change
  useEffect(() => {
    if (currentUser && activeTab !== TabView.LOGIN && activeTab !== TabView.ADMIN_PANEL) {
      const timeout = setTimeout(saveDataToStorage, 1000); 
      return () => clearTimeout(timeout);
    }
  }, [saveDataToStorage, currentUser, activeTab]);


  // =================================================================================
  // 4. AUTH HANDLERS (Supabase)
  // =================================================================================

  const handleLogin = async (email: string) => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            // Set this to your production URL when deploying to Vercel
            emailRedirectTo: window.location.origin, 
        }
    });

    if (error) {
        Swal.fire({
            title: 'Gagal Mengirim Link',
            text: error.message,
            icon: 'error'
        });
        setIsLoadingAuth(false);
    } else {
        // UI is handled in LoginPage by waiting for promise
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
        saveDataToStorage(); // Ensure save before exit
        await supabase.auth.signOut();
        setCurrentUser(null);
        setActiveTab(TabView.LOGIN);
      }
    });
  };

  // =================================================================================
  // 5. APP LOGIC HANDLERS (Wrappers to update State)
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

  // --- MOCK ADMIN HANDLERS (For UI Demo only, since real users are in Supabase Auth now) ---
  const handleAddUser = (email: string, name: string) => {
      Swal.fire('Info', 'Gunakan Supabase Dashboard untuk mengundang user via email.', 'info');
  };
  const handleDeleteUser = (id: string) => {
      Swal.fire('Info', 'Gunakan Supabase Dashboard untuk menghapus user.', 'info');
  };
  const handleUpdateUser = (id: string, name: string) => {
     // Local visual update only
  };


  // =================================================================================
  // RENDER
  // =================================================================================

  if (!currentUser || activeTab === TabView.LOGIN) {
    return <LoginPage onLogin={handleLogin} isLoading={isLoadingAuth} />;
  }

  if (activeTab === TabView.ADMIN_PANEL && currentUser?.role === 'ADMIN') {
    return (
      <AdminPanel 
        users={[currentUser]} // Mock list for now
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
        onGoToApp={() => setActiveTab(TabView.DASHBOARD)}
        onLogout={handleLogout}
      />
    );
  }

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
                  <p className="text-slate-500 text-[10px] font-normal mt-0.5">App Admin Guru</p>
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
                  <p className="text-slate-500 text-[10px] truncate">{currentUser?.email}</p>
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
                    <CPGenerator 
                        onSave={handleSaveGeneratedTPs}
                        onBack={() => handleContextNavigate(TabView.DASHBOARD)}
                    />
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
