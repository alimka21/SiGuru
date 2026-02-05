
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { IdentityData, User } from '../../types';

interface MainLayoutProps {
  identity: IdentityData;
  currentUser: User | null;
  onLogout: () => void;
}

// Updated NavItem to accept 'state' prop for routing context
const NavItem = ({ to, label, icon, collapsed, state }: any) => {
  const location = useLocation();
  // Check if active based on path AND state (if provided)
  let isActive = location.pathname === to;
  
  // Special check for grading tabs to highlight correct sidebar item
  if (isActive && state?.initialTab) {
      const currentState = location.state as any;
      if (currentState?.initialTab !== state.initialTab) {
          isActive = false;
      }
  }

  return (
    <Link
      to={to}
      state={state} // Pass state here
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 
        ${isActive ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}
        ${collapsed ? 'justify-center w-full px-0' : 'px-3 w-full text-left'}
      `}
    >
      <span className={`material-symbols-outlined ${collapsed ? 'text-[24px]' : 'text-[20px]'}`}>{icon}</span>
      {!collapsed && (
        <p className="text-sm font-semibold whitespace-nowrap overflow-hidden transition-opacity duration-200 opacity-100">
          {label}
        </p>
      )}
    </Link>
  );
};

export const MainLayout: React.FC<MainLayoutProps> = ({ identity, currentUser, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen font-sans">
      {/* Sidebar */}
      <aside 
        className={`
          border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 z-50 shadow-sm transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'w-[88px]' : 'w-64'}
        `}
      >
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
          {!isSidebarCollapsed && (
            <button onClick={() => setIsSidebarCollapsed(true)} className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-slate-50 mb-6">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
           <div className="flex justify-center mb-4">
               <button onClick={() => setIsSidebarCollapsed(false)} className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200">
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
           </div>
        )}
        
        <div className={`flex-1 overflow-y-auto pb-4 custom-scrollbar ${isSidebarCollapsed ? 'px-3' : 'px-6'}`}>
          <div className="flex flex-col gap-1">
            <NavItem collapsed={isSidebarCollapsed} to="/dashboard" label="Dashboard" icon="dashboard" />
            
            <div className="my-2 border-t border-slate-100"></div>
            {!isSidebarCollapsed ? <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Master Data</p> : <div className="h-4"></div>}

            <NavItem collapsed={isSidebarCollapsed} to="/master/classes" label="Master Kelas" icon="school" />
            <NavItem collapsed={isSidebarCollapsed} to="/master/students" label="Master Siswa" icon="group" />
            <NavItem collapsed={isSidebarCollapsed} to="/master/schedules" label="Master Jadwal" icon="calendar_month" />
            
            <NavItem collapsed={isSidebarCollapsed} to="/curriculum/cp-generator" label="Generate TP (AI)" icon="psychology" />
            <NavItem collapsed={isSidebarCollapsed} to="/curriculum" label="Kurikulum" icon="book" />
            
            <div className="my-2 border-t border-slate-100"></div>
            {!isSidebarCollapsed ? <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Akademik</p> : <div className="h-4"></div>}

            <NavItem collapsed={isSidebarCollapsed} to="/akademik/journal" label="Jurnal Guru" icon="edit_note" />
            
            {/* UPDATED GRADING MENU */}
            <NavItem 
                collapsed={isSidebarCollapsed} 
                to="/akademik/grading" 
                label="Asesmen / Nilai" 
                icon="equalizer" 
            />

            <NavItem collapsed={isSidebarCollapsed} to="/akademik/attendance" label="Presensi" icon="how_to_reg" />
            
            <div className="my-2 border-t border-slate-100"></div>
            {!isSidebarCollapsed ? <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Laporan</p> : <div className="h-4"></div>}
            
            <NavItem collapsed={isSidebarCollapsed} to="/recap/grades" label="Rekap Nilai" icon="grade" />
            <NavItem collapsed={isSidebarCollapsed} to="/recap/attendance" label="Rekap Presensi" icon="fact_check" />
            
            <div className="my-2 border-t border-slate-100"></div>
            {!isSidebarCollapsed ? <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">System</p> : <div className="h-4"></div>}

            <NavItem collapsed={isSidebarCollapsed} to="/identity" label="Pengaturan" icon="settings" />
          </div>
        </div>
        
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
               <button onClick={() => navigate('/admin')} className="flex items-center gap-1 hover:text-primary font-bold bg-slate-100 px-3 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Kembali ke Admin
               </button>
             )}
           </div>
           
           <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-bold">
              <span className="material-symbols-outlined">logout</span>
              Logout
           </button>
        </header>

        {/* Scrollable Content Area with Outlet */}
        <div className="flex-1 overflow-y-auto bg-background-light custom-scrollbar flex flex-col">
          <div className="flex-1 p-8">
              <Outlet />
          </div>

          <footer className="py-6 text-center border-t border-slate-200/60 mt-auto bg-background-light">
              <p className="text-xs font-bold text-slate-400">SiGuru - Aplikasi Administrasi Guru  <span className="mx-1 text-slate-300">|</span>  Copyright 2026</p>
          </footer>
        </div>
      </main>
    </div>
  );
};
